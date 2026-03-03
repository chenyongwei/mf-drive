import { API_BASE } from './types';

export function getApiUrl(): string {
  if (typeof window === 'undefined') return API_BASE;

  const params = new URLSearchParams(window.location.search);
  const testParams: string[] = [];

  if (params.get('test') === 'true') {
    testParams.push('test=true');
  }
  const email = params.get('email');
  if (email) {
    testParams.push(`email=${encodeURIComponent(email)}`);
  }

  return testParams.length > 0 ? `${API_BASE}?${testParams.join('&')}` : API_BASE;
}
