#!/usr/bin/env bash
MF_CI_REPO_KIND=app
MF_CI_REPO_ID=drive
MF_CI_GITHUB_ACR_NAMESPACE=chenyongwei
MF_CI_GITLAB_ACR_NAMESPACE=fs-repo
MF_CI_VERIFY_COMMANDS=(
  "npm ci"
  "npm ci --prefix ./api"
  "npm ci --prefix ./web"
  "npm run contract:test"
  "npm run contract:check"
  "npm run test:mock"
)
MF_CI_RELEASE_COMMANDS=()
MF_CI_DEP_REPOS=(
  "contracts"
  "cad-kernel"
  "ui-shared"
)
MF_CI_BUILD_TARGETS=(
  "drive-web|web|web|npm run build|VITE_API_MODE=live"
  "drive-api|api|node|npm run dev:live|"
)
