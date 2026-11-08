# Grocery-Inspired — Style Reference
> Un estilo inspirado en tiendas de comestibles online — una paleta verde oscuro y amarillo que transmite frescura y confianza, con un navbar verde profundo, acentos amarillos vibrantes, y un diseño limpio y funcional para e-commerce.

**Theme:** light

**Source inspiration:** Grocery e-commerce platforms with green + yellow palette
Green (`#1a5632`) represents freshness and nature; Yellow (`#f5a623`) adds energy and highlights key actions.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#1a5632` | `--color-primary` | Verde oscuro — color principal de marca, navbar, botones primarios |
| on primary | `#ffffff` | `--color-on-primary` | Texto sobre fondo verde |
| accent | `#f5a623` | `--color-accent` | Amarillo — acentos, badges, banner superior, hover states |
| on accent | `#1a5632` | `--color-on-accent` | Texto sobre fondo amarillo |
| ink | `#000000` | `--color-ink` | Texto principal |
| body | `#5e5e5e` | `--color-body` | Texto secundario/descripciones |
| mute | `#afafaf` | `--color-mute` | Texto terciario, placeholders |
| hairline mid | `#4b4b4b` | `--color-hairline-mid` | Bordes sutiles |
| canvas | `#ffffff` | `--color-canvas` | Fondo principal de página |
| canvas soft | `#efefef` | `--color-canvas-soft` | Fondos de inputs, cards suaves |
| canvas softer | `#f3f3f3` | `--color-canvas-softer` | Fondos muy sutiles |
| surface pressed | `#e2e2e2` | `--color-surface-pressed` | Hover states, bordes, separadores |
| link | `#1a5632` | `--color-link` | Links — verde oscuro |
| on dark | `#ffffff` | `--color-on-dark` | Texto sobre fondos oscuros |
| black elevated | `#282828` | `--color-black-elevated` | Superficies oscuras elevadas |

## Tokens — Typography

### UberMove, UberMoveText, system-ui, Helvetica Neue, Arial, sans-serif · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 700
- **Sizes:** 40px, 28px, 26px, 20px, 18px
- **Line height:** 52px, 36px, 34px, 28px, 26px
- **Letter spacing:** 0
- **Role:** Brand typography family observed across the documented type scale.

### UberMoveText, system-ui, Helvetica Neue, Arial, sans-serif · `--font-family-2`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 500, 400
- **Sizes:** 16px, 14px, 13px, 12px
- **Line height:** 24px, 22px, 18px, 18px
- **Letter spacing:** 0
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| display-xxl | 40px | 52px | 0 | `--text-display-xxl` |
| display-xl | 28px | 36px | 0 | `--text-display-xl` |
| display-lg | 26px | 34px | 0 | `--text-display-lg` |
| display-md | 20px | 28px | 0 | `--text-display-md` |
| display-sm | 18px | 26px | 0 | `--text-display-sm` |
| body-2xl | 24px | 32px | 0 | `--text-body-2xl` |
| body-xl | 20px | 28px | 0 | `--text-body-xl` |
| body-lg | 16px | 24px | 0 | `--text-body-lg` |
| body-md | 14px | 22px | 0 | `--text-body-md` |
| body-md-strong | 14px | 20px | 0 | `--text-body-md-strong` |
| body-sm | 13px | 18px | 0 | `--text-body-sm` |
| body-sm-strong | 13px | 16px | 0 | `--text-body-sm-strong` |
| body-xs | 12px | 16px | 0 | `--text-body-xs` |
| caption | 12px | 18px | 0 | `--text-caption` |
| button-large | 16px | 24px | 0 | `--text-button-large` |
| button-md | 14px | 20px | 0 | `--text-button-md` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| xxs | 4px | `--spacing-xxs` |
| xs | 6px | `--spacing-xs` |
| sm | 8px | `--spacing-sm` |
| md | 12px | `--spacing-md` |
| lg | 16px | `--spacing-lg` |
| xl | 20px | `--spacing-xl` |
| 2xl | 24px | `--spacing-2xl` |
| 3xl | 32px | `--spacing-3xl` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| none | 0px | `--radius-none` |
| md | 8px | `--radius-md` |
| lg | 12px | `--radius-lg` |
| xl | 16px | `--radius-xl` |
| pill | 999px | `--radius-pill` |
| pill-tab | 36px | `--radius-pill-tab` |
| full | 9999px | `--radius-full` |

### Layout

- **Section gap:** 64px
- **Card padding:** 16px
- **Element gap:** 12px
- **Max content width:** 1200px

## Components

### nav bar
**Role:** nav bar component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md-strong}`
- **padding:** `{spacing.lg} {spacing.3xl}`

### nav link
**Role:** nav link component

- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md-strong}`

### button primary
**Role:** button primary component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.md} {spacing.lg}`
- **whiteSpace:** `nowrap`

### button secondary
**Role:** button secondary component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.md} {spacing.lg}`
- **whiteSpace:** `nowrap`

### button subtle
**Role:** button subtle component

- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.md} {spacing.lg}`

### button floating
**Role:** button floating component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.md} {spacing.lg}`
- **whiteSpace:** `nowrap`

### button large rounded
**Role:** button large rounded component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button-large}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.lg} {spacing.xl}`

### button tab translucent
**Role:** button tab translucent component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md-strong}`
- **rounded:** `{rounded.pill-tab}`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### text input on soft
**Role:** text input on soft component

- **backgroundColor:** `{colors.canvas-softer}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### card content
**Role:** card content component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### card elevated
**Role:** card elevated component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### card soft tinted
**Role:** card soft tinted component

- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### promo card illustrated
**Role:** promo card illustrated component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### promo card on dark
**Role:** promo card on dark component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-dark}`
- **typography:** `{typography.display-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### request form card
**Role:** request form card component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.lg}`

### request form input row
**Role:** request form input row component

- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### category button
**Role:** category button component

- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm-strong}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.sm} {spacing.lg}`

### faq row
**Role:** faq row component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md-strong}`
- **padding:** `{spacing.lg} 0`

### app download pill
**Role:** app download pill component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-dark}`
- **typography:** `{typography.body-md-strong}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.md} {spacing.lg}`
- **whiteSpace:** `nowrap`

### hero band light
**Role:** hero band light component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-xxl}`
- **padding:** `{spacing.3xl} {spacing.3xl}`

### hero band dark
**Role:** hero band dark component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-dark}`
- **typography:** `{typography.display-xxl}`
- **padding:** `{spacing.3xl} {spacing.3xl}`

### showcase image card
**Role:** showcase image card component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-dark}`
- **typography:** `{typography.display-xxl}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.3xl}`

### link blue
**Role:** link blue component

- **textColor:** `{colors.link}`
- **typography:** `{typography.body-md}`

### link on dark
**Role:** link on dark component

- **textColor:** `{colors.on-dark}`
- **typography:** `{typography.body-md}`

### link mute
**Role:** link mute component

- **textColor:** `{colors.hairline-mid}`
- **typography:** `{typography.body-md}`

### link mute soft
**Role:** link mute soft component

- **textColor:** `{colors.mute}`
- **typography:** `{typography.body-md}`

### icon button circular
**Role:** icon button circular component

- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.full}`

### footer
**Role:** footer component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-dark}`
- **typography:** `{typography.body-sm}`
- **padding:** `{spacing.3xl} {spacing.3xl}`

### ex pricing tier
**Role:** ex pricing tier component

- **description:** `Default tier card. Mirrors card-content chrome with canvas-soft surface and a faint border.`
- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.surface-pressed}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### ex pricing tier featured
**Role:** ex pricing tier featured component

- **description:** `Featured tier — polarity-flipped to ink with white text.`
- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### ex product selector
**Role:** ex product selector component

- **description:** `Plan picker — re-purposed for the brand's Ride / Eats / Reserve tier picker. Uses category-button pills inside the frame.`
- **backgroundColor:** `{colors.canvas-soft}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.2xl}`

### ex cart drawer
**Role:** ex cart drawer component

- **description:** `Subscription summary — line items per add-on (NOT a literal e-commerce cart).`
- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`
- **item-divider:** `{colors.surface-pressed}`

### ex app shell row
**Role:** ex app shell row component

- **description:** `Sidebar nav row. Active state uses brand primary as a left-edge indicator bar.`
- **backgroundColor:** `{colors.canvas}`
- **activeIndicator:** `{colors.primary}`
- **rounded:** `{rounded.md}`
- **padding:** `{spacing.md} {spacing.lg}`

### ex data table cell
**Role:** ex data table cell component

- **description:** `Default data-table th + td chrome. Header uses body-sm-strong 500 weight; body uses body-sm.`
- **headerBackground:** `{colors.canvas-soft}`
- **headerTypography:** `{typography.body-sm-strong}`
- **bodyTypography:** `{typography.body-sm}`
- **cellPadding:** `{spacing.md} {spacing.lg}`
- **rowBorder:** `{colors.surface-pressed}`

### order status badge
**Role:** Order status indicator — dot + label (no pill background)

- **description:** `Los estados de pedido se muestran como un punto de color seguido del label en texto plano. No usar pills con fondo para estados de pedido.`
- **component:** `app-order-status` — `src/app/shared/ui/order-status-badge.ts`
- **dotSize:** `8px`
- **dotRadius:** `{rounded.full}`
- **gap:** `{spacing.sm}`
- **labelTypography:** `{typography.body-xs}` por defecto; `{typography.body-sm}` con `size="md"`
- **labelColor:** `{colors.ink}`
- **dotColors:**

| Status | Color |
|---|---|
| pending | `--color-body` |
| confirmed | sky-600 |
| paid | blue-600 |
| processing | purple-600 |
| shipped | amber-500 |
| out_for_delivery | cyan-600 |
| delivered | green-600 |
| rejected / cancelled | red-600 |
| refunded | gray-500 |

- **usage:** `<app-order-status [status]="order.status" />` o `<app-order-status [status]="order.status" size="md" />`

### ex auth form card
**Role:** ex auth form card component

- **description:** `Sign-in / sign-up card. Mirrors card-content chrome with text-input primitives inside.`
- **backgroundColor:** `{colors.canvas-soft}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### ex modal card
**Role:** ex modal card component

- **description:** `Modal dialog surface — same chrome as card-content with Level 2 drop shadow.`
- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.2xl}`

### form label
**Role:** label for form inputs and editable fields

- **description:** `Labels above inputs in create/edit forms. Uses body color (#5e5e5e) for clear readability.`
- **typography:** `{typography.body-md}`
- **textColor:** `{colors.body}`
- **marginBottom:** `{spacing.xxs}`
- **globalClass:** `.form-label` — usar en todos los formularios en lugar de clases Tailwind inline.

### form input
**Role:** compact input for create/edit forms (input, select, textarea)

- **description:** `Inputs in admin modals and forms. Standard size for readability.`
- **typography:** `{typography.body-md}`
- **textColor:** `{colors.ink}`
- **backgroundColor:** `{colors.canvas-soft}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.sm} {spacing.md}`
- **globalClass:** `.form-input` — reemplaza combos como `w-full bg-canvas-soft border border-surface-pressed rounded-lg px-lg py-md text-body-sm outline-none focus:border-primary`

### detail label
**Role:** label for read-only detail/info displays

- **description:** `Labels in detail modals and info cards. Same style as form labels for consistency — body color (#5e5e5e), not mute.`
- **typography:** `{typography.body-md}`
- **textColor:** `{colors.body}`
- **marginBottom:** `{spacing.xxs}`
- **globalClass:** `.detail-label` — usar en `<dt>` y etiquetas de detalle.

### detail value
**Role:** value display for read-only detail/info

- **description:** `Values in detail modals. Slightly larger than labels for clear hierarchy.`
- **typography:** `{typography.body-md}`
- **textColor:** `{colors.ink}`
- **globalClass:** `.detail-value` — usar en `<dd>` y valores de detalle.

### filter input
**Role:** compact filter controls in admin toolbars (search boxes, filter selects)

- **description:** `Pill-shaped filter controls. Compact padding, no inner borders.`
- **typography:** `{typography.body-sm}`
- **textColor:** `{colors.ink}`
- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.sm} {spacing-lg}`
- **globalClass:** `.filter-input` — reemplaza combos como `bg-canvas border border-surface-pressed rounded-pill px-lg py-md text-body-sm outline-none focus:border-primary`

### form hint
**Role:** helper text / legends under form fields

- **description:** `Helper text, hints, and legends below inputs. Body color for subtle guidance.`
- **typography:** `{typography.body-xs}`
- **textColor:** `{colors.body}`
- **globalClass:** `.form-hint` — usar para texto de ayuda debajo de campos.

### form error
**Role:** error messages in forms

- **description:** `Validation error messages below form fields.`
- **typography:** `{typography.body-xs}`
- **textColor:** `#dc2626`
- **globalClass:** `.form-error` — reemplaza `text-body-sm text-red-600` inline.

### ex empty state card
**Role:** ex empty state card component

- **description:** `Empty-state illustration frame. Generous padding on canvas-soft surface.`
- **backgroundColor:** `{colors.canvas-soft}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.3xl}`
- **captionTypography:** `{typography.body-md}`

### ex toast
**Role:** ex toast component

- **description:** `Toast notification surface — flat-cornered card-content chrome with Level 2 drop shadow.`
- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.md} {spacing.lg}`
- **typography:** `{typography.body-sm}`

## Do's and Don'ts

### Do

- Use `--color-primary` (`#1a5632`) for primary actions, navbar, and brand elements.
- Use `--color-accent` (`#f5a623`) for highlights, badges, and energetic accents.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.

### Don't

- Do not introduce colors outside the documented color token set.
- Do not use hardcoded hex values — always use CSS tokens.
- Do not usar pills con fondo para mostrar estados de pedido — usar `app-order-status` (punto de color + label).
- Do not replace `--color-primary` or `--color-accent` with arbitrary colors.
- Do not flatten documented component states or spacing relationships.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition against the grocery e-commerce design system.

## Date & Time Format

**Formato estándar:** `DD/MM/YYYY HH:MM`

- **Date:** `dd/MM/yyyy` (ej: 13/09/2026)
- **DateTime:** `dd/MM/yyyy HH:mm` (ej: 13/09/2026 16:30)
- **No usar:** formatos como `MM/DD/YYYY`, `YYYY-MM-DD`, o `Sep 13, 2026`

### Ejemplos
```
13/09/2026
13/09/2026 16:30
01/01/2026 08:00
```

### Uso en Angular
```typescript
// Para mostrar fecha
{{ date | date:'dd/MM/yyyy' }}

// Para mostrar fecha y hora
{{ date | date:'dd/MM/yyyy HH:mm' }}
```
