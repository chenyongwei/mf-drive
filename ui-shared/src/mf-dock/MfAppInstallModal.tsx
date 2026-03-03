import { useEffect, useMemo, useState } from 'react';
import {
  authorizeAccount,
  createSecurityPolicy,
  oauthAuthorize,
  oauthIntrospect,
  oauthToken,
} from './api';
import { MfAppInstallFlowPanel, MfAppInstallManagePanel } from './MfAppInstallModal.panels';
import { parseScopes, stepTitle } from './MfAppInstallModal.utils';
import type {
  AppCatalogItem,
  AppId,
  AppsCatalogResponse,
  AppInstallSession,
  DockInstallStep,
} from './types';

type DockModalMode = 'manage' | 'launch';

const RESOURCE_CONTEXT_BY_APP: Partial<Record<AppId, {
  resourcePackId: string;
  action: 'read' | 'write' | 'share' | 'delete';
  objectType?: string;
  dataDomain?: string;
  containerId?: string;
}>> = {
  wms: {
    resourcePackId: 'wms.inventory.material-options.read',
    action: 'read',
    objectType: 'MaterialOption',
    dataDomain: 'INVENTORY',
    containerId: 'default',
  },
  drive: {
    resourcePackId: 'drive.storage.containers.read',
    action: 'read',
    objectType: 'Container',
    dataDomain: 'FILE',
  },
  foundation_workbench: {
    resourcePackId: 'foundation.model.read',
    action: 'read',
    dataDomain: 'FOUNDATION_MODEL',
  },
};

function buildSecurityCenterUrl(sourceAppId: AppId, targetAppId: AppId): string {
  const params = new URLSearchParams();
  params.set('tab', 'resource-grants');
  params.set('tenantId', 'tenant-001');
  params.set('sourceAppId', sourceAppId);
  params.set('consumerAppId', targetAppId);
  const context = RESOURCE_CONTEXT_BY_APP[targetAppId];
  if (context) {
    params.set('resourcePackId', context.resourcePackId);
    params.set('action', context.action);
    if (context.objectType) params.set('objectType', context.objectType);
    if (context.dataDomain) params.set('dataDomain', context.dataDomain);
    if (context.containerId) params.set('containerId', context.containerId);
  }
  if (typeof window !== 'undefined') {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    params.set('returnTo', currentPath);
  }
  return `/foundation/security?${params.toString()}`;
}

type MfAppInstallModalProps = {
  open: boolean;
  mode: DockModalMode;
  currentAppId: AppId;
  catalog: AppsCatalogResponse | null;
  initialTargetAppId?: AppId | null;
  initialTargetApp?: AppCatalogItem | null;
  onClose: () => void;
  onRefreshCatalog: () => Promise<AppsCatalogResponse | null>;
  onInstalled: (session: AppInstallSession) => void;
  onLaunch: (target: AppCatalogItem) => void;
};

function resolveLaunchStep(
  catalog: AppsCatalogResponse | null,
  currentAppId: AppId,
  targetApp: AppCatalogItem | null,
): DockInstallStep {
  if (!targetApp || targetApp.appId === currentAppId) {
    return 'manage';
  }
  if (!catalog?.accountAuthorized) {
    return 'account_auth';
  }
  if (!targetApp.installedAt) {
    return 'base_auth';
  }
  const policyGranted = targetApp.policyGranted ?? targetApp.connectGranted;
  if (targetApp.requiresConnectScope && !policyGranted) {
    return 'connect_auth';
  }
  return 'done';
}

export function MfAppInstallModal(props: MfAppInstallModalProps) {
  const {
    open,
    mode,
    currentAppId,
    catalog,
    initialTargetAppId,
    initialTargetApp,
    onClose,
    onRefreshCatalog,
    onInstalled,
    onLaunch,
  } = props;

  const [targetAppId, setTargetAppId] = useState<AppId | null>(null);
  const [step, setStep] = useState<DockInstallStep>('manage');
  const [sourceGrantId, setSourceGrantId] = useState<string>('');
  const [targetGrantId, setTargetGrantId] = useState<string>('');
  const [policyId, setPolicyId] = useState<string>('');
  const [targetSnapshot, setTargetSnapshot] = useState<AppCatalogItem | null>(null);
  const [approvedScopes, setApprovedScopes] = useState<string[]>([]);
  const [introspectActive, setIntrospectActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const catalogItems = useMemo(() => (Array.isArray(catalog?.items) ? catalog.items : []), [catalog]);

  const currentApp = useMemo(
    () => catalogItems.find((item) => item.appId === currentAppId) ?? null,
    [catalogItems, currentAppId],
  );

  const targetApp = useMemo(() => {
    const fromCatalog = catalogItems.find((item) => item.appId === targetAppId) ?? null;
    if (fromCatalog) {
      return fromCatalog;
    }
    if (targetSnapshot && targetSnapshot.appId === targetAppId) {
      return targetSnapshot;
    }
    return null;
  }, [catalogItems, targetAppId, targetSnapshot]);

  const visibleApps = useMemo(
    () => catalogItems.filter((item) => item.appId !== currentAppId && item.appId !== 'foundation_workbench'),
    [catalogItems, currentAppId],
  );

  const pendingApps = useMemo(
    () => visibleApps.filter((item) => {
      const granted = item.policyGranted ?? item.connectGranted;
      return !item.installedAt || !granted;
    }),
    [visibleApps],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setLoading(false);
    setSourceGrantId('');
    setTargetGrantId('');
    setPolicyId('');
    setTargetSnapshot(initialTargetApp ?? null);
    setApprovedScopes([]);
    setIntrospectActive(false);

    if (mode === 'launch' && initialTargetAppId) {
      setTargetAppId(initialTargetAppId);
      const launchTarget = catalogItems.find((item) => item.appId === initialTargetAppId)
        ?? (initialTargetApp?.appId === initialTargetAppId ? initialTargetApp : null);
      setStep(resolveLaunchStep(catalog, currentAppId, launchTarget));
      return;
    }

    setTargetAppId(initialTargetAppId ?? null);
    setStep('manage');
  }, [open, mode, initialTargetAppId, initialTargetApp, catalog, catalogItems, currentAppId]);

  if (!open) {
    return null;
  }

  async function refreshAndResolve(nextTargetAppId: AppId | null): Promise<void> {
    const refreshed = await onRefreshCatalog();
    const refreshedItems = Array.isArray(refreshed?.items) ? refreshed.items : [];
    const nextTarget = refreshedItems.find((item) => item.appId === nextTargetAppId)
      ?? (targetSnapshot && targetSnapshot.appId === nextTargetAppId ? targetSnapshot : null);
    setStep(resolveLaunchStep(refreshed, currentAppId, nextTarget));
  }

  async function ensureSourceGrant(): Promise<string> {
    if (sourceGrantId) {
      return sourceGrantId;
    }
    if (!currentApp) {
      throw new Error('缺少当前应用定义，无法发起连接授权。');
    }

    const sourceAuthorize = await oauthAuthorize({
      clientId: currentApp.clientId,
      scope: currentApp.requiredBaseScope,
    });
    setSourceGrantId(sourceAuthorize.grantId);
    return sourceAuthorize.grantId;
  }

  async function handleAccountAuthorize(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      await authorizeAccount();
      await refreshAndResolve(targetAppId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'MF 账号授权失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleTargetBaseAuthorize(): Promise<void> {
    if (!targetApp) {
      setError('请先选择目标应用。');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const authorize = await oauthAuthorize({
        clientId: targetApp.clientId,
        scope: targetApp.requiredBaseScope,
      });

      const token = await oauthToken({
        clientId: targetApp.clientId,
        grantId: authorize.grantId,
      });
      const introspect = await oauthIntrospect(token.access_token);

      setTargetGrantId(authorize.grantId);
      setApprovedScopes(parseScopes(token.scope));
      setIntrospectActive(Boolean(introspect.active));
      await refreshAndResolve(targetApp.appId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '目标应用授权失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectAuthorize(): Promise<void> {
    if (!targetApp) {
      setError('请先选择目标应用。');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const grantId = await ensureSourceGrant();
      const template = targetApp.recommendedTemplate ?? {
        dataDomain: 'FOUNDATION_MODEL' as const,
        purpose: 'ANALYTICS_REPORTING' as const,
        retention: 'P30D' as const,
        revocationMode: 'IMMEDIATE_CASCADE' as const,
      };
      const policy = await createSecurityPolicy({
        sourceAppId: currentAppId,
        allowedConsumers: [targetApp.appId],
        dataDomain: template.dataDomain,
        purpose: template.purpose,
        retention: template.retention,
        revocationMode: template.revocationMode,
      });
      if (!policy.success || policy.legalGate === 'FAIL') {
        throw new Error(policy.legalReason ?? '策略授权未通过法务门禁');
      }
      setPolicyId(policy.policy.policyId);

      let nextScopes = approvedScopes;
      let nextIntrospect = introspectActive;

      if (currentApp) {
        const token = await oauthToken({ clientId: currentApp.clientId, grantId });
        const introspect = await oauthIntrospect(token.access_token);
        nextScopes = parseScopes(token.scope);
        nextIntrospect = Boolean(introspect.active);
      }

      setApprovedScopes(nextScopes);
      setIntrospectActive(nextIntrospect);

      await refreshAndResolve(targetApp.appId);
      onInstalled({
        sourceAppId: currentAppId,
        targetAppId: targetApp.appId,
        policyId: policy.policy.policyId,
        sourceGrantId: grantId,
        targetGrantId: targetGrantId || undefined,
        approvedScopes: nextScopes,
        introspectActive: nextIntrospect,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '连接授权失败');
    } finally {
      setLoading(false);
    }
  }

  function handleConfigurePermissions(target: AppCatalogItem): void {
    const url = buildSecurityCenterUrl(currentAppId, target.appId);
    window.location.assign(url);
  }

  const managePanel = (
    <MfAppInstallManagePanel
      catalog={catalog}
      currentAppId={currentAppId}
      visibleApps={pendingApps}
      onRefreshCatalog={onRefreshCatalog}
      onSelectTarget={(nextTargetAppId, nextStep) => {
        setTargetAppId(nextTargetAppId);
        const snapshot = pendingApps.find((item) => item.appId === nextTargetAppId) ?? null;
        setTargetSnapshot(snapshot);
        setStep(nextStep);
      }}
    />
  );

  return (
    <div className="mf-dock-modal-overlay" data-testid="mf-dock-modal">
      <section className="mf-dock-modal-shell" role="dialog" aria-modal="false" aria-label="连接应用面板">
        <header className="mf-dock-modal-header">
          <div>
            <h2>连接应用</h2>
            <p>{stepTitle(step)}</p>
          </div>
          <button type="button" className="mf-dock-close" onClick={onClose}>×</button>
        </header>

        <div className="mf-dock-modal-content">
          {mode === 'manage' && step === 'manage' ? managePanel : (
            <MfAppInstallFlowPanel
              targetApp={targetApp}
              step={step}
              loading={loading}
              sourceGrantId={sourceGrantId}
              targetGrantId={targetGrantId}
              policyId={policyId}
              introspectActive={introspectActive}
              approvedScopes={approvedScopes}
              onAccountAuthorize={() => {
                void handleAccountAuthorize();
              }}
              onTargetBaseAuthorize={() => {
                void handleTargetBaseAuthorize();
              }}
              onConnectAuthorize={() => {
                void handleConnectAuthorize();
              }}
              onConfigurePermissions={handleConfigurePermissions}
              onOpenTarget={onLaunch}
              onClose={onClose}
              fallbackManage={managePanel}
            />
          )}

          {error ? <div className="mf-dock-error">{error}</div> : null}
        </div>
      </section>
    </div>
  );
}
