# MF Design Language

## Scope
- Source of truth: `@platform/ui-shared`.
- Applies to: `foundation / aps / drive / wms / crm / ordering` web apps.
- Constraint: visual and interaction layer only, no API/route/permission semantics changes.

## Token Catalog
| Category | Token | Value Source |
| --- | --- | --- |
| color | `--mf-color-bg` | app page background |
| color | `--mf-color-surface` | card/panel surface |
| color | `--mf-color-border` | default border |
| color | `--mf-color-text` | primary text |
| color | `--mf-color-text-muted` | secondary text |
| color | `--mf-color-primary` | primary action |
| color | `--mf-color-success` | success feedback |
| color | `--mf-color-warning` | warning feedback |
| color | `--mf-color-danger` | error feedback |
| radius | `--mf-radius-sm/md/lg/xl` | corners |
| shadow | `--mf-shadow-sm/md/lg` | elevation |
| spacing | `--mf-space-1..12` | spacing scale |
| font | `--mf-font-sans` | UI font |
| font | `--mf-font-mono` | code/log font |

Palette compatibility tokens are also provided (`--mf-color-slate-*`, `--mf-color-sky-*`, `--mf-color-red-*`, `--mf-color-amber-*`, `--mf-color-emerald-*`, `--mf-color-rose-*`) for existing Tailwind class migration.

## Shared Components
- `MfPageShell`: page-level frame, unified header and content spacing.
- `MfSectionCard`: panel/card container with optional title/description/actions.
- `MfButton`: semantic action button (`primary/secondary/ghost/danger/success/warning`).
- `MfField`: label + hint/error field wrapper.
- `MfStatusBanner`: inline status feedback.
- `MfDataTable`: consistent table scaffold and empty state.

## Component States Matrix
| Component | Normal | Hover | Disabled | Error |
| --- | --- | --- | --- | --- |
| `MfButton` | semantic tone style | tone hover background | opacity + cursor lock | `danger` tone |
| `MfField` | label + control | delegated to control | delegated to control | `error` text |
| `MfStatusBanner` | info/success/warning/danger block | n/a | n/a | danger tone |
| `MfDataTable` | header + rows | row-level custom | n/a | n/a |

## Do / Don’t
### Do
- Use `@platform/ui-shared/tailwind-preset` in every web app config.
- Use semantic components before creating local one-off styles.
- Keep `data-testid` unchanged during visual refactor.
- Prefer token-backed classes (`mf-*` or mapped palette classes).

### Don’t
- Don’t hardcode new hex/rgb colors in app pages.
- Don’t change route or API behavior in design refactor commits.
- Don’t duplicate component variants already provided in `ui-shared`.

## Usage Quick Start
1. Add `@platform/ui-shared/tailwind-preset` to `tailwind.config.js` presets.
2. Ensure app entry imports `@platform/ui-shared/bootstrap`.
3. Keep local CSS minimal and token-driven.
4. Build pages with `MfPageShell` + `MfSectionCard` + shared form/data components.
