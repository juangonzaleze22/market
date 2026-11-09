# Despliegue con Docker + Nginx

Guía para ejecutar Market completo (Angular + NestJS + PostgreSQL) con Docker,
probar en local y subirlo después a un VPS.

---

## 1. Cómo funciona (lo mínimo que hay que entender)

Docker empaqueta cada parte de la app en una **imagen** (un "instalador" con
todo lo necesario). Al ejecutarla se convierte en un **contenedor** (un proceso
aislado). Docker Compose levanta varios contenedores juntos.

En este proyecto hay 3 servicios:

| Servicio | Imagen | Qué hace | Puerto |
|---|---|---|---|
| `db` | `postgres:16-alpine` | Base de datos | interno 5432 |
| `backend` | `backend/Dockerfile` | API NestJS | interno 3000 |
| `web` | `frontend/Dockerfile` | Nginx + Angular compilado + proxy al backend | público 80 |

Flujo de una petición:

```
Navegador
   │
   ▼
[ web: nginx ]
   ├── /            → archivos estáticos de Angular
   ├── /api/*       → backend:3000
   ├── /uploads/*   → backend:3000
   └── /socket.io/* → backend:3000 (WebSockets)
   │
   ▼
[ backend: NestJS ] ──► [ db: PostgreSQL ]
```

Dentro de la red de Docker los contenedores se ven por **nombre** (`db`,
`backend`). Por eso el backend usa `DB_HOST=db` y nginx usa
`proxy_pass http://backend:3000`.

Los **volúmenes** son carpetas que sobreviven a los reinicios:

- `db_data` → datos de PostgreSQL.
- `uploads_data` → imágenes/comprobantes subidos (`/app/uploads`).

> Importante: nada de esto toca tu instalación local ni tu PostgreSQL actual.
> Docker es un mundo aparte.

### Tooling necesario

- Windows/Mac: **Docker Desktop** (incluye Docker Compose).
- VPS Linux: Docker Engine + plugin `docker compose` (ver sección VPS).
- Verificar: `docker --version` y `docker compose version`.

---

## 2. Desarrollo: dos formas de trabajar

### A. Día a día (recomendada, igual que ahora)

Backend y frontend corren en tu máquina con hot reload. Docker solo se usa
para la infraestructura (PostgreSQL + MailDev).

```powershell
# 1. Levanta Postgres y MailDev en contenedores
npm run dev:infra

# 2. En otra terminal, backend + frontend con hot reload
npm run dev
```

- App: `http://localhost:4200`
- API: `http://localhost:3000/api`
- Correos de prueba: `http://localhost:1080`

`dev:infra` lee las credenciales de `backend/.env`, así que el contenedor de
PostgreSQL y el backend local usan el mismo usuario/clave/base.

Para apagar la infraestructura:

```powershell
npm run dev:infra:down
```

> Si ya tienes PostgreSQL local corriendo en el puerto 5432, detén ese servicio
> o no uses `dev:infra`; no pueden ocupar el mismo puerto.

### B. Probar el stack completo como en producción

Compila Angular y ejecuta los 3 contenedores. Sirve para validar builds,
nginx, PWA y el proxy antes de subir al VPS.

```powershell
# 1. Crea el archivo de variables (una sola vez)
Copy-Item .env.example .env

# 2. Levanta todo
npm run docker:up

# 3. Abrir
# http://localhost
```

Primer arranque: `.env.example` trae `DB_SYNCHRONIZE=true` y `RUN_SEED=true`,
así que las tablas y datos demo se crean solos. Trae también
`NODE_ENV=development` y `MAIL_LOG_ONLY=true` para que no exija proveedor de
correo. Los correos se imprimen en los logs:

```powershell
npm run docker:logs
```

Comandos útiles:

```powershell
npm run docker:ps       # estado de contenedores
npm run docker:logs     # logs en vivo
npm run docker:down     # apagar (conserva datos en volúmenes)
docker compose down -v  # apagar y BORRAR datos (db y uploads)
```

Para reconstruir después de cambiar código:

```powershell
npm run docker:up
```

---

## 3. Variables de entorno

Hay dos archivos y **no se mezclan**:

| Archivo | Quién lo usa | Cuándo |
|---|---|---|
| `backend/.env` | Backend en local (sin Docker) | `npm run dev` |
| `.env` (raíz) | Docker Compose y el backend en contenedor | `docker compose` |

El `.env` de la raíz se crea copiando `.env.example`:

```powershell
Copy-Item .env.example .env
```

Cosas que debes cambiar antes de producción:

- `DB_PASSWORD` y `JWT_SECRET`: largos y aleatorios.
- `FRONTEND_URL`: `https://tudominio.com`.
- Proveedor de correo: `MAILJET_*` o `RESEND_API_KEY` o `SMTP_*`, y
  `MAIL_LOG_ONLY=false`.
- `NODE_ENV=production`.
- `AUTH_REQUIRE_EMAIL_VERIFICATION=true`.
- `AUTH_EXPOSE_VERIFICATION_TOKEN=false` (el backend no arranca en producción
  si está en `true`).
- `DB_SYNCHRONIZE` y `RUN_SEED` en `false` **después** del primer arranque.
- `HTTP_PORT=8080` si vas a poner Caddy delante (ver TLS).

> El frontend se compila con `.env.production` (dentro de `frontend/`), que ya
> usa rutas relativas `API_URL=/api`. Por eso funciona en cualquier dominio sin
> recompilar. Los demás valores (mapas, moneda, etc.) salen de
> `frontend/.env.production`.

---

## 4. Primer arranque en producción (sin datos demo)

Un VPS nuevo no tiene tablas. Como el proyecto aún no usa migraciones, el
primer arranque debe crear el esquema con `DB_SYNCHRONIZE=true`.

1. `.env`:
   ```env
   NODE_ENV=production
   DB_SYNCHRONIZE=true
   RUN_SEED=false
   ```
2. `docker compose up -d --build`
3. Verifica `http://IP-del-vps/api` y los logs.
4. **Bloquea el modo automático**:
   ```env
   DB_SYNCHRONIZE=false
   ```
5. `docker compose up -d` para aplicar.

`RUN_SEED=true` crea usuarios demo con claves conocidas
(`admin@example.com/admin123`, etc.). **No lo dejes activo en producción.**
Si lo usas para crear el primer admin, cambia la contraseña inmediatamente o
crea el usuario desde la base de datos.

> A futuro conviene migrar a migraciones de TypeORM y usar
> `migrationsRun` en vez de `synchronize`. Mientras tanto, este flujo es el
> seguro para no perder columnas por accidente.

Si la base de datos **ya existía** de una versión anterior, no uses
`synchronize`: aplica el script `backend/scripts/migrate-auth-security.sql`
dentro del contenedor:

```bash
docker compose exec -T db psql -U postgres -d market_db < backend/scripts/migrate-auth-security.sql
```

---

## 5. Subir al VPS

### 5.1 Preparar el servidor

1. VPS Ubuntu 24.04 con IP pública y tu dominio apuntando a esa IP (registro A).
2. Firewall: permitir solo `22`, `80` y `443`.
3. Instalar Docker (script oficial):

   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   # cerrar sesión y volver a entrar
   ```

4. Verificar: `docker --version && docker compose version`.

> **RAM:** compilar Angular + NestJS dentro del VPS necesita ~2 GB libres. Si el
> VPS tiene 1 GB, crea 2 GB de swap antes de construir
> (`sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`)
> o compila las imágenes en tu máquina y súbelas a un registry.

### 5.2 Subir el código

Opción simple: git.

```bash
git clone <tu-repo> market
cd market
cp .env.example .env
nano .env
```

Si el repo no incluye los subproyectos, sube la carpeta completa por `scp`/rsync.

### 5.3 Arrancar

```bash
# Primer arranque: DB_SYNCHRONIZE=true, NODE_ENV=production, correo real
docker compose up -d --build

# Verificar
docker compose ps
docker compose logs -f backend
```

Abrir `http://tudominio.com`. Cuando funcione, poner `DB_SYNCHRONIZE=false` y
`docker compose up -d`.

### 5.4 HTTPS (TLS)

> Si usas **Dokploy** (sección 5.5), salta esta sección: su Traefik ya hace TLS
> automático.

El nginx incluido habla HTTP. Para HTTPS hay dos caminos:

**Recomendado: Caddy en el host (automático, renueva solo).**

1. En `.env`, publica la app en un puerto local:
   ```env
   HTTP_PORT=8080
   TRUST_PROXY=2
   ```
   ```bash
   docker compose up -d
   ```
2. Instala Caddy y crea `/etc/caddy/Caddyfile`:
   ```
   tudominio.com {
       reverse_proxy 127.0.0.1:8080
   }
   ```
3. `sudo systemctl enable --now caddy`

Caddy obtiene y renueva el certificado de Let's Encrypt solo. Recuerda usar
`https://tudominio.com` en `FRONTEND_URL`.

**Alternativa: nginx del host + certbot** (más pasos) o un proxy de Cloudflare.

> `TRUST_PROXY=2` es necesario porque el backend queda detrás de Caddy y del
> nginx del contenedor. Con solo el nginx incluido, deja `TRUST_PROXY=1`.

---

## 5.5 · Despliegue con Dokploy (recomendado)

Dokploy es un panel self-hosted sobre Docker + Traefik: deploys desde git
(`main`), TLS automático (Let's Encrypt) y variables/volúmenes desde la UI.
Con Dokploy **no necesitas Caddy** (sección 5.4): Traefik ocupa 80/443 y enruta
tu dominio. Por eso existe `docker-compose.dokploy.yml`, que no publica puertos
en `web` y trae los labels de Traefik.

### 5.5.1 Instalar Dokploy

1. VPS Ubuntu 24.04 (Hostinger ofrece Dokploy como plantilla; si no):
   ```bash
   curl -sSL https://dokploy.com/install.sh | sh
   ```
2. Abre `http://IP-del-vps:3000` y crea el usuario admin.
3. Settings → Server: activa **HTTPS/Let's Encrypt** y pon un email válido.

> Traefik de Dokploy ocupa `80` y `443`. No publiques esos puertos desde el
> compose (`docker-compose.dokploy.yml` ya no los expone). Tampoco levantes
> Caddy/nginx del host.

### 5.5.2 Crear la aplicación

1. Settings → Git: conecta GitHub/GitLab y autoriza el repo.
2. Create Application → **Docker Compose**.
3. Configura:
   - **Repository:** tu repo.
   - **Branch:** `main`.
   - **Compose Path:** `./docker-compose.dokploy.yml`.
   - Build context: raíz del repo (por defecto).
4. En **Environment**, pega tus variables (equivale al `.env` de la raíz). Mínimo:
   ```env
   APP_DOMAIN=tudominio.com
   NODE_ENV=production
   FRONTEND_URL=https://tudominio.com
   TRUST_PROXY=2
   DB_USERNAME=postgres
   DB_PASSWORD=<clave-larga-y-aleatoria>
   DB_NAME=market_db
   JWT_SECRET=<secreto-largo-y-aleatorio>
   JWT_EXPIRES_IN=7d
   DB_SYNCHRONIZE=true      # solo el primer deploy
   RUN_SEED=false
   AUTH_REQUIRE_EMAIL_VERIFICATION=true
   AUTH_EXPOSE_VERIFICATION_TOKEN=false
   MAIL_FROM="Market <no-reply@tudominio.com>"
   MAIL_PROVIDER=<mailjet|resend|smtp>
   MAIL_LOG_ONLY=false
   ```
   Copia el resto de `.env.example` (credenciales de correo, SMTP, etc.).
5. **Deploy**.

> `env_file: .env` del compose lee el archivo que Dokploy genera con estas
> variables. `APP_DOMAIN` es obligatorio: sin él, Traefik no crea el router.
> Si prefieres la pestaña **Domains** del panel, borra el bloque `labels:` del
> servicio `web` y añade ahí `dominio → servicio web → puerto 80`.

### 5.5.3 DNS y TLS

1. Registro `A` de `APP_DOMAIN` → IP del VPS (espera propagación).
2. En el primer deploy, Traefik emite el certificado y redirige HTTP→HTTPS.
   Si al principio no carga, espera 1–2 min y revisa los logs de Traefik.

### 5.5.4 Primer arranque y bloqueo de `synchronize`

1. Primer deploy con `DB_SYNCHRONIZE=true` y `RUN_SEED=false`.
2. Verifica `https://tudominio.com/api` y los logs del backend.
3. Cambia `DB_SYNCHRONIZE=false` en Environment y pulsa **Redeploy**.

### 5.5.5 Actualizaciones

- **Auto-deploy:** activa el webhook que genera Dokploy en GitHub → cada push a
  `main` redeploya.
- **Manual:** botón **Deploy** en el panel.

### 5.5.6 Volúmenes y backups

Los volúmenes nombrados (`db_data`, `uploads_data`) persisten entre deploys.
Backup igual que la sección 6, ejecutando `docker compose` desde el directorio
del proyecto (o usando la terminal del panel). Dokploy guarda cada app en
`/etc/dokploy/compose/<app>/code`.

---

## 6. Backups

Base de datos:

```bash
docker compose exec -T db pg_dump -U postgres market_db > backup-$(date +%F).sql
```

Uploads (volumen `uploads_data`):

```bash
docker run --rm -v market_uploads_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Guarda ambos fuera del VPS (otro disco, S3, etc.). Automatiza con cron.

---

## 7. Actualizar la app

```bash
git pull
docker compose up -d --build
```

Docker reconstruye las imágenes y recrea solo lo necesario. Los volúmenes
(`db_data`, `uploads_data`) se conservan.

---

## 8. Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `web` no arranca y espera a `backend` | El backend está unhealthy. `docker compose logs backend`. Suele ser correo no configurado en `production` o DB inaccesible. |
| `permission denied` en uploads | El volumen se creó antes con otro dueño. `docker compose down -v` (borra datos) o `docker compose exec -u root backend chown -R node:node /app/uploads`. |
| No aparecen tablas | Primer arranque sin `DB_SYNCHRONIZE=true`. Actívalo, levanta, y vuelve a `false`. |
| Imágenes 404 | Verifica que `/uploads/` esté proxificado en `frontend/nginx.conf` y que el volumen exista. |
| WebSockets no conectan | Debe existir el bloque `/socket.io/` con `Upgrade`/`Connection` en `nginx.conf`. |
| Cambios no se reflejan | `docker compose up -d --build` (hay que reconstruir imágenes). |
| Error de CORS | `FRONTEND_URL` debe coincidir exactamente con el origen (incluye `https://`). |

---

## 9. Resumen de archivos

```
docker-compose.yml          # stack completo: db + backend + web (local/manual)
docker-compose.dokploy.yml  # variante para Dokploy (Traefik, sin puerto en web)
docker-compose.dev.yml      # solo infra dev: postgres + maildev
.env.example                # variables para Docker (copiar a .env)
backend/Dockerfile          # build multi-stage de NestJS
backend/.dockerignore
frontend/Dockerfile         # build de Angular + nginx
frontend/nginx.conf         # estáticos, proxy /api, /uploads, /socket.io
frontend/.dockerignore
```
