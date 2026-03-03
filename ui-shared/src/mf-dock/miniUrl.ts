import type { AppId } from './types';

export function buildMiniUrl(route: string, sourceAppId: AppId): string {
  try {
    const url = new URL(route, window.location.origin);
    url.searchParams.set('mfDockMini', '1');
    url.searchParams.set('sourceAppId', sourceAppId);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const separator = route.includes('?') ? '&' : '?';
    return `${route}${separator}mfDockMini=1&sourceAppId=${encodeURIComponent(sourceAppId)}`;
  }
}
