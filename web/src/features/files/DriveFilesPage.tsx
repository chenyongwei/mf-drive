import { useCallback, useEffect, useMemo, useState } from 'react';
import { TooltipProvider } from '../../components/ui/tooltip';
import { Separator } from '../../components/ui/separator';
import { ContainerTree } from '../../components/ContainerTree';
import { FileListView } from '../../components/FileListView';
import { DriveHeader } from '../../components/DriveHeader';
import { UploadDialog } from '../../components/UploadDialog';
import { isRequestError, toUserFacingOAuthError } from '../auth/oauth';
import { useDriveSession } from '../auth/useDriveSession';
import {
  completeArtifactUpload,
  createDriveContainer,
  getArtifactDownloadUrl,
  initArtifactUpload,
  listDriveContainers,
  queryDriveArtifacts,
  toDriveApiError,
  type ArtifactType,
  type ContainerMode,
  type DriveArtifact,
  type DriveContainer,
} from './api';

type ArtifactFilterType = 'ALL' | ArtifactType;

function formatDate(value?: string): string {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export function DriveFilesPage() {
  const session = useDriveSession();

  const [containers, setContainers] = useState<DriveContainer[]>([]);
  const [artifacts, setArtifacts] = useState<DriveArtifact[]>([]);
  const [selectedContainerId, setSelectedContainerId] = useState('');
  const [selectedArtifactId, setSelectedArtifactId] = useState('');

  const [keyword, setKeyword] = useState('');
  const [artifactTypeFilter, setArtifactTypeFilter] = useState<ArtifactFilterType>('ALL');

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);

  const token = session.accessToken;
  const ready = session.status === 'ready' && token && session.tokenActive;

  const securityCenterUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('tab', 'resource-grants');
    params.set('tenantId', 'tenant-001');
    params.set('sourceAppId', 'drive');
    params.set('consumerAppId', 'drive');
    params.set('resourcePackId', 'drive.storage.containers.read');
    params.set('action', 'read');
    params.set('dataDomain', 'FILE');
    params.set('objectType', 'Container');
    if (typeof window !== 'undefined') {
      params.set('returnTo', `${window.location.pathname}${window.location.search}`);
    }
    return `/foundation/security?${params.toString()}`;
  }, []);

  const showSecurityEntry = useMemo(
    () =>
      session.status === 'needs_account' ||
      session.status === 'needs_authorization' ||
      session.status === 'error' ||
      Boolean(session.error) ||
      Boolean(error),
    [error, session.error, session.status],
  );

  const setFeedback = useCallback((next: { error?: string | null; status?: string | null }) => {
    if (next.error !== undefined) setError(next.error);
    if (next.status !== undefined) setStatus(next.status);
  }, []);

  const handleRequestError = useCallback(
    (requestError: unknown) => {
      if (isRequestError(requestError) && requestError.status === 401) {
        session.clearToken();
        setFeedback({ error: 'Token 已失效，请重新执行 OAuth 授权。', status: null });
        return;
      }
      if (isRequestError(requestError) && requestError.status === 0) {
        setFeedback({ error: toUserFacingOAuthError(requestError), status: null });
        return;
      }
      setFeedback({ error: toDriveApiError(requestError), status: null });
    },
    [session, setFeedback],
  );

  const loadContainers = useCallback(
    async (accessToken: string): Promise<string> => {
      const payload = await listDriveContainers(accessToken);
      const nextContainers = payload.items;
      setContainers(nextContainers);
      const fallbackContainerId = nextContainers[0]?.containerId ?? '';
      const activeExists = nextContainers.some((item) => item.containerId === selectedContainerId);
      const nextActive = activeExists ? selectedContainerId : fallbackContainerId;
      setSelectedContainerId(nextActive);
      return nextActive;
    },
    [selectedContainerId],
  );

  const loadArtifacts = useCallback(
    async (accessToken: string, containerId: string): Promise<void> => {
      const response = await queryDriveArtifacts(accessToken, {
        keyword: keyword.trim() || undefined,
        containerId: containerId || undefined,
        artifactType: artifactTypeFilter === 'ALL' ? undefined : artifactTypeFilter,
        page: 1,
        pageSize: 50,
      });
      setArtifacts(response.items);
      const hasSelected = response.items.some((item) => item.artifactId === selectedArtifactId);
      setSelectedArtifactId(hasSelected ? selectedArtifactId : response.items[0]?.artifactId ?? '');
    },
    [artifactTypeFilter, keyword, selectedArtifactId],
  );

  const refreshAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setFeedback({ error: null });
    try {
      const activeContainerId = await loadContainers(token);
      await loadArtifacts(token, activeContainerId);
      setFeedback({ status: 'Drive 数据已刷新。' });
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setLoading(false);
    }
  }, [handleRequestError, loadArtifacts, loadContainers, setFeedback, token]);

  useEffect(() => {
    if (!ready || !token) {
      setContainers([]);
      setArtifacts([]);
      setSelectedContainerId('');
      setSelectedArtifactId('');
      return;
    }
    void refreshAll();
  }, [ready, refreshAll, token]);

  async function handleSearch(): Promise<void> {
    if (!ready || !token) return;
    setLoading(true);
    setFeedback({ error: null });
    try {
      await loadArtifacts(token, selectedContainerId);
      setFeedback({ status: '检索完成。' });
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectContainer(containerId: string): Promise<void> {
    setSelectedContainerId(containerId);
    if (!token) return;
    setLoading(true);
    setFeedback({ error: null });
    try {
      await loadArtifacts(token, containerId);
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateContainer(name: string, mode: ContainerMode): Promise<void> {
    if (!ready || !token) return;
    setBusy('creating-container');
    setFeedback({ error: null, status: null });
    try {
      const response = await createDriveContainer(token, { name, mode });
      setSelectedContainerId(response.container.containerId);
      await refreshAll();
      setFeedback({ status: `容器已创建：${response.container.name}` });
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setBusy('');
    }
  }

  async function handleUpload(file: File, artifactType: ArtifactType, projectId?: string): Promise<void> {
    if (!ready || !token || !selectedContainerId) return;
    setBusy('uploading-artifact');
    setFeedback({ error: null, status: null });
    try {
      const initResponse = await initArtifactUpload(token, {
        containerId: selectedContainerId,
        artifactType,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        projectId,
      });
      await completeArtifactUpload(token, initResponse.artifactId, {
        versionId: initResponse.versionId,
        etag: `web-${Date.now()}`,
        sizeBytes: file.size,
      });
      await loadArtifacts(token, selectedContainerId);
      setFeedback({ status: `上传完成：${file.name}` });
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setBusy('');
    }
  }

  async function handleDownload(artifact: DriveArtifact): Promise<void> {
    if (!ready || !token) return;
    setBusy('downloading-artifact');
    setFeedback({ error: null, status: null });
    try {
      const response = await getArtifactDownloadUrl(token, artifact.artifactId, {
        versionId: artifact.currentVersionId,
      });
      const opened = window.open(response.downloadUrl, '_blank', 'noopener,noreferrer');
      if (!opened && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(response.downloadUrl);
        setFeedback({ status: '下载链接已复制到剪贴板。' });
        return;
      }
      setFeedback({ status: '已打开下载链接。' });
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setBusy('');
    }
  }

  const expiresAtFormatted = session.expiresAtEpoch
    ? formatDate(new Date(session.expiresAtEpoch * 1000).toISOString())
    : null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col bg-white dark:bg-slate-950">
        {/* Header */}
        <DriveHeader
          accountAuthorized={session.accountAuthorized}
          tokenActive={session.tokenActive}
          scopes={session.scopes}
          expiresAt={expiresAtFormatted}
          onAuthorize={() => void session.authorize()}
          onRefresh={() => void refreshAll()}
          onClearToken={session.clearToken}
          authorizing={session.status === 'authorizing'}
          loading={loading}
          error={error}
          status={status}
          sessionError={session.error}
          securityCenterUrl={securityCenterUrl}
          showSecurityEntry={showSecurityEntry}
        />

        <Separator />

        {/* Main two-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Container tree */}
          <div className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-700">
            <ContainerTree
              containers={containers}
              selectedContainerId={selectedContainerId}
              onSelectContainer={(id) => void handleSelectContainer(id)}
              onCreateContainer={handleCreateContainer}
              disabled={!ready}
              creating={busy === 'creating-container'}
            />
          </div>

          {/* Right: File list */}
          <div className="flex-1 overflow-hidden">
            <FileListView
              artifacts={artifacts}
              selectedArtifactId={selectedArtifactId}
              onSelectArtifact={setSelectedArtifactId}
              keyword={keyword}
              onKeywordChange={setKeyword}
              artifactTypeFilter={artifactTypeFilter}
              onTypeFilterChange={setArtifactTypeFilter}
              onSearch={() => void handleSearch()}
              onRefresh={() => void refreshAll()}
              onDownload={(artifact) => void handleDownload(artifact)}
              onUploadOpen={() => setUploadOpen(true)}
              loading={loading}
              disabled={!ready}
            />
          </div>
        </div>

        {/* Upload dialog */}
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUpload={handleUpload}
          disabled={!ready || !selectedContainerId}
          uploading={busy === 'uploading-artifact'}
        />
      </div>
    </TooltipProvider>
  );
}
