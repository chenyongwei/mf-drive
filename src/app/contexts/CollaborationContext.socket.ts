import type { Dispatch, SetStateAction } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  CursorPosition,
  EditOperation,
  PartMoveData,
  RemoteUser,
} from './CollaborationContext.types';
import {
  COLLABORATION_DISABLED,
  COLLABORATION_SOCKET_URL,
  isValidCursorPosition,
  isValidEditOperation,
  isValidEntityIds,
  isValidPartMoveData,
  isValidUserId,
} from './CollaborationContext.validation';

interface CollaborationSocketBindings {
  setIsConnected: (connected: boolean) => void;
  setMyUserId: (userId: string) => void;
  setMyUsername: (username: string | null) => void;
  setMyColor: (color: string | null) => void;
  setCurrentRoom: (room: string | null) => void;
  setRemoteUsers: Dispatch<SetStateAction<Map<string, RemoteUser>>>;
  setRemoteCursors: Dispatch<SetStateAction<Map<string, CursorPosition>>>;
  setRemoteSelections: Dispatch<SetStateAction<Map<string, string[]>>>;
  setRemotePartMoves: Dispatch<SetStateAction<Map<string, PartMoveData>>>;
  getOnRemoteEdit: () => ((data: { userId: string; operation: EditOperation }) => void) | null;
}

const removeUserKey = <T>(setMap: Dispatch<SetStateAction<Map<string, T>>>, userId: string) => {
  setMap(prev => {
    const next = new Map(prev);
    next.delete(userId);
    return next;
  });
};

const formatHexColor = (raw: string | null): string | undefined => {
  if (!raw) return undefined;
  return raw.startsWith('#') ? raw : `#${raw}`;
};

export const initializeCollaborationSocket = (
  bindings: CollaborationSocketBindings,
): Socket | null => {
  if (COLLABORATION_DISABLED) {
    bindings.setIsConnected(false);
    bindings.setMyUserId('mock-collab-disabled');
    bindings.setRemoteUsers(new Map());
    bindings.setRemoteCursors(new Map());
    bindings.setRemoteSelections(new Map());
    bindings.setRemotePartMoves(new Map());
    return null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const mockUserId = urlParams.get('mockUserId');
  const mockUsername = urlParams.get('mockUsername');
  const mockColor = urlParams.get('mockColor');

  if (mockUsername) {
    bindings.setMyUsername(mockUsername);
  }
  if (mockColor) {
    bindings.setMyColor(formatHexColor(mockColor) ?? null);
  }

  const socketInstance = io(COLLABORATION_SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    query: {
      userId: mockUserId || undefined,
      username: mockUsername || undefined,
      color: formatHexColor(mockColor),
    },
  });

  socketInstance.on('connect', () => {
    bindings.setIsConnected(true);
    if (socketInstance.id) {
      bindings.setMyUserId(socketInstance.id);
    }
  });

  socketInstance.on('disconnect', () => {
    bindings.setIsConnected(false);
  });

  socketInstance.on('user-joined', (data: RemoteUser) => {
    bindings.setRemoteUsers(prev => new Map(prev).set(data.userId, data));
  });

  socketInstance.on('user-left', (data: { userId: string; username: string }) => {
    removeUserKey(bindings.setRemoteUsers, data.userId);
    removeUserKey(bindings.setRemoteCursors, data.userId);
    removeUserKey(bindings.setRemoteSelections, data.userId);
    removeUserKey(bindings.setRemotePartMoves, data.userId);
  });

  socketInstance.on('room-users', (users: RemoteUser[]) => {
    const usersMap = new Map<string, RemoteUser>();
    users.forEach(user => usersMap.set(user.userId, user));
    bindings.setRemoteUsers(usersMap);

    bindings.setRemoteCursors(prev => {
      const next = new Map(prev);
      for (const userId of Array.from(next.keys())) {
        if (!usersMap.has(userId)) {
          next.delete(userId);
        }
      }
      return next;
    });
  });

  socketInstance.on('remote-cursor', (data: {
    userId: string;
    username: string;
    color: string;
    position: CursorPosition;
    timestamp: number;
  }) => {
    if (!isValidUserId(data.userId) || !isValidCursorPosition(data.position)) {
      console.warn('[Collaboration] Invalid remote-cursor data received');
      return;
    }

    bindings.setRemoteCursors(prev => new Map(prev).set(data.userId, data.position));

    setTimeout(() => {
      bindings.setRemoteCursors(prev => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing && existing.x === data.position.x && existing.y === data.position.y) {
          next.delete(data.userId);
        }
        return next;
      });
    }, 3000);
  });

  socketInstance.on('remote-selection', (data: {
    userId: string;
    username: string;
    color: string;
    entityIds: string[];
  }) => {
    if (!isValidUserId(data.userId) || !isValidEntityIds(data.entityIds)) {
      console.warn('[Collaboration] Invalid remote-selection data received');
      return;
    }

    bindings.setRemoteSelections(prev => new Map(prev).set(data.userId, data.entityIds));
  });

  socketInstance.on('remote-edit', (data: {
    userId: string;
    username: string;
    operation: EditOperation;
    timestamp: number;
  }) => {
    if (!isValidUserId(data.userId) || !isValidEditOperation(data.operation)) {
      console.warn('[Collaboration] Invalid remote-edit data received');
      return;
    }

    const now = Date.now();
    const timestamp = data.timestamp || 0;
    if (timestamp < now - 3600000 || timestamp > now + 60000) {
      console.warn('[Collaboration] Invalid timestamp in remote-edit data');
      return;
    }

    const onRemoteEdit = bindings.getOnRemoteEdit();
    if (onRemoteEdit) {
      onRemoteEdit({ userId: data.userId, operation: data.operation });
    }
  });

  socketInstance.on('remote-part-move', (data: {
    userId: string;
    username: string;
    partMove: PartMoveData;
  }) => {
    if (!isValidUserId(data.userId) || !isValidPartMoveData(data.partMove)) {
      console.warn('[Collaboration] Invalid remote-part-move data received');
      return;
    }

    bindings.setRemotePartMoves(prev => new Map(prev).set(data.userId, data.partMove));
  });

  const mockRoom = urlParams.get('mockRoom');
  if (mockRoom) {
    socketInstance.on('connect', () => {
      console.log('[Collaboration] Auto-joining mockRoom:', mockRoom);
      socketInstance.emit('join-room', mockRoom);
      bindings.setCurrentRoom(mockRoom);
    });
  }

  return socketInstance;
};
