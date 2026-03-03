import { useEffect, useMemo, useState } from 'react';
import {
  APP_BY_ID,
  APP_IDS,
  APP_REGISTRY,
  DOCK_APP_IDS,
  type AppRegistryEntry,
  type FoundationAppId,
  buildConnectScope,
} from '@platform/contracts/generated/apps';
import { fetchAppsCatalog } from './api';
import { MfAppInstallModal } from './MfAppInstallModal';
import { MfMiniHost } from './MfMiniHost';
import { buildMiniUrl } from './miniUrl';
import type { AppCatalogItem, AppId, AppsCatalogResponse, MiniLaunchSession } from './types';
import './styles.css';

type MfAppsDockProps = {
  currentAppId: AppId;
  variant?: 'fixed' | 'rail';
  contentReserveWidth?: number;
};

type DockModalMode = 'manage' | 'launch';

const CATALOG_CACHE_KEY = 'mf-dock-catalog-cache.v1';
const PANEL_MAX_WIDTH = 460;
const MINI_PANEL_MAX_WIDTH = 560;
const PANEL_MIN_WIDTH = 280;
const PANEL_GAP_TO_DOCK = 8;
const PANEL_SAFE_GAP = 12;
const PANEL_CALC_PADDING = 26;
const PANEL_PUSH_MIN_VIEWPORT = 980;
const DOCK_DEFAULT_WIDTH = 72;
const CONTENT_RESERVED_WIDTH_FALLBACK = 64;

type DockCatalogItem = AppCatalogItem & {
  dockIcon: string;
};

function isMiniPage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  if (new URLSearchParams(window.location.search).get('mfDockMini') === '1') {
    return true;
  }
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

type DockTheme = 'light' | 'dark';

function normalizeTheme(value: string | null | undefined): DockTheme | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'dark' || normalized === 'night') {
    return 'dark';
  }
  if (normalized === 'light' || normalized === 'day') {
    return 'light';
  }
  return null;
}

function readStorageTheme(): DockTheme | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const keys = [
    'foundation-theme',
    'foundation.theme',
    'foundation_ui_theme',
    'mf-theme',
    'mf.theme',
    'theme',
  ];
  for (const key of keys) {
    try {
      const value = window.localStorage.getItem(key);
      const resolved = normalizeTheme(value);
      if (resolved) {
        return resolved;
      }
    } catch {
      // ignore storage read failures
    }
  }
  return null;
}

function resolveDockTheme(): DockTheme {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'light';
  }

  const root = document.documentElement;
  const body = document.body;
  const themeCandidates = [
    root.getAttribute('data-foundation-theme'),
    root.getAttribute('data-foundation-color-mode'),
    root.getAttribute('data-theme'),
    root.getAttribute('data-color-mode'),
    body.getAttribute('data-theme'),
    body.getAttribute('data-color-mode'),
  ];

  for (const candidate of themeCandidates) {
    const resolved = normalizeTheme(candidate);
    if (resolved) {
      return resolved;
    }
  }

  if (root.classList.contains('dark') || body.classList.contains('dark')) {
    return 'dark';
  }

  const storageTheme = readStorageTheme();
  if (storageTheme) {
    return storageTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function registryEntry(appId: AppId): AppRegistryEntry | undefined {
  return APP_BY_ID[appId as FoundationAppId];
}

function toFallbackCatalogItem(sourceAppId: AppId, targetAppId: AppId): DockCatalogItem {
  const entry = registryEntry(targetAppId);
  const recommendedTemplate = entry?.security.recommendedTemplate ?? {
    dataDomain: 'FOUNDATION_MODEL' as const,
    purpose: 'ANALYTICS_REPORTING' as const,
    retention: 'P30D' as const,
    revocationMode: 'IMMEDIATE_CASCADE' as const,
  };

  return {
    appId: targetAppId,
    name: entry?.name ?? targetAppId,
    route: entry?.route ?? '/',
    clientId: entry?.clientId ?? `${targetAppId}-web`,
    enabledByUser: entry?.enabledByUser ?? true,
    requiredBaseScope: entry?.requiredBaseScope ?? 'foundation.read',
    connectScope: buildConnectScope(sourceAppId, targetAppId),
    connectGranted: targetAppId === sourceAppId,
    requiresConnectScope: targetAppId !== sourceAppId,
    policyGranted: targetAppId === sourceAppId,
    activePolicyCount: targetAppId === sourceAppId ? 1 : 0,
    recommendedTemplate,
    launchMode: entry?.launchMode ?? 'MINI',
    miniSupported: entry?.miniSupported ?? true,
    dockIcon: entry?.dock.icon ?? targetAppId,
  };
}

function normalizeDockCatalogItems(sourceAppId: AppId, catalog: AppsCatalogResponse | null): DockCatalogItem[] {
  const byId = new Map<AppId, AppCatalogItem>();
  for (const item of getCatalogItems(catalog)) {
    byId.set(item.appId, item);
  }

  return DOCK_APP_IDS.map((targetAppId) => {
    const existing = byId.get(targetAppId as AppId);
    if (existing) {
      const entry = registryEntry(existing.appId);
      return {
        ...existing,
        dockIcon: entry?.dock.icon ?? existing.appId,
      };
    }
    return toFallbackCatalogItem(sourceAppId, targetAppId as AppId);
  });
}

function buildRegistryFallbackCatalog(sourceAppId: AppId): AppsCatalogResponse {
  const items = APP_IDS.map((appId) => toFallbackCatalogItem(sourceAppId, appId as AppId));
  return {
    accountAuthorized: false,
    items,
    total: items.length,
  };
}

function readCachedCatalog(sourceAppId: AppId): AppsCatalogResponse | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Record<string, AppsCatalogResponse>;
    return normalizeCatalog(parsed[sourceAppId] ?? null);
  } catch {
    return null;
  }
}

function writeCachedCatalog(sourceAppId: AppId, catalog: AppsCatalogResponse): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const raw = window.localStorage.getItem(CATALOG_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, AppsCatalogResponse>) : {};
    parsed[sourceAppId] = catalog;
    window.localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage failures
  }
}

function getCatalogItems(catalog: AppsCatalogResponse | null): AppCatalogItem[] {
  return Array.isArray(catalog?.items) ? catalog.items : [];
}

function normalizeCatalog(catalog: AppsCatalogResponse | null): AppsCatalogResponse | null {
  if (!catalog) {
    return null;
  }

  const items = getCatalogItems(catalog);
  const total = typeof catalog.total === 'number' && Number.isFinite(catalog.total)
    ? catalog.total
    : items.length;

  return {
    accountAuthorized: catalog.accountAuthorized === true,
    ...(typeof catalog.accountAuthorizedAt === 'string' ? { accountAuthorizedAt: catalog.accountAuthorizedAt } : {}),
    items,
    total,
  };
}

function canLaunchDirect(
  catalog: AppsCatalogResponse | null,
  currentAppId: AppId,
  targetAppId: AppId,
): boolean {
  if (!catalog) {
    return false;
  }
  if (catalog.accountAuthorized !== true) {
    return false;
  }

  const target = getCatalogItems(catalog).find((item) => item.appId === targetAppId);
  if (!target || target.appId === currentAppId) {
    return false;
  }
  const policyGranted = target.policyGranted ?? target.connectGranted;
  if (target.appId !== currentAppId && !policyGranted) {
    return false;
  }

  return true;
}

function AppGlyph({ icon }: { icon: string }) {
  if (icon === 'nesting') {
    return (
      <svg className="mf-dock-glyph-svg" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="6" y="7" width="11" height="7" rx="1.6" />
        <rect x="11" y="12.5" width="11" height="7" rx="1.6" />
        <rect x="16" y="18" width="10" height="7" rx="1.6" />
      </svg>
    );
  }
  if (icon === 'drawing') {
    return (
      <svg className="mf-dock-glyph-svg" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M8 24H15.5" />
        <path d="M10.5 21.5L21.8 10.2L24.8 13.2L13.5 24.5H9.5L10.5 21.5Z" />
        <path d="M20.2 11.8L23.2 14.8" />
      </svg>
    );
  }
  if (icon === 'ordering') {
    return (
      <svg className="mf-dock-glyph-svg" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="8" y="8" width="16" height="18" rx="3" />
        <path d="M12 6.5H20V9.5H12Z" />
        <path d="M12 14H20M12 18H20M12 22H18" />
      </svg>
    );
  }
  if (icon === 'crm') {
    return (
      <svg className="mf-dock-glyph-svg" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="20" cy="13" r="3" />
        <path d="M6 24.5C6.7 21.2 9.1 19 12 19C14.9 19 17.3 21.2 18 24.5" />
        <path d="M16.4 24.5C16.9 22.3 18.5 20.9 20.5 20.9C22.5 20.9 24.1 22.3 24.6 24.5" />
      </svg>
    );
  }
  if (icon === 'aps') {
    return (
      <svg className="mf-dock-glyph-svg" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="6.5" y="8" width="19" height="17.5" rx="3" />
        <path d="M10.5 6.5V10.2M21.5 6.5V10.2M6.5 13H25.5" />
        <path d="M11.2 17.5L14 20.2L20.8 14.1" />
      </svg>
    );
  }
  if (icon === 'wms') {
    return (
      <svg className="mf-dock-glyph-svg" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 6.5L24.5 11.2V20.8L16 25.5L7.5 20.8V11.2L16 6.5Z" />
        <path d="M16 16V25.5M7.5 11.2L16 16L24.5 11.2" />
      </svg>
    );
  }
  return (
    <svg className="mf-dock-glyph-svg" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9.2 22.8C7 22.8 5.2 21.1 5.2 18.9C5.2 16.8 6.8 15.1 8.9 15C9.6 11.7 12.5 9.3 16 9.3C19.2 9.3 22 11.2 23 14C25.2 14.2 26.8 15.9 26.8 18C26.8 20.7 24.6 22.8 22 22.8H9.2Z" />
      <path d="M16 14.2V19.8M13.6 17.6L16 19.9L18.4 17.6" />
    </svg>
  );
}

export function MfAppsDock(props: MfAppsDockProps) {
  const { currentAppId, variant = 'fixed', contentReserveWidth } = props;

  const [catalog, setCatalog] = useState<AppsCatalogResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<DockModalMode>('manage');
  const [targetAppId, setTargetAppId] = useState<AppId | null>(null);
  const [targetAppSnapshot, setTargetAppSnapshot] = useState<AppCatalogItem | null>(null);
  const [miniSession, setMiniSession] = useState<MiniLaunchSession | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [dockTheme, setDockTheme] = useState<DockTheme>(() => resolveDockTheme());

  const miniPage = useMemo(() => isMiniPage(), []);
  const panelOpen = modalOpen || Boolean(miniSession);
  const registryFallback = useMemo(() => buildRegistryFallbackCatalog(currentAppId), [currentAppId]);

  async function refreshCatalog(): Promise<AppsCatalogResponse | null> {
    setLoading(true);
    try {
      const response = await fetchAppsCatalog(currentAppId);
      const normalized = normalizeCatalog(response);
      if (normalized) {
        setCatalog(normalized);
        writeCachedCatalog(currentAppId, normalized);
        return normalized;
      }
      const cached = readCachedCatalog(currentAppId);
      const fallback = cached ?? registryFallback;
      setCatalog(fallback);
      return fallback;
    } catch {
      const cached = readCachedCatalog(currentAppId);
      const fallback = cached ?? registryFallback;
      setCatalog(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!catalog) {
      setCatalog(registryFallback);
    }
  }, [catalog, registryFallback]);

  useEffect(() => {
    void refreshCatalog();
  }, [currentAppId]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const updateTheme = () => {
      setDockTheme(resolveDockTheme());
    };

    updateTheme();

    const observer = new MutationObserver(() => updateTheme());
    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        'class',
        'data-theme',
        'data-color-mode',
        'data-foundation-theme',
        'data-foundation-color-mode',
      ],
    });
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-color-mode'],
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMedia = () => updateTheme();
    media.addEventListener('change', handleMedia);
    window.addEventListener('storage', updateTheme);
    window.addEventListener('foundation-theme-change', updateTheme);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', handleMedia);
      window.removeEventListener('storage', updateTheme);
      window.removeEventListener('foundation-theme-change', updateTheme);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.setAttribute('data-mf-dock-theme', dockTheme);
    return () => {
      root.removeAttribute('data-mf-dock-theme');
    };
  }, [dockTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const expandedClass = 'mf-dock-expanded';

    function clearBaseShift(): void {
      body.classList.remove(expandedClass);
      root.style.removeProperty('--mf-dock-base-shift');
    }

    function applyBaseShift(): void {
      if (miniPage || variant !== 'fixed' || dockCollapsed) {
        clearBaseShift();
        return;
      }

      const rootStyles = getComputedStyle(root);
      const dockWidthRaw = Number.parseFloat(rootStyles.getPropertyValue('--mf-dock-fixed-width').trim());
      const reserveRaw = Number.parseFloat(rootStyles.getPropertyValue('--mf-dock-content-reserve').trim());
      const dockWidth = Number.isFinite(dockWidthRaw) ? dockWidthRaw : DOCK_DEFAULT_WIDTH;
      const reserveWidth = typeof contentReserveWidth === 'number'
        ? Math.max(0, contentReserveWidth)
        : Number.isFinite(reserveRaw)
          ? reserveRaw
          : CONTENT_RESERVED_WIDTH_FALLBACK;
      const baseShift = Math.max(0, dockWidth - reserveWidth);
      root.style.setProperty('--mf-dock-base-shift', `${Math.round(baseShift)}px`);
      body.classList.add(expandedClass);
    }

    applyBaseShift();
    window.addEventListener('resize', applyBaseShift);

    return () => {
      window.removeEventListener('resize', applyBaseShift);
      clearBaseShift();
    };
  }, [contentReserveWidth, dockCollapsed, miniPage, variant]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const openClass = 'mf-dock-panel-open';

    function clearShift(): void {
      body.classList.remove(openClass);
      root.style.removeProperty('--mf-dock-open-shift');
    }

    function applyShift(): void {
      if (!panelOpen || miniPage || variant !== 'fixed' || window.innerWidth <= PANEL_PUSH_MIN_VIEWPORT) {
        clearShift();
        return;
      }

      const rootStyles = getComputedStyle(root);
      const dockWidthRaw = Number.parseFloat(rootStyles.getPropertyValue('--mf-dock-fixed-width').trim());
      const reserveRaw = Number.parseFloat(rootStyles.getPropertyValue('--mf-dock-content-reserve').trim());
      const dockWidth = Number.isFinite(dockWidthRaw) ? dockWidthRaw : DOCK_DEFAULT_WIDTH;
      const reserveWidth = typeof contentReserveWidth === 'number'
        ? Math.max(0, contentReserveWidth)
        : Number.isFinite(reserveRaw)
          ? reserveRaw
          : CONTENT_RESERVED_WIDTH_FALLBACK;
      const panelMaxWidth = miniSession ? MINI_PANEL_MAX_WIDTH : PANEL_MAX_WIDTH;
      const panelWidth = Math.min(
        panelMaxWidth,
        Math.max(PANEL_MIN_WIDTH, window.innerWidth - dockWidth - PANEL_CALC_PADDING),
      );
      const requiredWidth = dockWidth + PANEL_GAP_TO_DOCK + panelWidth + PANEL_SAFE_GAP;
      const shiftWidth = Math.min(
        window.innerWidth - 160,
        Math.max(0, requiredWidth - reserveWidth),
      );
      root.style.setProperty('--mf-dock-open-shift', `${Math.round(shiftWidth)}px`);
      body.classList.add(openClass);
    }

    applyShift();
    window.addEventListener('resize', applyShift);

    return () => {
      window.removeEventListener('resize', applyShift);
      clearShift();
    };
  }, [contentReserveWidth, panelOpen, miniSession, miniPage, variant]);

  const orderedApps = useMemo(() => normalizeDockCatalogItems(currentAppId, catalog), [catalog, currentAppId]);

  const dockClassName = [
    variant === 'rail' ? 'mf-apps-dock mf-apps-dock-rail' : 'mf-apps-dock mf-apps-dock-fixed',
    dockCollapsed ? 'mf-apps-dock-collapsed' : '',
  ].join(' ').trim();

  function openManage(): void {
    setMiniSession(null);
    setTargetAppId(null);
    setTargetAppSnapshot(null);
    setModalMode('manage');
    setModalOpen(true);
  }

  async function openLaunch(appId: AppId): Promise<void> {
    if (appId === currentAppId) {
      return;
    }
    setMiniSession(null);

    const latestCatalog = normalizeCatalog(catalog) ?? await refreshCatalog();
    const latestTarget = getCatalogItems(latestCatalog).find((item) => item.appId === appId) ?? null;
    const fallbackTarget = orderedApps.find((item) => item.appId === appId) ?? null;
    const launchTargetApp = latestTarget ?? fallbackTarget;

    if (canLaunchDirect(latestCatalog, currentAppId, appId) && latestTarget) {
      launchTarget(latestTarget);
      return;
    }

    setTargetAppId(appId);
    setTargetAppSnapshot(launchTargetApp);
    setModalMode('launch');
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
    setTargetAppId(null);
    setTargetAppSnapshot(null);
  }

  function launchTarget(target: AppCatalogItem): void {
    if (target.launchMode === 'MINI' && target.miniSupported) {
      setMiniSession({
        targetAppId: target.appId,
        targetRoute: target.route,
        title: target.name,
      });
      closeModal();
      return;
    }

    window.open(target.route, '_blank', 'noopener,noreferrer');
    closeModal();
  }

  if (miniPage) {
    return null;
  }

  return (
    <>
      <aside className={dockClassName} data-testid="mf-apps-dock">
        {!dockCollapsed ? (
          <>
            {orderedApps
              .filter((item) => item.appId !== currentAppId)
              .map((item) => {
                const granted = item.policyGranted ?? item.connectGranted;
                const isLocked = item.requiresConnectScope && !granted;
                return (
                  <button
                    key={item.appId}
                    type="button"
                    className={`mf-dock-icon mf-dock-icon-${item.appId}`}
                    title={item.name}
                    aria-label={item.name}
                    onClick={() => {
                      void openLaunch(item.appId);
                    }}
                    data-testid={`mf-dock-app-${item.appId}`}
                  >
                    <span className="mf-dock-glyph">
                      <AppGlyph icon={item.dockIcon} />
                    </span>
                    <span className="mf-dock-label">{item.name}</span>
                    {isLocked ? <em className="mf-dock-lock">!</em> : null}
                  </button>
                );
              })}

            <span className="mf-dock-divider" aria-hidden="true" />

            <button
              type="button"
              className="mf-dock-plus"
              onClick={() => {
                openManage();
              }}
              title="应用中心"
              aria-label="应用中心"
              data-testid="mf-dock-plus"
            >
              <span className="mf-dock-glyph">+</span>
              <span className="mf-dock-label">应用中心</span>
            </button>

            {loading ? <span className="mf-dock-loading">...</span> : null}
          </>
        ) : null}

        {!panelOpen ? (
          <button
            type="button"
            className="mf-dock-collapse"
            onClick={() => {
              setDockCollapsed((previous) => !previous);
            }}
            title={dockCollapsed ? '展开侧栏' : '折叠侧栏'}
            aria-label={dockCollapsed ? '展开侧栏' : '折叠侧栏'}
            data-testid="mf-dock-collapse"
          >
            <span className="mf-dock-collapse-glyph">{dockCollapsed ? '‹' : '›'}</span>
            <span className="mf-dock-collapse-label">{dockCollapsed ? '展开侧栏' : '折叠侧栏'}</span>
          </button>
        ) : null}
      </aside>

      <MfAppInstallModal
        open={modalOpen}
        mode={modalMode}
        currentAppId={currentAppId}
        catalog={catalog}
        initialTargetAppId={targetAppId}
        initialTargetApp={targetAppSnapshot}
        onClose={closeModal}
        onRefreshCatalog={refreshCatalog}
        onInstalled={() => {}}
        onLaunch={launchTarget}
      />

      <MfMiniHost
        session={miniSession}
        sourceAppId={currentAppId}
        onClose={() => setMiniSession(null)}
        onOpenWindow={(nextSession) => {
          const url = buildMiniUrl(nextSession.targetRoute, currentAppId);
          window.open(url, '_blank', 'noopener,noreferrer');
        }}
      />
    </>
  );
}
