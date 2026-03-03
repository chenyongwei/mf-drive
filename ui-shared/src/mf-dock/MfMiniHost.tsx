import { useEffect, useMemo, useRef, useState } from 'react';
import { DockCloseIcon, DockOpenInNewIcon } from './icons';
import { buildMiniUrl } from './miniUrl';
import type { AppId, MiniLaunchSession } from './types';

type MfMiniHostProps = {
  session: MiniLaunchSession | null;
  sourceAppId: AppId;
  onClose: () => void;
  onOpenWindow: (session: MiniLaunchSession) => void;
};

export function MfMiniHost(props: MfMiniHostProps) {
  const { session, sourceAppId, onClose, onOpenWindow } = props;
  const [loaded, setLoaded] = useState(false);
  const fallbackTriggeredRef = useRef(false);

  const iframeSrc = useMemo(() => {
    if (!session) {
      return '';
    }
    return buildMiniUrl(session.targetRoute, sourceAppId);
  }, [session, sourceAppId]);

  useEffect(() => {
    setLoaded(false);
    fallbackTriggeredRef.current = false;
  }, [iframeSrc]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (loaded || fallbackTriggeredRef.current) {
        return;
      }
      fallbackTriggeredRef.current = true;
      onOpenWindow(session);
      onClose();
    }, 8000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [session, loaded, onClose, onOpenWindow]);

  if (!session) {
    return null;
  }

  return (
    <aside className="mf-mini-host" data-testid="mf-mini-host">
      <header className="mf-mini-host-header">
        <strong>{session.title}</strong>
        <div className="mf-mini-host-actions">
          <div className="mf-mini-host-action-group" role="group" aria-label="面板操作">
            <button
              type="button"
              className="mf-mini-action-btn"
              title="新窗口"
              aria-label="新窗口"
              onClick={() => {
                onOpenWindow(session);
                onClose();
              }}
              data-testid="mf-mini-open-window"
            >
              <span className="mf-mini-action-icon">
                <DockOpenInNewIcon />
              </span>
              <span className="mf-mini-action-label">新窗口</span>
            </button>
            <button
              type="button"
              className="mf-mini-action-btn"
              title="关闭"
              aria-label="关闭"
              onClick={onClose}
              data-testid="mf-mini-close"
            >
              <span className="mf-mini-action-icon">
                <DockCloseIcon />
              </span>
              <span className="mf-mini-action-label">关闭</span>
            </button>
          </div>
        </div>
      </header>
      <div className="mf-mini-host-body">
        {!loaded ? <div className="mf-mini-loading">加载中...</div> : null}
        <iframe
          title={`${session.title}-mini`}
          src={iframeSrc}
          onLoad={() => setLoaded(true)}
          data-testid="mf-mini-iframe"
        />
      </div>
    </aside>
  );
}
