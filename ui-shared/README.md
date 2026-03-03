# @platform/ui-shared

共享前端能力仓，服务 `drawing / nesting / ordering`。

## 导出面
- `@platform/ui-shared/cad`
- `@platform/ui-shared/ordering`
- `@platform/ui-shared/contexts`
- `@platform/ui-shared/components`
- `@platform/ui-shared/features`
- `@platform/ui-shared/geometry`
- `@platform/ui-shared/types`
- `@platform/ui-shared/bootstrap`
- `@platform/ui-shared/mocks`

## 说明
- 当前包含从 `dxf-fix` 迁移的应用代码（`src/app`）与共享兼容层（`src/shared`）。
- 默认通过 `VITE_COMPAT_API_MODE=msw` 使用兼容 mock handlers。
