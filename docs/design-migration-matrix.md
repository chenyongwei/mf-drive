# Design Migration Matrix

## Repository Mapping
| Repo | Primary Pages | Migration Targets |
| --- | --- | --- |
| foundation | `/foundation/workbench`, `/foundation/security`, `/foundation/store`, `/foundation/ontology` | shell/header/card/status/table semantics |
| aps | `/aps/plans` | shell/header/card/table/button/field semantics |
| drive | `/drive/files` | shell/status cards/toolbar/form blocks/tables |
| wms | `/wms/materials`, `/wms/materials/config`, `/wms/pipes`, `/wms/pipes/config` | shell/nav/panel/form/table/log panel |
| crm | `/crm/customers` | shell/toolbar/editor/table/status |
| ordering | `/ordering/orders*`, `/ordering/settings/*` | preset token alignment + shared components on toolbars/forms |

## Legacy -> Unified Resource
| Legacy Pattern | Unified Resource |
| --- | --- |
| per-app page wrapper class | `MfPageShell` |
| per-app panel/card css | `MfSectionCard` |
| per-app button style class | `MfButton` |
| inline form labels + hints | `MfField` |
| app-specific success/error bars | `MfStatusBanner` |
| hand-written table shell | `MfDataTable` |
| hardcoded palette in Tailwind classes | `tailwind-preset` + token palette vars |

## Acceptance Checklist
- [ ] `data-testid` signatures are unchanged.
- [ ] Dock behavior unchanged in normal/mini mode.
- [ ] No route/API/permission semantic drift.
- [ ] Each app builds with unified preset.
- [ ] Visual regression script passes threshold.
