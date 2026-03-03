import type { AxiosError } from 'axios';
import { apiClient } from './api';
import { resolveUserContextHeaders } from './userContext';

export interface FontInfo {
  id: string;
  family: string;
  script: string;
  license: string;
  source: 'system' | 'user' | 'builtin';
  ownerUserId?: string;
  fileName: string;
  mimeType: string;
  format: 'ttf' | 'otf' | 'woff2' | 'builtin';
  supportsSingleLine: boolean;
  supportsDoubleLine: boolean;
  createdAt: string;
}

export interface FontListResponse {
  success: boolean;
  fonts: FontInfo[];
}

export interface FontUploadResponse {
  success: boolean;
  font: FontInfo;
}

export interface FontApiErrorPayload {
  success?: boolean;
  errorCode?: string;
  message?: string;
}

export class FontApiError extends Error {
  status: number;
  errorCode: string;

  constructor(message: string, status: number, errorCode: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

const FONT_LIST_ENDPOINTS = ['/fonts', '/drawing/fonts'];
const FONT_UPLOAD_ENDPOINTS = ['/fonts/upload', '/drawing/fonts/upload'];
const FALLBACK_FONT_ID = 'builtin-cad-sans';
const FALLBACK_FONTS: FontInfo[] = [
  {
    id: FALLBACK_FONT_ID,
    family: 'CAD Sans (Builtin)',
    script: 'universal',
    license: 'CC0-1.0',
    source: 'builtin',
    fileName: FALLBACK_FONT_ID,
    mimeType: 'application/x-builtin-font',
    format: 'builtin',
    supportsSingleLine: true,
    supportsDoubleLine: true,
    createdAt: '2026-02-21T00:00:00.000Z',
  },
];

function buildUserHeaders(): Record<string, string> {
  return resolveUserContextHeaders().headers;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function normalizeFontApiError(error: unknown): never {
  const axiosError = error as AxiosError<FontApiErrorPayload>;
  const status = Number(axiosError.response?.status ?? 500);
  const errorCode = String(axiosError.response?.data?.errorCode ?? 'FONT_STORAGE_FAILED');
  const message =
    String(axiosError.response?.data?.message ?? '').trim() ||
    axiosError.message ||
    'font request failed';
  throw new FontApiError(message, status, errorCode);
}

function isNotFoundError(error: unknown): boolean {
  const axiosError = error as AxiosError<FontApiErrorPayload>;
  return Number(axiosError.response?.status ?? 0) === 404;
}

export async function listFonts(): Promise<FontInfo[]> {
  const headers = buildUserHeaders();

  for (const endpoint of FONT_LIST_ENDPOINTS) {
    try {
      const response = await apiClient.get<FontListResponse>(endpoint, {
        headers,
      });
      const fonts = Array.isArray(response.data.fonts) ? response.data.fonts : [];
      return fonts.length > 0 ? fonts : FALLBACK_FONTS;
    } catch (error) {
      if (isNotFoundError(error)) {
        continue;
      }
      normalizeFontApiError(error);
    }
  }

  return FALLBACK_FONTS;
}

export async function uploadFont(file: File): Promise<FontInfo> {
  const payload = {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    base64: arrayBufferToBase64(await file.arrayBuffer()),
  };
  const headers = {
    ...buildUserHeaders(),
    'Content-Type': 'application/json',
  };

  for (const endpoint of FONT_UPLOAD_ENDPOINTS) {
    try {
      const response = await apiClient.post<FontUploadResponse>(endpoint, payload, {
        headers,
      });

      if (response.data?.font) {
        return response.data.font;
      }
      throw new FontApiError('font upload response is invalid', 500, 'FONT_STORAGE_FAILED');
    } catch (error) {
      if (isNotFoundError(error)) {
        continue;
      }
      normalizeFontApiError(error);
    }
  }

  throw new FontApiError('font api endpoint not found', 404, 'FONT_API_NOT_AVAILABLE');
}

export async function deleteFont(fontId: string): Promise<void> {
  const encodedFontId = encodeURIComponent(fontId);
  const endpoints = [`/fonts/${encodedFontId}`, `/drawing/fonts/${encodedFontId}`];
  const headers = buildUserHeaders();

  for (const endpoint of endpoints) {
    try {
      await apiClient.delete(endpoint, {
        headers,
      });
      return;
    } catch (error) {
      if (isNotFoundError(error)) {
        continue;
      }
      normalizeFontApiError(error);
    }
  }

  throw new FontApiError('font api endpoint not found', 404, 'FONT_API_NOT_AVAILABLE');
}
