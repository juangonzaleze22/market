# Reglas para Agentes de Desarrollo — Market Frontend

> Este archivo define las reglas que deben seguir todos los agentes de desarrollo al trabajar en el frontend de Market.

---

## 1. Design System Obligatorio

### Fuente
- Títulos (`h1`–`h6` y escalas `text-display-*`): **Montserrat** (`--font-heading`).
- Resto de la UI: **Roboto** (`--font-primary`).
- Fallbacks: `system-ui, 'Helvetica Neue', Arial, sans-serif`

### Paleta de Colores Permitida
Solo usar los siguientes tokens CSS. **No introducir colores arbitrarios.**

| Token | Valor por defecto | Uso |
|-------|-------|-----|
| `--color-primary` | `#1C8057` | Botones primarios, acciones (CTA) y barra de navegación |
| `--color-on-primary` | `#ffffff` | Texto sobre color primario |
| `--color-brand` | `#1C8057` | Superficies de marca: header, footer, sidebar admin, command bar |
| `--color-on-brand` | `#ffffff` | Texto e iconos sobre color de marca |
| `--color-accent` | `#f5a623` | Acentos, badges, top banner, hover |
| `--color-on-accent` | `#1C8057` | Texto sobre color de acento |
| `--color-ink` | `#000000` | Texto general |
| `--color-body` | `#5e5e5e` | Texto secundario/descripciones |
| `--color-mute` | `#afafaf` | Texto terciario, placeholders |
| `--color-canvas` | `#ffffff` | Fondo de página |
| `--color-canvas-soft` | `#efefef` | Fondos de input, cards soft |
| `--color-canvas-softer` | `#f3f3f3` | Fondos sutiles |
| `--color-surface-pressed` | `#e2e2e2` | Hover states, bordes |
| `--color-link` | `#1C8057` | Links |
| `--color-black-elevated` | `#282828` | Superficies oscuras elevadas |

> **Tema configurable:** `--color-primary`, `--color-on-primary`, `--color-brand`,
> `--color-on-brand`, `--color-accent`, `--color-on-accent` y `--color-link` pueden
> sobrescribirse en runtime desde **Admin → Configuración → Apariencia y Marca**.
> No hardcodear estos colores en componentes: usar siempre las clases/tokens
> (`bg-primary`, `bg-brand`, `text-on-brand`, `text-link`, `text-accent`,
> `var(--color-primary)`). `primary` es para acciones/botones y el navbar; `brand`
> para el header, footer y sidebar. Los colores de estado (rojo/verde/azul de
> badges) sí son semánticos y no forman parte del tema.

### Botones
- **Siempre** usar `border-radius: 999px` (pill shape) para botones.
- Excepción: botones "large rounded" usan `16px` (`--radius-xl`).

### Espaciado
Usar la escala de spacing documentada:
- `--spacing-xxs`: 4px
- `--spacing-xs`: 6px
- `--spacing-sm`: 8px
- `--spacing-md`: 12px
- `--spacing-lg`: 16px
- `--spacing-xl`: 20px
- `--spacing-2xl`: 24px
- `--spacing-3xl`: 32px

### Layout
- Max-width de contenido: **1400px**
- Padding de sección: **32px** (`--spacing-3xl`)
- Gap entre elementos: **12px** (`--spacing-md`)

### Formularios — Estándar Compacto
Usar siempre las clases globales definidas en `styles.scss` en lugar de clases Tailwind inline:

| Clase | Uso | Tamaño |
|---|---|---|
| `.form-label` | Labels en formularios | 14px (body-md) |
| `.form-input` | Inputs, selects, textareas | 14px (body-md) |
| `.form-hint` | Texto de ayuda / leyendas | 12px (body-xs) |
| `.form-error` | Mensajes de error de validación | 12px (body-xs) |
| `.detail-label` | Etiquetas en modales de detalle / `<dt>` | 14px (body-md) |
| `.detail-value` | Valores en modales de detalle / `<dd>` | 14px (body-md) |
| `.filter-input` | Controles de filtro en toolbars (pill, compacto) | 14px (body-md) |

**Reglas:**
- No usar `mb-xs block text-body-xs` para labels — usar `.form-label`
- No usar `w-full bg-canvas-soft border border-surface-pressed rounded-lg px-lg py-md text-body-sm outline-none focus:border-primary` para inputs — usar `.form-input`
- No usar `text-body-sm text-red-600` para errores — usar `.form-error`
- No usar `text-body-xs` directamente — usar el token `--text-body-xs` vía `@theme`
- Inputs en modales: `py-sm px-md` (compacto), no `py-md px-lg` (grande)
- Títulos de sección en modales: usar `text-body-md font-semibold` (14px bold)
- Título del modal: `text-body-lg font-bold` (16px bold)

---

## 2. Convenciones de Componentes Angular

- Usar **Standalone Components** siempre.
- Usar **Signals** para estado reactivo.
- Usar el nuevo **Control Flow** (`@if`, `@for`) en templates.
- Nombrar componentes con prefijo `app-`.
- Colocar componentes de feature en `src/app/features/<feature>/`.
- Servicios compartidos van en `src/app/core/services/`.

---

## 3. Testing E2E con Playwright

### Ejecutar tests
```bash
# Todos los tests
npx playwright test

# En modo UI (visual)
npx playwright test --ui

# Un archivo especifico
npx playwright test e2e/tests/products.spec.ts

# Con reporte HTML
npx playwright test --reporter=html
```

### Reglas para escribir tests E2E
1. **Siempre** usar `data-testid` para selectores. No usar clases CSS ni XPath.
2. Cada test debe poder ejecutarse de forma independiente.
3. Usar `test.beforeEach` para setup común (login, navegacion).
4. Screenshots y videos se capturan automaticamente en fallos.
5. Agregar tests E2E para:
   - Cada nueva pagina/feature
   - Flujos criticos (auth, checkout, pagos)
   - Estados de error visibles

### Verificar visualmente antes de commitear
Antes de considerar una tarea como completada, el agente debe:
1. Ejecutar `npx playwright test` para verificar que no hay regresiones.
2. Si hay cambios visuales, ejecutar en modo UI (`--ui`) para validar.
3. Asegurar que los tests E2E pasan en Chromium y Mobile Chrome.

---

## 4. API y Backend

- La URL base del API esta en `src/environments/environment.ts`.
- Usar los servicios en `src/app/core/services/` para llamadas HTTP.
- El interceptor JWT adjunta automaticamente el token desde `localStorage.getItem('market_token')`.

---

## 5. Tailwind CSS

- Usar las clases de Tailwind para layout y utilidades basicas.
- Para componentes complejos, usar las clases CSS definidas en `styles.scss` (`.btn-primary`, `.card-content`, etc.).
- No usar valores arbitrarios en clases de Tailwind (ej: `text-[14px]`). Usar los tokens definidos.

---

## 6. Accesibilidad

- Todo boton interactivo debe tener `type="button"` o `type="submit"`.
- Inputs deben tener `label` asociado.
- Imagenes deben tener `alt` descriptivo.
- Mantener contraste minimo 4.5:1 para texto.

---

## 7. Flujo de Trabajo del Agente

1. Leer esta guia antes de empezar cualquier tarea.
2. Implementar la funcionalidad siguiendo el design system.
3. Escribir/actualizar tests E2E si afecta la UI.
4. Ejecutar `npx playwright test` para verificar.
5. Solo marcar como completado si los tests pasan.
