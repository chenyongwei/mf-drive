import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MfAppInstallModal } from './MfAppInstallModal';
import type { AppCatalogItem, AppInstallSession, AppsCatalogResponse } from './types';

vi.mock('./MfAppInstallModal.panels', () => ({
  MfAppInstallManagePanel: ({ visibleApps }: { visibleApps: AppCatalogItem[] }) => (
    <div data-testid="mf-manage-panel">{visibleApps.length}</div>
  ),
  MfAppInstallFlowPanel: () => <div data-testid="mf-flow-panel">flow</div>,
}));

vi.mock('./api', () => ({
  authorizeAccount: vi.fn(),
  createSecurityPolicy: vi.fn(),
  oauthAuthorize: vi.fn(),
  oauthIntrospect: vi.fn(),
  oauthToken: vi.fn(),
}));

describe('MfAppInstallModal', () => {
  it('handles catalog payload without items safely', () => {
    const malformedCatalog = { accountAuthorized: true } as unknown as AppsCatalogResponse;

    render(
      <MfAppInstallModal
        open
        mode="launch"
        currentAppId="nesting"
        catalog={malformedCatalog}
        initialTargetAppId="drawing"
        initialTargetApp={null}
        onClose={vi.fn()}
        onRefreshCatalog={vi.fn().mockResolvedValue(malformedCatalog)}
        onInstalled={vi.fn<(session: AppInstallSession) => void>()}
        onLaunch={vi.fn<(target: AppCatalogItem) => void>()}
      />,
    );

    expect(screen.getByTestId('mf-dock-modal')).toBeInTheDocument();
    expect(screen.getByTestId('mf-flow-panel')).toBeInTheDocument();
  });
});
