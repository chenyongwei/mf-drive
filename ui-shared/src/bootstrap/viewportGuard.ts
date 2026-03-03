const VIEWPORT_META_CONTENT =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

type GuardWindow = Window & {
  __mfViewportGuardInstalled__?: boolean;
  __mfViewportGuardCleanup__?: () => void;
};

function ensureViewportMeta(): void {
  const existing = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (existing) {
    existing.setAttribute('content', VIEWPORT_META_CONTENT);
    return;
  }

  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = VIEWPORT_META_CONTENT;
  document.head.append(meta);
}

function applyRootScrollGuards(): void {
  const html = document.documentElement;
  html.style.height = '100%';
  html.style.overscrollBehavior = 'none';

  if (!document.body) {
    return;
  }

  const body = document.body;
  body.style.height = '100%';
  body.style.overscrollBehavior = 'none';
}

function installViewportGuard(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const guardWindow = window as GuardWindow;
  if (guardWindow.__mfViewportGuardInstalled__) {
    return;
  }
  guardWindow.__mfViewportGuardInstalled__ = true;

  const activate = (): void => {
    ensureViewportMeta();
    applyRootScrollGuards();
  };

  activate();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activate, { once: true });
  }

  const zoomKeys = new Set([
    '=',
    '+',
    '-',
    '_',
    '0',
    'Equal',
    'Minus',
    'Digit0',
    'NumpadAdd',
    'NumpadSubtract',
    'Numpad0',
  ]);

  const handleWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }
    if (zoomKeys.has(event.key) || zoomKeys.has(event.code)) {
      event.preventDefault();
    }
  };

  const preventGesture: EventListener = (event) => {
    event.preventDefault();
  };

  const handleTouchMove: EventListener = (event) => {
    const touchEvent = event as TouchEvent;
    if (touchEvent.touches.length > 1) {
      touchEvent.preventDefault();
    }
  };

  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('keydown', handleKeyDown);
  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });

  guardWindow.__mfViewportGuardCleanup__ = () => {
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('gesturestart', preventGesture);
    document.removeEventListener('gesturechange', preventGesture);
    document.removeEventListener('gestureend', preventGesture);
    document.removeEventListener('touchmove', handleTouchMove);
    guardWindow.__mfViewportGuardInstalled__ = false;
    delete guardWindow.__mfViewportGuardCleanup__;
  };

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      guardWindow.__mfViewportGuardCleanup__?.();
    });
  }
}

installViewportGuard();

export {};
