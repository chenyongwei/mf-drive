import { CursorPosition, EditOperation, PartMoveData } from './CollaborationContext.types';

const VALID_EDIT_TYPES = new Set(['trim', 'extend', 'delete', 'move', 'rotate']);
const DEV_CLIENT_PORTS = new Set(['3000', '5173', '4173']);

export function isValidUserId(userId: unknown): userId is string {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 100;
}

export function isValidEditOperation(operation: unknown): operation is EditOperation {
  if (!operation || typeof operation !== 'object') return false;
  const op = operation as EditOperation;

  if (typeof op.type !== 'string' || !VALID_EDIT_TYPES.has(op.type)) {
    return false;
  }

  if (!op.data || typeof op.data !== 'object') {
    return false;
  }

  if (op.type === 'delete' || op.type === 'move' || op.type === 'rotate') {
    return !!(op.entityId || op.entityIds);
  }

  return true;
}

export function isValidPartMoveData(partMove: unknown): partMove is PartMoveData {
  if (!partMove || typeof partMove !== 'object') return false;
  const pm = partMove as PartMoveData;

  return (
    typeof pm.partId === 'string' &&
    pm.partId.length > 0 &&
    typeof pm.position === 'object' &&
    typeof pm.position.x === 'number' &&
    typeof pm.position.y === 'number' &&
    isFinite(pm.position.x) &&
    isFinite(pm.position.y) &&
    typeof pm.rotation === 'number' &&
    isFinite(pm.rotation)
  );
}

export function isValidCursorPosition(position: unknown): position is CursorPosition {
  if (!position || typeof position !== 'object') return false;
  const pos = position as CursorPosition;

  return (
    typeof pos.x === 'number' && isFinite(pos.x) &&
    typeof pos.y === 'number' && isFinite(pos.y)
  );
}

export function isValidEntityIds(entityIds: unknown): entityIds is string[] {
  if (!Array.isArray(entityIds)) return false;
  if (entityIds.length === 0) return true;
  return entityIds.every(id => typeof id === 'string' && id.length > 0);
}

const resolveSocketOrigin = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }

  const envUrl = import.meta?.env?.VITE_COLLABORATION_SOCKET_URL;
  if (envUrl) {
    return envUrl;
  }

  const { protocol, hostname, port } = window.location;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port && DEV_CLIENT_PORTS.has(port)) {
    return `${protocol}//${hostname}:8000`;
  }

  return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
};

export const COLLABORATION_SOCKET_URL = resolveSocketOrigin();
export const COLLABORATION_DISABLED = import.meta.env.VITE_COMPAT_API_MODE === 'msw';
