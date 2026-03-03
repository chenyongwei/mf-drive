import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAppsCatalog } from './api';
import { MfAppsDock } from './MfAppsDock';
import type { AppsCatalogResponse } from './types';

vi.mock('./api', () => ({
  fetchAppsCatalog: vi.fn(),
}));

vi.mock('./MfAppInstallModal', () => ({
  MfAppInstallModal: ({ open }: { open: boolean }) => (open ? <div data-testid="mf-dock-modal" /> : null),
}));

vi.mock('./MfMiniHost', () => ({
  MfMiniHost: ({ session }: { session: { targetAppId: string } | null }) => (
    session ? <div data-testid="mf-mini-host">{session.targetAppId}</div> : null
  ),
}));

const fetchAppsCatalogMock = vi.mocked(fetchAppsCatalog);
const originalInnerWidth = window.innerWidth;

const CATALOG: AppsCatalogResponse = {
  accountAuthorized: true,
  items: [
    {
      appId: 'ordering',
      name: '订单',
      route: '/ordering/orders',
      clientId: 'ordering-web',
      enabledByUser: true,
      requiredBaseScope: 'foundation.read',
      connectScope: 'mf.connect.ordering.ordering.read',
      connectGranted: true,
      requiresConnectScope: false,
      policyGranted: true,
      activePolicyCount: 1,
      launchMode: 'MINI',
      miniSupported: true,
      installedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      appId: 'drawing',
      name: '图纸',
      route: '/drawing/editor',
      clientId: 'drawing-web',
      enabledByUser: true,
      requiredBaseScope: 'foundation.read',
      connectScope: 'mf.connect.ordering.drawing.read',
      connectGranted: true,
      requiresConnectScope: true,
      policyGranted: true,
      activePolicyCount: 1,
      launchMode: 'MINI',
      miniSupported: true,
      installedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      appId: 'wms',
      name: 'WMS',
      route: '/wms/materials',
      clientId: 'wms-web',
      enabledByUser: true,
      requiredBaseScope: 'wms.read',
      connectScope: 'mf.connect.ordering.wms.read',
      connectGranted: false,
      requiresConnectScope: true,
      policyGranted: false,
      activePolicyCount: 0,
      launchMode: 'MINI',
      miniSupported: true,
      installedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  total: 3,
};

const MALFORMED_CATALOG = {
  success: true,
  message: 'compat fallback response',
  path: '/api/foundation/apps/catalog',
  method: 'GET',
} as unknown as AppsCatalogResponse;

describe('MfAppsDock', () => {
  beforeEach(() => {
    fetchAppsCatalogMock.mockReset();
    fetchAppsCatalogMock.mockResolvedValue(CATALOG);
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
    document.body.classList.remove('mf-dock-expanded', 'mf-dock-panel-open');
    document.documentElement.style.removeProperty('--mf-dock-base-shift');
    document.documentElement.style.removeProperty('--mf-dock-open-shift');
    document.documentElement.style.removeProperty('--mf-dock-fixed-width');
    document.documentElement.style.removeProperty('--mf-dock-content-reserve');
  });

  it('closes previous mini session when opening another app that requires install modal', async () => {
    render(<MfAppsDock currentAppId="ordering" />);

    await waitFor(() => {
      expect(fetchAppsCatalogMock).toHaveBeenCalled();
    });

    fireEvent.click(await screen.findByTestId('mf-dock-app-drawing'));
    expect(await screen.findByTestId('mf-mini-host')).toHaveTextContent('drawing');

    fireEvent.click(screen.getByTestId('mf-dock-app-wms'));

    expect(await screen.findByTestId('mf-dock-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('mf-mini-host')).not.toBeInTheDocument();
  });

  it('opens launch modal even when catalog payload is malformed', async () => {
    fetchAppsCatalogMock.mockResolvedValueOnce(MALFORMED_CATALOG);
    render(<MfAppsDock currentAppId="nesting" />);

    await waitFor(() => {
      expect(fetchAppsCatalogMock).toHaveBeenCalled();
    });

    fireEvent.click(await screen.findByTestId('mf-dock-app-drawing'));
    expect(await screen.findByTestId('mf-dock-modal')).toBeInTheDocument();
  });

  it('subtracts pre-reserved width when panel opens to avoid extra blank gap', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1400,
    });
    document.documentElement.style.setProperty('--mf-dock-fixed-width', '72px');
    document.documentElement.style.setProperty('--mf-dock-content-reserve', '64px');

    render(<MfAppsDock currentAppId="ordering" />);

    await waitFor(() => {
      expect(fetchAppsCatalogMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByTestId('mf-dock-plus'));
    expect(await screen.findByTestId('mf-dock-modal')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.body.classList.contains('mf-dock-panel-open')).toBe(true);
      expect(document.documentElement.style.getPropertyValue('--mf-dock-open-shift')).toBe('488px');
    });
  });

  it('clears reserved shift after dock collapse when content reserve is disabled', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1400,
    });
    document.documentElement.style.setProperty('--mf-dock-fixed-width', '72px');

    render(<MfAppsDock currentAppId="drawing" contentReserveWidth={0} />);

    await waitFor(() => {
      expect(fetchAppsCatalogMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(document.body.classList.contains('mf-dock-expanded')).toBe(true);
      expect(document.documentElement.style.getPropertyValue('--mf-dock-base-shift')).toBe('72px');
    });

    fireEvent.click(screen.getByTestId('mf-dock-collapse'));

    await waitFor(() => {
      expect(document.body.classList.contains('mf-dock-expanded')).toBe(false);
      expect(document.documentElement.style.getPropertyValue('--mf-dock-base-shift')).toBe('');
    });
  });
});
