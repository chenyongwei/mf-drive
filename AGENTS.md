# AGENTS.md (drive)

适用范围：`/Users/alex/Code/mf/drive`

本文件为子仓就近规则入口。完整规则以根仓文件为准：
- `/Users/alex/Code/mf/AGENTS.md`

## 必做流程（每个 thread）
1. 先读根仓记忆与规则：
   - `/Users/alex/Code/mf/MEMORY_INDEX.md`
   - `/Users/alex/Code/mf/MEMORY_REPO_MANAGEMENT_RULES_2026-02-11.md`
   - `/Users/alex/Code/mf/AGENTS.md`
2. 只在当前子仓内改动业务代码，不跨仓误改。
3. 完成改动后执行本仓最小校验：
- `npm run contract:test`
- `npm run contract:check`
- `npm run test:mock`
4. 任一校验失败，不得给出“已完成”结论。

## 仓库边界
- 当前仓：`drive`（独立 Git 仓，独立提交/CI/发布）
- 根仓 `/Users/alex/Code/mf` 仅管理协同文档、脚本、infra 与跨仓门禁

## 提交与输出约束
- 仅在用户明确要求时提交 commit/push。
- 输出需包含：变更文件路径、执行命令、结果、风险/待确认项（如有）。
- 默认中文，先结论后证据。
