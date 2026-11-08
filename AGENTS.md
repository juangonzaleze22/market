# Market E-commerce — Agent Guide

## 📋 Reglas Globales del Proyecto

Este proyecto contiene dos aplicaciones en un monorepo:
- **Backend:** NestJS 12 + TypeORM + PostgreSQL
- **Frontend:** Angular 20 + Tailwind CSS + Playwright E2E + PWA

### Archivos de referencia obligatorios
- **`.cursorrules`** — Reglas globales para agentes AI
- **`frontend/AGENTS.md`** — Reglas específicas del frontend (design system, Playwright)
- **`frontend/DESIGN.md`** — Sistema de diseño Uber-inspired completo
- **`docs/ER.md`** — Diagrama Entidad-Relación de la base de datos

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Angular | 20.3 |
| Frontend UI | Tailwind CSS | 4.3 |
| Frontend E2E | Playwright | 1.62 |
| Frontend PWA | @angular/pwa | 20.3 |
| Backend | NestJS | 12.0 |
| Backend ORM | TypeORM | 0.3.31 |
| Base de Datos | PostgreSQL | 16+ |
| Auth | JWT | Passport.js |
| API Docs | Swagger/OpenAPI | NestJS integrado |

---

## 🏃 Cómo ejecutar

### Ambos proyectos
```powershell
npm run dev
```

### Solo backend
```powershell
npm run dev:backend
```
API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/api/docs`

### Solo frontend
```powershell
npm run dev:frontend
```
App: `http://localhost:4200`

---

## 🧪 Testing E2E con Playwright

Los tests E2E son **obligatorios** para cualquier cambio de UI.

### Comandos
```powershell
cd frontend
npm run e2e        # Ejecutar todos los tests
npm run e2e:ui     # Modo UI para debugging visual
npm run e2e:report # Ver reporte HTML
```

### Reglas para agentes
1. Usar `data-testid` para selectores. Nunca clases CSS ni XPath.
2. Cada feature/page nueva requiere al menos un test E2E.
3. Antes de marcar una tarea como completada, ejecutar `npm run e2e`.
4. Si falla, corregir antes de finalizar.
5. Validar visualmente con `npm run e2e:ui` si hay cambios de diseño.

---

## 🎨 Design System

El frontend sigue un sistema de diseño **Uber-inspired** documentado en `frontend/DESIGN.md`.

### Puntos clave
- **Fuente:** Inter (fallback system-ui)
- **Colores:** Solo tokens documentados. No colores arbitrarios.
- **Botones:** Siempre pill shape (`border-radius: 999px`), excepto botones large rounded.
- **Max-width:** 1200px
- **Spacing:** Escala documentada en tokens CSS

---

## 🗄️ Base de Datos

- PostgreSQL local
- Base de datos: `market_db`
- Credenciales: `backend/.env`
- Sincronización automática en desarrollo (`synchronize: true`)
- Seeders ejecutados automáticamente si la DB está vacía

---

## ⚠️ Notas importantes

### Backend ESM
- NestJS 12 usa ESM (`"type": "module"`)
- Los imports deben incluir extensión `.js`
- No hay relaciones circulares entre entidades (causan errores en runtime)

### Node.js local
- Versión: v24.20.0 LTS
- Ubicación: `.tools/node/`
- No modificar la instalación global del sistema

---

## 📁 Estructura

```
Market/
├── backend/              # NestJS API
├── frontend/             # Angular App
│   ├── e2e/tests/        # Tests Playwright
│   ├── src/app/core/     # Servicios, interceptors
│   ├── src/app/features/ # Features/modules
│   ├── src/styles/       # Design tokens CSS
│   ├── DESIGN.md         # Design system completo
│   └── AGENTS.md         # Reglas frontend para agentes
├── docs/
│   └── ER.md             # Diagrama ER
├── .tools/
│   └── node/             # Node.js v24 local
├── .cursorrules          # Reglas globales agentes
├── start-dev.ps1         # Iniciar ambos
├── start-backend.ps1     # Iniciar backend
├── start-frontend.ps1    # Iniciar frontend
└── README.md             # Guía completa
```
