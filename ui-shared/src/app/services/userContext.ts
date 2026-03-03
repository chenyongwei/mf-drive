import { useAuthStore } from '../store/authStore';

export interface UserContextHeaders {
  userId?: string;
  username?: string;
  headers: Record<string, string>;
}

export function resolveUserContextHeaders(): UserContextHeaders {
  const authState = useAuthStore.getState();
  const userId = authState.user?.id;
  const userEmail = authState.user?.email;
  const headers: Record<string, string> = {};

  if (userId !== undefined && userId !== null) {
    headers['x-user-id'] = String(userId);
  }
  if (typeof userEmail === 'string' && userEmail.trim().length > 0) {
    headers['x-user-email'] = userEmail.trim();
  }

  return {
    userId: userId !== undefined && userId !== null ? String(userId) : undefined,
    username:
      typeof userEmail === 'string' && userEmail.trim().length > 0
        ? userEmail.trim()
        : undefined,
    headers,
  };
}
