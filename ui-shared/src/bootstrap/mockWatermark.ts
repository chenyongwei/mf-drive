type BootEnv = Record<string, string | undefined>;

type MockWatermarkWindow = Window & {
  __mfMockWatermarkInstalled__?: boolean;
  __mfMockWatermarkCleanup__?: () => void;
};

const WATERMARK_ID = 'mf-mock-watermark';
const WATERMARK_TOGGLE_ATTR = 'data-mf-mock-watermark-toggle';
const WATERMARK_PANEL_ATTR = 'data-mf-mock-watermark-panel';

function readEnv(): BootEnv {
  return ((import.meta as ImportMeta & { env?: BootEnv }).env ?? {}) as BootEnv;
}

function isMockMode(env: BootEnv): boolean {
  const compatMode = env.VITE_COMPAT_API_MODE ?? 'msw';
  return compatMode === 'msw' || env.VITE_API_MODE === 'mock';
}

function resolveSourceLabel(env: BootEnv): string {
  const algoMode = env.VITE_MOCK_ALGO_MODE === 'backend' ? 'backend' : 'msw';
  return algoMode === 'backend' ? 'Backend Mock API' : 'Frontend Mock (MSW)';
}

function buildWatermarkText(env: BootEnv): string {
  const profile = env.VITE_MOCK_PROFILE ?? 'base';
  return `Profile: ${profile} | Source: ${resolveSourceLabel(env)}`;
}

function removeWatermarkNode(): void {
  const existing = document.getElementById(WATERMARK_ID);
  existing?.remove();
}

function upsertWatermark(env: BootEnv): void {
  if (!document.body) {
    return;
  }

  let root = document.getElementById(WATERMARK_ID) as HTMLDivElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = WATERMARK_ID;
    root.dataset.mfMockWatermark = 'true';
    root.dataset.expanded = 'false';
    document.body.append(root);
  }

  Object.assign(root.style, {
    position: 'fixed',
    bottom: '12px',
    right: '12px',
    zIndex: '2147483647',
    pointerEvents: 'none',
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    maxWidth: 'min(80vw, 340px)',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  } satisfies Partial<CSSStyleDeclaration>);

  let toggle = root.querySelector<HTMLButtonElement>(`button[${WATERMARK_TOGGLE_ATTR}="true"]`);
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.setAttribute(WATERMARK_TOGGLE_ATTR, 'true');
    root.append(toggle);
  }

  Object.assign(toggle.style, {
    pointerEvents: 'auto',
    userSelect: 'none',
    padding: '5px 10px',
    borderRadius: '999px',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: 'rgba(15, 23, 42, 0.32)',
    color: 'rgba(226, 232, 240, 0.86)',
    boxShadow: '0 6px 18px rgba(2, 6, 23, 0.20)',
    backdropFilter: 'blur(1.5px)',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.02em',
    lineHeight: '1.2',
    cursor: 'pointer',
    outline: 'none',
  } satisfies Partial<CSSStyleDeclaration>);
  toggle.textContent = 'Mock Mode';

  let panel = root.querySelector<HTMLDivElement>(`div[${WATERMARK_PANEL_ATTR}="true"]`);
  if (!panel) {
    panel = document.createElement('div');
    panel.setAttribute(WATERMARK_PANEL_ATTR, 'true');
    root.append(panel);
  }

  Object.assign(panel.style, {
    pointerEvents: 'auto',
    userSelect: 'text',
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.28)',
    background: 'rgba(15, 23, 42, 0.24)',
    color: 'rgba(226, 232, 240, 0.82)',
    boxShadow: '0 8px 18px rgba(2, 6, 23, 0.16)',
    backdropFilter: 'blur(1.5px)',
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.01em',
    lineHeight: '1.35',
  } satisfies Partial<CSSStyleDeclaration>);

  panel.textContent = buildWatermarkText(env);

  const syncExpandedState = (): void => {
    const expanded = root?.dataset.expanded === 'true';
    panel!.hidden = !expanded;
    toggle!.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle!.setAttribute('aria-label', expanded ? 'Hide mock mode details' : 'Show mock mode details');
  };

  toggle.onclick = () => {
    const expanded = root?.dataset.expanded === 'true';
    if (!root) return;
    root.dataset.expanded = expanded ? 'false' : 'true';
    syncExpandedState();
  };

  syncExpandedState();
}

function installMockWatermark(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const guardWindow = window as MockWatermarkWindow;
  const activate = (): void => {
    const env = readEnv();
    if (!isMockMode(env)) {
      removeWatermarkNode();
      return;
    }
    upsertWatermark(env);
  };

  if (guardWindow.__mfMockWatermarkInstalled__) {
    activate();
    return;
  }

  guardWindow.__mfMockWatermarkInstalled__ = true;
  activate();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activate, { once: true });
  }

  guardWindow.__mfMockWatermarkCleanup__ = () => {
    removeWatermarkNode();
    guardWindow.__mfMockWatermarkInstalled__ = false;
    delete guardWindow.__mfMockWatermarkCleanup__;
  };

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      guardWindow.__mfMockWatermarkCleanup__?.();
    });
  }
}

installMockWatermark();

export {};
