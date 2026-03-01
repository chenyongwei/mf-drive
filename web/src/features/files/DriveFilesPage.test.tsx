import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveFilesPage } from './DriveFilesPage';
import { useDriveSession } from '../auth/useDriveSession';
import { RequestError } from '../auth/oauth';
import {
  createDriveContainer,
  getArtifactDownloadUrl,
  initArtifactUpload,
  completeArtifactUpload,
  listDriveContainers,
  queryDriveArtifacts,
} from './api';

vi.mock('@platform/ui-shared/mf-shell', () => ({
  MfAppShell: ({ children }: { children: unknown }) => (
    <div data-testid="mock-app-shell">{children as any}</div>
  ),
}));

vi.mock('../auth/useDriveSession', () => ({
  useDriveSession: vi.fn(),
}));

vi.mock('./api', () => ({
  createDriveContainer: vi.fn(),
  getArtifactDownloadUrl: vi.fn(),
  initArtifactUpload: vi.fn(),
  completeArtifactUpload: vi.fn(),
  listDriveContainers: vi.fn(),
  queryDriveArtifacts: vi.fn(),
  toDriveApiError: (error: unknown) => String(error),
}));

const baseSession = {
  status: 'ready' as const,
  accountAuthorized: true,
  tokenActive: true,
  accessToken: 'token-001',
  scopes: ['drive.appdata.read'],
  expiresAtEpoch: 1893456000,
  error: null,
  refresh: vi.fn(async () => undefined),
  authorize: vi.fn(async () => undefined),
  clearToken: vi.fn(),
};

describe('DriveFilesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useDriveSession).mockReturnValue({ ...baseSession });
    vi.mocked(listDriveContainers).mockResolvedValue({
      items: [
        {
          containerId: 'ctr-1',
          tenantId: 'tenant-1',
          ownerAppId: 'drive',
          mode: 'APP_DATA',
          name: '主容器',
          quotaBytes: 1000,
          usedBytes: 200,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
    });
    vi.mocked(queryDriveArtifacts).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('creates container and refreshes data', async () => {
    vi.mocked(createDriveContainer).mockResolvedValue({
      container: {
        containerId: 'ctr-2',
        tenantId: 'tenant-1',
        ownerAppId: 'drive',
        mode: 'APP_DATA',
        name: '新容器',
        quotaBytes: 1000,
        usedBytes: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });

    render(<DriveFilesPage />);

    await waitFor(() => {
      expect(listDriveContainers).toHaveBeenCalled();
    });

    await userEvent.type(screen.getByTestId('container-create-name'), '新容器');
    await userEvent.click(screen.getByTestId('container-create-submit'));

    await waitFor(() => {
      expect(createDriveContainer).toHaveBeenCalledWith(
        'token-001',
        expect.objectContaining({
          name: '新容器',
          mode: 'APP_DATA',
        }),
      );
    });
  });

  it('executes metadata upload flow', async () => {
    vi.mocked(initArtifactUpload).mockResolvedValue({
      artifactId: 'art-1',
      versionId: 'ver-1',
      uploadUrl: 'https://example.com/upload',
      expiresAt: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(completeArtifactUpload).mockResolvedValue({
      artifact: {
        artifactId: 'art-1',
        tenantId: 'tenant-1',
        containerId: 'ctr-1',
        artifactType: 'DRAWING',
        ownerAppId: 'drive',
        displayName: 'demo.dxf',
        mimeType: 'application/dxf',
        currentVersionId: 'ver-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    render(<DriveFilesPage />);

    await waitFor(() => {
      expect(listDriveContainers).toHaveBeenCalled();
    });

    const file = new File(['content'], 'demo.dxf', { type: 'application/dxf' });
    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    await userEvent.upload(fileInput, file);
    await userEvent.click(screen.getByTestId('upload-submit'));

    await waitFor(() => {
      expect(initArtifactUpload).toHaveBeenCalled();
      expect(completeArtifactUpload).toHaveBeenCalledWith(
        'token-001',
        'art-1',
        expect.objectContaining({
          versionId: 'ver-1',
          sizeBytes: file.size,
        }),
      );
    });
  });

  it('requests signed download url for selected artifact', async () => {
    vi.mocked(queryDriveArtifacts).mockResolvedValue({
      items: [
        {
          artifactId: 'art-1',
          tenantId: 'tenant-1',
          containerId: 'ctr-1',
          artifactType: 'DRAWING',
          ownerAppId: 'drive',
          displayName: 'demo.dxf',
          mimeType: 'application/dxf',
          currentVersionId: 'ver-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
    });
    vi.mocked(getArtifactDownloadUrl).mockResolvedValue({
      artifactId: 'art-1',
      versionId: 'ver-1',
      downloadUrl: 'https://example.com/download/art-1',
      expiresAt: '2026-01-01T00:00:00.000Z',
    });

    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    render(<DriveFilesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('artifact-row-art-1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('artifact-row-art-1'));
    await userEvent.click(screen.getByTestId('artifact-download-submit'));

    await waitFor(() => {
      expect(getArtifactDownloadUrl).toHaveBeenCalledWith(
        'token-001',
        'art-1',
        expect.objectContaining({ versionId: 'ver-1' }),
      );
      expect(openSpy).toHaveBeenCalledWith('https://example.com/download/art-1', '_blank', 'noopener,noreferrer');
    });
  });

  it('does not loop container refresh when session object identity changes', async () => {
    vi.mocked(useDriveSession).mockImplementation(() => ({ ...baseSession }));
    vi.mocked(listDriveContainers).mockRejectedValue(new RequestError(403, 'forbidden'));

    render(<DriveFilesPage />);

    await waitFor(() => {
      expect(listDriveContainers).toHaveBeenCalled();
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(vi.mocked(listDriveContainers).mock.calls.length).toBeLessThanOrEqual(2);
  });
});
