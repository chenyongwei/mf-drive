import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppCatalogItem, AppId, AppsCatalogResponse, DockInstallStep } from './types';
import { resolveStep, stepTitle } from './MfAppInstallModal.utils';

type ManagePanelProps = {
  catalog: AppsCatalogResponse | null;
  currentAppId: AppId;
  visibleApps: AppCatalogItem[];
  onRefreshCatalog: () => Promise<AppsCatalogResponse | null>;
  onSelectTarget: (targetAppId: AppId, nextStep: DockInstallStep) => void;
};

function getInstallPermissions(targetApp: AppCatalogItem): string[] {
  const permissionSet = new Set<string>();
  if (targetApp.requiredBaseScope.trim().length > 0) {
    permissionSet.add(targetApp.requiredBaseScope.trim());
  }
  const template = targetApp.recommendedTemplate;
  if (template) {
    permissionSet.add(`resource:${template.dataDomain.toLowerCase()}.${template.purpose.toLowerCase()}`);
  }
  return Array.from(permissionSet);
}

export function MfAppInstallManagePanel({
  catalog,
  currentAppId,
  visibleApps,
  onRefreshCatalog,
  onSelectTarget,
}: ManagePanelProps) {
  return (
    <div className="mf-dock-pane" data-testid="mf-manage-panel">
      <h3>应用安装</h3>
      <p>仅在首次安装或新增授权时进入授权流程，日常不展示统一授权入口。</p>
      <div className="mf-account-summary">
        <span>MF 账号授权：{catalog?.accountAuthorized ? '已授权' : '未授权'}</span>
        <div className="mf-dock-action-row">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              void onRefreshCatalog();
            }}
            data-testid="mf-manage-refresh"
          >
            刷新状态
          </button>
        </div>
      </div>
      <div className="mf-manage-list">
        {visibleApps.length === 0 ? (
          <div className="mf-manage-empty" data-testid="mf-manage-empty">
            当前没有待安装或待连接应用。
          </div>
        ) : visibleApps.map((item) => {
          const granted = item.policyGranted ?? item.connectGranted;
          const actionLabel = item.installedAt
            ? (granted || !item.requiresConnectScope ? '打开' : '补充授权')
            : '首次安装';
          return (
            <div className="mf-manage-item" key={item.appId}>
              <div>
                <strong>{item.name}</strong>
                <div className="mf-manage-tags">
                  <span>{item.installedAt ? '已安装' : '未安装'}</span>
                  <span>{granted ? '已授权' : '待授权'}</span>
                  <span>{item.launchMode}</span>
                </div>
                <code>{item.requiredBaseScope}</code>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectTarget(item.appId, resolveStep(catalog, currentAppId, item.appId));
                }}
                data-testid={`mf-install-target-${item.appId}`}
              >
                {actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type FlowPanelProps = {
  targetApp: AppCatalogItem | null;
  step: DockInstallStep;
  loading: boolean;
  sourceGrantId: string;
  targetGrantId: string;
  policyId: string;
  introspectActive: boolean;
  approvedScopes: string[];
  onAccountAuthorize: () => void;
  onTargetBaseAuthorize: () => void;
  onConnectAuthorize: () => void;
  onConfigurePermissions: (target: AppCatalogItem) => void;
  onOpenTarget: (target: AppCatalogItem) => void;
  onClose: () => void;
  fallbackManage: ReactNode;
};

export function MfAppInstallFlowPanel({
  targetApp,
  step,
  loading,
  sourceGrantId,
  targetGrantId,
  policyId,
  introspectActive,
  approvedScopes,
  onAccountAuthorize,
  onTargetBaseAuthorize,
  onConnectAuthorize,
  onConfigurePermissions,
  onOpenTarget,
  onClose,
  fallbackManage,
}: FlowPanelProps) {
  const [agreed, setAgreed] = useState(false);
  const [showAllPermissions, setShowAllPermissions] = useState(false);

  useEffect(() => {
    setAgreed(false);
    setShowAllPermissions(false);
  }, [targetApp?.appId, step]);

  const installPermissions = useMemo(
    () => (targetApp ? getInstallPermissions(targetApp) : []),
    [targetApp],
  );

  if (!targetApp) {
    return <>{fallbackManage}</>;
  }

  const visiblePermissions = showAllPermissions ? installPermissions : installPermissions.slice(0, 5);

  return (
    <div className="mf-dock-pane">
      <h3>{targetApp.name}</h3>
      <p>{stepTitle(step)}</p>

      {step === 'account_auth' ? (
        <div>
          <p>首次安装前需要先完成 MF 账号授权。</p>
          <div className="mf-dock-action-row">
            <button
              type="button"
              onClick={onAccountAuthorize}
              disabled={loading}
              data-testid="mf-install-authorize-account"
            >
              {loading ? '授权中...' : '继续'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'base_auth' ? (
        <div>
          <div className="mf-install-permission-panel">
            <strong>安装后将获取以下权限</strong>
            <ul>
              {visiblePermissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
            {installPermissions.length > 5 ? (
              <button
                type="button"
                className="mf-inline-link"
                onClick={() => setShowAllPermissions((previous) => !previous)}
                data-testid="mf-install-toggle-permissions"
              >
                {showAllPermissions ? '收起权限清单' : `查看全部 ${installPermissions.length} 项权限`}
              </button>
            ) : null}
          </div>
          <label className="mf-install-agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              data-testid="mf-install-agreement"
            />
            <span>我已阅读并同意隐私协议与使用协议</span>
          </label>
          <div className="mf-dock-action-row">
            <button
              type="button"
              onClick={onTargetBaseAuthorize}
              disabled={loading || !agreed}
              data-testid="mf-install-authorize-base"
            >
              {loading ? '授权中...' : '安装并授权'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'connect_auth' ? (
        <div>
          <p>
            当前操作还需要资源授权：
            <code>
              {(targetApp.recommendedTemplate?.dataDomain ?? 'FOUNDATION_MODEL')}
              {' / '}
              {(targetApp.recommendedTemplate?.purpose ?? 'ANALYTICS_REPORTING')}
            </code>
          </p>
          <div className="mf-dock-action-row">
            <button
              type="button"
              onClick={onConnectAuthorize}
              disabled={loading}
              data-testid="mf-install-connect-scope"
            >
              {loading ? '授权中...' : '完成资源授权'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'done' ? (
        <div>
          <p>安装与授权已完成，可直接打开应用或在安全中心继续配置权限。</p>
          <div className="mf-dock-action-row">
            <button
              type="button"
              onClick={() => onOpenTarget(targetApp)}
              data-testid="mf-install-open-app"
            >
              立即打开应用
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => onConfigurePermissions(targetApp)}
              data-testid="mf-install-open-security"
            >
              配置更多权限
            </button>
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              data-testid="mf-install-done"
            >
              关闭
            </button>
          </div>
        </div>
      ) : null}

      <div className="mf-dock-session">
        <span>sourceGrant: {sourceGrantId || '--'}</span>
        <span>targetGrant: {targetGrantId || '--'}</span>
        <span>policy: {policyId || '--'}</span>
        <span>Introspect: {introspectActive ? 'active' : '--'}</span>
        <span>Scopes: {approvedScopes.join(' ') || '--'}</span>
      </div>
    </div>
  );
}
