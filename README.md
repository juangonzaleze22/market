# 🛒 Market E-commerce

Aplicación e-commerce full-stack con **Angular 20**, **NestJS 12**, **PostgreSQL** y **Tailwind CSS**.

---

## 📁 Estructura del Proyecto

```
Market/
├── backend/                 # NestJS API
├── frontend/                # Angular App
├── docs/
│   └── ER.md               # Diagrama Entidad-Relación
├── .tools/
│   └── node/               # Node.js v24.20.0 LTS (local)
├── start-backend.ps1       # Script para iniciar backend
├── start-frontend.ps1      # Script para iniciar frontend
├── start-dev.ps1           # Script para iniciar ambos
└── package.json            # Scripts unificados
```

---

## 🚀 Requisitos Previos

- Windows 10/11
- PostgreSQL 14+ instalado localmente
- Git (opcional)

> **Nota:** Node.js está incluido localmente en `.tools/node` (v24.20.0 LTS). No necesitas instalarlo globalmente.

---

## ⚙️ Configuración de PostgreSQL

1. Asegúrate de que el servicio de PostgreSQL esté corriendo:
   ```powershell
   Get-Service postgresql*
   ```

2. Crea la base de datos `market_db`:
   ```powershell
   $env:PGPASSWORD = "tu_contraseña"
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE market_db;"
   ```

3. Actualiza `backend/.env` con tus credenciales:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=tu_contraseña
   DB_NAME=market_db

   JWT_SECRET=cambia_esto_en_produccion
   FRONTEND_URL=http://localhost:4200
   AUTH_REQUIRE_EMAIL_VERIFICATION=true

   # Solo desarrollo/test
   AUTH_EXPOSE_VERIFICATION_TOKEN=true
   AUTH_THROTTLE_DEV_MULTIPLIER=1000
   ```

---

## 📦 Instalación de Dependencias

```powershell
# Instala dependencias de backend y frontend
npm run install:all
```

---

## 🏃 Cómo ejecutar

### Opción 1: Ambos proyectos simultáneamente
```powershell
npm run dev
```

### Opción 2: Por separado

**Terminal 1 - Backend:**
```powershell
npm run dev:backend
```
API disponible en: `http://localhost:3000/api`
Documentación Swagger: `http://localhost:3000/api/docs`

**Terminal 2 - Frontend:**
```powershell
npm run dev:frontend
```
App disponible en: `http://localhost:4200`

### Opción 3: Docker (stack completo)

```powershell
Copy-Item .env.example .env
npm run docker:up
```
App disponible en: `http://localhost`

Para desarrollo diario puedes levantar solo PostgreSQL + MailDev en Docker y
seguir usando `npm run dev`:

```powershell
npm run dev:infra
```

Guía completa (conceptos, desarrollo, VPS y TLS): [DEPLOY.md](DEPLOY.md).

---

## 🔌 Endpoints API Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario (requiere verificar el correo) |
| POST | `/api/auth/verify-email` | Verificar correo con el token del email |
| POST | `/api/auth/resend-verification` | Reenviar correo de verificación |
| POST | `/api/auth/login` | Login de usuario |
| POST | `/api/auth/forgot-password` | Solicitar reseteo de contraseña |
| POST | `/api/auth/reset-password` | Restablecer contraseña con token |
| POST | `/api/auth/change-password` | Cambiar contraseña (autenticado) |
| POST | `/api/auth/logout-all` | Cerrar todas las sesiones (autenticado) |
| GET | `/api/products` | Listar productos |
| GET | `/api/products/:id` | Detalle de producto |
| GET | `/api/categories` | Listar categorías |
| GET | `/api/cart` | Ver carrito |
| POST | `/api/cart` | Agregar al carrito |
| GET | `/api/orders` | Mis pedidos |
| POST | `/api/orders` | Crear pedido |
| GET | `/api/addresses` | Mis direcciones |

---

## 🔐 Seguridad de autenticación

- **Verificación de correo obligatoria**: el registro responde `202` sin sesión y el login devuelve `403 EMAIL_NOT_VERIFIED` hasta confirmar el enlace.
- **Rate limiting**: límites estrictos por IP + correo en registro/login/recuperación. En desarrollo se multiplican por `AUTH_THROTTLE_DEV_MULTIPLIER` para no bloquear los tests.
- **Contraseñas**: 8–72 caracteres, al menos una letra y un número, rechazando contraseñas comunes.
- **Tokens**: aleatorios de un solo uso, guardados como hash SHA-256; verificación 24 h y reseteo 30 min. El reseteo y la verificación invalidan sesiones previas (`tokenVersion`).
- **Emails en desarrollo**: `npm run dev` levanta MailDev automáticamente (SMTP `localhost:1025`, UI `http://localhost:1080`). También puedes iniciarlo solo:

  ```powershell
  cd backend
  npm run mail:dev
  ```

  Los correos de verificación y reseteo aparecen en `http://localhost:1080`. Si `SMTP_HOST` está vacío o `MAIL_LOG_ONLY=true`, el enlace se imprime en la consola del backend.
- **Producción**: `synchronize` está desactivado; aplica `backend/scripts/migrate-auth-security.sql` y no actives `AUTH_EXPOSE_VERIFICATION_TOKEN`.

---

## 🗄️ Diagrama ER

Ver [docs/ER.md](docs/ER.md) para el modelo completo de la base de datos.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Angular | 20.3 |
| Frontend UI | Tailwind CSS | 4.3 |
| Frontend PWA | @angular/pwa | 20.3 |
| Backend | NestJS | 12.0 |
| Backend ORM | TypeORM | 0.3.31 |
| Base de Datos | PostgreSQL | 16+ |
| Auth | JWT | Passport.js |
| API Docs | Swagger/OpenAPI | NestJS integrado |

---

## 📝 Notas

- El backend sincroniza automáticamente las entidades con la base de datos (`synchronize: true`) en desarrollo.
- Los seeders de categorías y productos se ejecutan automáticamente si la base de datos está vacía (cuando `RUN_SEED=true`).
- El Service Worker (PWA) solo se activa en builds de producción (`ng build --configuration production`).

---

## 🐛 Solución de Problemas

### Puerto 3000 en uso
```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### Error de conexión a PostgreSQL
Verifica que el servicio esté corriendo y las credenciales en `backend/.env` sean correctas.

---

## 📜 Licencia

Privado - Market E-commerce
