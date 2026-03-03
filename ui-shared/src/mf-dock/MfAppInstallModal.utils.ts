import type {
  AppId,
  AppsCatalogResponse,
  DockInstallStep,
} from "./types";

export function parseScopes(scopeRaw: string): string[] {
  return scopeRaw.split(/\s+/).filter(Boolean);
}

export function resolveStep(
  catalog: AppsCatalogResponse | null,
  currentAppId: AppId,
  targetAppId: AppId | null,
): DockInstallStep {
  if (!catalog || !targetAppId) {
    return "manage";
  }

  const target = catalog.items.find((item) => item.appId === targetAppId);
  if (!target || target.appId === currentAppId) {
    return "manage";
  }

  if (!catalog.accountAuthorized) {
    return "account_auth";
  }

  if (!target.installedAt) {
    return "base_auth";
  }

  const policyGranted = target.policyGranted ?? target.connectGranted;
  if (target.appId !== currentAppId && !policyGranted) {
    return "connect_auth";
  }

  return "done";
}

export function stepTitle(step: DockInstallStep): string {
  if (step === "manage") return "连接管理";
  if (step === "account_auth") return "授权 MF 账号";
  if (step === "base_auth") return "目标应用授权";
  if (step === "connect_auth") return "当前应用连接授权";
  return "安装完成";
}
