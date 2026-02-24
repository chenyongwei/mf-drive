import { RequestError, isRequestError, requestJson } from '../auth/oauth';

export type ContainerMode = 'APP_DATA' | 'MY_DRIVE';
export type ArtifactType = 'DRAWING' | 'PARTS' | 'LAYOUT';

export type DriveContainer = {
  containerId: string;
  tenantId: string;
  ownerAppId: string;
  mode: ContainerMode;
  name: string;
  quotaBytes: number;
  usedBytes: number;
  createdAt: string;
};

export type DriveArtifactVersion = {
  versionId: string;
  versionNo: number;
  sizeBytes: number;
  etag: string;
  sha256?: string;
  createdAt: string;
};

export type DriveArtifact = {
  artifactId: string;
  tenantId: string;
  containerId: string;
  artifactType: ArtifactType;
  ownerAppId: string;
  displayName: string;
  mimeType: string;
  currentVersionId: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  versions?: DriveArtifactVersion[];
};

export type DriveContainersResponse = {
  items: DriveContainer[];
  total: number;
};

export type DriveArtifactsResponse = {
  items: DriveArtifact[];
  total: number;
  page?: number;
  pageSize?: number;
};

export type DriveUploadInitResponse = {
  artifactId: string;
  versionId: string;
  uploadUrl: string;
  expiresAt: string;
};

export type DriveDownloadUrlResponse = {
  artifactId: string;
  versionId: string;
  downloadUrl: string;
  expiresAt: string;
};

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function listDriveContainers(token: string): Promise<DriveContainersResponse> {
  return requestJson<DriveContainersResponse>('/api/drive/containers', {
    headers: authHeaders(token),
  });
}

export async function createDriveContainer(
  token: string,
  payload: {
    name: string;
    mode: ContainerMode;
    quotaBytes?: number;
  },
): Promise<{ container: DriveContainer }> {
  return requestJson<{ container: DriveContainer }>('/api/drive/containers', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function queryDriveArtifacts(
  token: string,
  payload: {
    keyword?: string;
    artifactType?: ArtifactType;
    containerId?: string;
    projectId?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<DriveArtifactsResponse> {
  return requestJson<DriveArtifactsResponse>('/api/drive/artifacts/query', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function initArtifactUpload(
  token: string,
  payload: {
    containerId: string;
    artifactType: ArtifactType;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    projectId?: string;
  },
): Promise<DriveUploadInitResponse> {
  return requestJson<DriveUploadInitResponse>('/api/drive/artifacts/init-upload', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function completeArtifactUpload(
  token: string,
  artifactId: string,
  payload: {
    versionId: string;
    etag?: string;
    sha256?: string;
    sizeBytes?: number;
  },
): Promise<{ artifact: DriveArtifact }> {
  return requestJson<{ artifact: DriveArtifact }>(`/api/drive/artifacts/${encodeURIComponent(artifactId)}/complete-upload`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function getArtifactDownloadUrl(
  token: string,
  artifactId: string,
  payload?: {
    versionId?: string;
  },
): Promise<DriveDownloadUrlResponse> {
  return requestJson<DriveDownloadUrlResponse>(`/api/drive/artifacts/${encodeURIComponent(artifactId)}/download-url`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload ?? {}),
  });
}

export function toDriveApiError(error: unknown): string {
  if (isRequestError(error)) {
    if (error.status === 401) {
      return 'Token 已失效，请重新执行 OAuth 授权。';
    }
    if (error.status === 403) {
      return '当前授权 scope 不足，请在顶部重新执行 OAuth 授权。';
    }
    if (error.status === 409) {
      return '请求冲突（409），请刷新后重试。';
    }
    if (error.status >= 500) {
      return 'Drive 服务暂时不可用，请稍后重试。';
    }
    return error.message;
  }

  if (error instanceof RequestError) {
    return error.message;
  }

  return String(error);
}
