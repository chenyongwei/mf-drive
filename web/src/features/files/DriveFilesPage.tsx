import { useCallback, useEffect, useMemo, useState } from 'react';
import { MfAppShell } from '@platform/ui-shared/mf-shell';
import { MfButton, MfPageShell, MfSectionCard, MfStatusBanner } from '@platform/ui-shared/components';
import { AppAppearanceControls } from '@platform/ui-shared/appearance-controls';
import { RequestError, isRequestError, toUserFacingOAuthError } from '../auth/oauth';
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

const ARTIFACT_TYPES: ArtifactType[] = ['DRAWING', 'PARTS', 'LAYOUT'];
const CONTAINER_MODES: ContainerMode[] = ['APP_DATA', 'MY_DRIVE'];

type ArtifactFilterType = 'ALL' | ArtifactType;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[idx]}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return '--';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function DriveFilesPage() {
  const session = useDriveSession();

  const [containers, setContainers] = useState<DriveContainer[]>([]);
  const [artifacts, setArtifacts] = useState<DriveArtifact[]>([]);
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>('');

  const [keyword, setKeyword] = useState<string>('');
  const [artifactTypeFilter, setArtifactTypeFilter] = useState<ArtifactFilterType>('ALL');

  const [newContainerName, setNewContainerName] = useState<string>('');
  const [newContainerMode, setNewContainerMode] = useState<ContainerMode>('APP_DATA');

  const [uploadType, setUploadType] = useState<ArtifactType>('DRAWING');
  const [uploadProjectId, setUploadProjectId] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const token = session.accessToken;
  const ready = session.status === 'ready' && token && session.tokenActive;

  const selectedArtifact = useMemo(
    () => artifacts.find((artifact) => artifact.artifactId === selectedArtifactId) ?? null,
    [artifacts, selectedArtifactId],
  );

  const setFeedback = useCallback((next: { error?: string | null; status?: string | null }) => {
    if (next.error !== undefined) {
      setError(next.error);
    }
    if (next.status !== undefined) {
      setStatus(next.status);
    }
  }, []);

  const handleRequestError = useCallback((requestError: unknown) => {
    if (isRequestError(requestError) && requestError.status === 401) {
      session.clearToken();
      setFeedback({
        error: 'Token 已失效，请重新执行 OAuth 授权。',
        status: null,
      });
      return;
    }

    if (isRequestError(requestError) && requestError.status === 0) {
      setFeedback({ error: toUserFacingOAuthError(requestError), status: null });
      return;
    }

    setFeedback({ error: toDriveApiError(requestError), status: null });
  }, [session, setFeedback]);

  const loadContainers = useCallback(async (accessToken: string): Promise<string> => {
    const payload = await listDriveContainers(accessToken);
    const nextContainers = payload.items;
    setContainers(nextContainers);

    const fallbackContainerId = nextContainers[0]?.containerId ?? '';
    const activeExists = nextContainers.some((item) => item.containerId === selectedContainerId);
    const nextActive = activeExists ? selectedContainerId : fallbackContainerId;

    setSelectedContainerId(nextActive);
    return nextActive;
  }, [selectedContainerId]);

  const loadArtifacts = useCallback(async (accessToken: string, containerId: string): Promise<void> => {
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
  }, [artifactTypeFilter, keyword, selectedArtifactId]);

  const refreshAll = useCallback(async () => {
    if (!token) {
      return;
    }

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
    if (!ready || !token) {
      return;
    }
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

  async function handleCreateContainer(): Promise<void> {
    if (!ready || !token) {
      return;
    }

    const name = newContainerName.trim();
    if (!name) {
      setFeedback({ error: '容器名称不能为空。', status: null });
      return;
    }

    setBusy('creating-container');
    setFeedback({ error: null, status: null });
    try {
      const response = await createDriveContainer(token, {
        name,
        mode: newContainerMode,
      });
      setNewContainerName('');
      setSelectedContainerId(response.container.containerId);
      await refreshAll();
      setFeedback({ status: `容器已创建：${response.container.name}` });
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setBusy('');
    }
  }

  async function handleUpload(): Promise<void> {
    if (!ready || !token) {
      return;
    }
    if (!selectedContainerId) {
      setFeedback({ error: '请先选择容器。', status: null });
      return;
    }
    if (!uploadFile) {
      setFeedback({ error: '请先选择要上传的文件。', status: null });
      return;
    }

    setBusy('uploading-artifact');
    setFeedback({ error: null, status: null });

    try {
      const initResponse = await initArtifactUpload(token, {
        containerId: selectedContainerId,
        artifactType: uploadType,
        fileName: uploadFile.name,
        mimeType: uploadFile.type || 'application/octet-stream',
        sizeBytes: uploadFile.size,
        projectId: uploadProjectId.trim() || undefined,
      });

      await completeArtifactUpload(token, initResponse.artifactId, {
        versionId: initResponse.versionId,
        etag: `web-${Date.now()}`,
        sizeBytes: uploadFile.size,
      });

      await loadArtifacts(token, selectedContainerId);
      setFeedback({ status: `上传元数据已完成：${uploadFile.name}` });
      setUploadFile(null);
      const fileInput = document.getElementById('drive-upload-file-input') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setBusy('');
    }
  }

  async function handleDownload(): Promise<void> {
    if (!ready || !token) {
      return;
    }
    if (!selectedArtifact) {
      setFeedback({ error: '请先选择一个文件。', status: null });
      return;
    }

    setBusy('downloading-artifact');
    setFeedback({ error: null, status: null });

    try {
      const response = await getArtifactDownloadUrl(token, selectedArtifact.artifactId, {
        versionId: selectedArtifact.currentVersionId,
      });
      const opened = window.open(response.downloadUrl, '_blank', 'noopener,noreferrer');
      if (!opened && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
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

  return (
    <MfAppShell currentAppId="drive">
      <MfPageShell
        className="drive-page-shell"
        title="图纸云存储"
        subtitle="容器化管理图纸、零件与排版文件，并通过 OAuth 会话安全访问。"
        actions={(
          <div className="drive-header-actions">
            <MfButton
              type="button"
              tone="secondary"
              onClick={() => void session.authorize()}
              disabled={session.status === 'authorizing'}
              data-testid="oauth-authorize"
            >
              {session.status === 'authorizing' ? '授权中...' : '执行 OAuth 授权'}
            </MfButton>
            <MfButton
              type="button"
              tone="secondary"
              onClick={() => void refreshAll()}
              disabled={loading || session.status === 'authorizing'}
              data-testid="drive-refresh-all"
            >
              {loading ? '刷新中...' : '刷新数据'}
            </MfButton>
            <MfButton
              type="button"
              tone="secondary"
              onClick={session.clearToken}
              data-testid="drive-clear-token"
            >
              清除 Token
            </MfButton>
          </div>
        )}
      >
        <div className="drive-background-glow" />

      <section className="drive-status-grid">
        <article className="drive-status-card">
          <h2>账号会话</h2>
          <p>{session.accountAuthorized ? '已授权' : '未授权'}</p>
        </article>
        <article className="drive-status-card">
          <h2>Token 状态</h2>
          <p>{session.tokenActive ? '可用' : '不可用'}</p>
        </article>
        <article className="drive-status-card">
          <h2>过期时间</h2>
          <p>{session.expiresAtEpoch ? formatDate(new Date(session.expiresAtEpoch * 1000).toISOString()) : '--'}</p>
        </article>
      </section>

      <section className="drive-scopes-card">
        <h2>当前 Scope</h2>
        <div className="scope-chip-row">
          {session.scopes.length > 0 ? session.scopes.map((scope) => <code key={scope}>{scope}</code>) : <span>尚未获取有效 Token scope。</span>}
        </div>
      </section>

      {session.error ? <div className="drive-banner drive-banner-error">{session.error}</div> : null}
      {error ? <div className="drive-banner drive-banner-error">{error}</div> : null}
      {status ? <div className="drive-banner drive-banner-status">{status}</div> : null}

        <main className="drive-layout">
        <MfSectionCard className="drive-panel">
          <header className="drive-panel-header">
            <h3>容器</h3>
            <span>{containers.length} 个</span>
          </header>

          <div className="drive-list-container" data-testid="container-list">
            {containers.length === 0 ? (
              <p className="drive-empty">暂无容器，请先创建。</p>
            ) : (
              containers.map((container) => (
                <button
                  key={container.containerId}
                  type="button"
                  className={`drive-list-item ${selectedContainerId === container.containerId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedContainerId(container.containerId);
                    void loadArtifacts(token ?? '', container.containerId);
                  }}
                  disabled={!ready}
                >
                  <strong>{container.name}</strong>
                  <small>{container.mode}</small>
                  <small>{formatBytes(container.usedBytes)} / {formatBytes(container.quotaBytes)}</small>
                </button>
              ))
            )}
          </div>

          <div className="drive-form-block">
            <h4>创建容器</h4>
            <input
              value={newContainerName}
              onChange={(event) => setNewContainerName(event.target.value)}
              placeholder="输入容器名称"
              data-testid="container-create-name"
            />
            <select
              value={newContainerMode}
              onChange={(event) => setNewContainerMode(event.target.value as ContainerMode)}
              data-testid="container-create-mode"
            >
              {CONTAINER_MODES.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleCreateContainer()}
              disabled={!ready || busy === 'creating-container'}
              data-testid="container-create-submit"
            >
              {busy === 'creating-container' ? '创建中...' : '创建容器'}
            </button>
          </div>
        </section>

        <section className="drive-panel">
          <header className="drive-panel-header">
            <h3>文件检索</h3>
            <span>{artifacts.length} 条</span>
          </header>

          <div className="drive-toolbar">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="按文件名/ID 检索"
              data-testid="artifact-search-keyword"
            />
            <select
              value={artifactTypeFilter}
              onChange={(event) => setArtifactTypeFilter(event.target.value as ArtifactFilterType)}
              data-testid="artifact-search-type"
            >
              <option value="ALL">ALL</option>
              {ARTIFACT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleSearch()}
              disabled={!ready || loading}
              data-testid="artifact-search-submit"
            >
              检索
            </button>
          </div>

          <div className="drive-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>类型</th>
                  <th>容器</th>
                  <th>更新</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="drive-empty">暂无文件。</td>
                  </tr>
                ) : (
                  artifacts.map((artifact) => (
                    <tr
                      key={artifact.artifactId}
                      className={selectedArtifactId === artifact.artifactId ? 'selected' : ''}
                      onClick={() => setSelectedArtifactId(artifact.artifactId)}
                      data-testid={`artifact-row-${artifact.artifactId}`}
                    >
                      <td>
                        <strong>{artifact.displayName}</strong>
                        <small>{artifact.artifactId}</small>
                      </td>
                      <td>{artifact.artifactType}</td>
                      <td>{artifact.containerId}</td>
                      <td>{formatDate(artifact.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="drive-panel">
          <header className="drive-panel-header">
            <h3>上传与下载</h3>
          </header>

          <div className="drive-form-block">
            <h4>上传（元数据闭环）</h4>
            <input
              id="drive-upload-file-input"
              type="file"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              data-testid="upload-file-input"
            />
            <select
              value={uploadType}
              onChange={(event) => setUploadType(event.target.value as ArtifactType)}
              data-testid="upload-type-select"
            >
              {ARTIFACT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              value={uploadProjectId}
              onChange={(event) => setUploadProjectId(event.target.value)}
              placeholder="可选 projectId"
              data-testid="upload-project-id"
            />
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={!ready || busy === 'uploading-artifact'}
              data-testid="upload-submit"
            >
              {busy === 'uploading-artifact' ? '上传处理中...' : '执行上传闭环'}
            </button>
          </div>

          <div className="drive-form-block">
            <h4>下载</h4>
            <p className="drive-detail-line">
              当前文件：{selectedArtifact ? selectedArtifact.displayName : '--'}
            </p>
            <p className="drive-detail-line">版本：{selectedArtifact?.currentVersionId ?? '--'}</p>
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={!ready || !selectedArtifact || busy === 'downloading-artifact'}
              data-testid="artifact-download-submit"
            >
              {busy === 'downloading-artifact' ? '生成中...' : '获取下载链接'}
            </button>
          </div>
        </MfSectionCard>
        </main>
      </MfPageShell>
      <AppAppearanceControls appId="drive" />
    </MfAppShell>
  );
}
