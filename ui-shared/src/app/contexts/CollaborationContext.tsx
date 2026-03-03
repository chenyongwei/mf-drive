/**
 * Collaboration Context
 *
 * Manages real-time collaboration state using Socket.IO client.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import {
  CollaborationProviderProps,
  CollaborationState,
  CursorPosition,
  EditOperation,
  PartMoveData,
  RemoteUser,
} from './CollaborationContext.types';
import { initializeCollaborationSocket } from './CollaborationContext.socket';

export type {
  CollaborationState,
  CursorPosition,
  EditOperation,
  PartMoveData,
  RemoteUser,
} from './CollaborationContext.types';

const CollaborationContext = createContext<CollaborationState | undefined>(undefined);

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myUserId, setMyUserId] = useState<string>('');
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Map<string, RemoteUser>>(new Map());
  const [remoteCursors, setRemoteCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [remoteSelections, setRemoteSelections] = useState<Map<string, string[]>>(new Map());
  const [remotePartMoves, setRemotePartMoves] = useState<Map<string, PartMoveData>>(new Map());
  const [onRemoteEdit, setOnRemoteEdit] = useState<((data: { userId: string; operation: EditOperation }) => void) | null>(null);
  const onRemoteEditRef = React.useRef<typeof onRemoteEdit>(null);

  useEffect(() => {
    onRemoteEditRef.current = onRemoteEdit;
  }, [onRemoteEdit]);

  useEffect(() => {
    const socketInstance = initializeCollaborationSocket({
      setIsConnected,
      setMyUserId,
      setMyUsername,
      setMyColor,
      setCurrentRoom,
      setRemoteUsers,
      setRemoteCursors,
      setRemoteSelections,
      setRemotePartMoves,
      getOnRemoteEdit: () => onRemoteEditRef.current,
    });

    if (!socketInstance) {
      return () => {};
    }

    setSocket(socketInstance);

    return () => {
      try {
        if (socketInstance.connected) {
          socketInstance.disconnect();
        }
      } catch {
        // Ignore disconnect errors when socket has already closed.
      }
    };
  }, []);

  const joinRoom = useCallback((fileId: string) => {
    if (!socket || !isConnected) {
      return;
    }

    socket.emit('join-room', fileId);
    setCurrentRoom(fileId);
    setRemoteUsers(new Map());
    setRemoteCursors(new Map());
  }, [socket, isConnected]);

  const leaveRoom = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('leave-room');
    setCurrentRoom(null);
    setRemoteUsers(new Map());
    setRemoteCursors(new Map());
  }, [socket, isConnected]);

  const broadcastCursor = useCallback((position: CursorPosition) => {
    if (!socket || !isConnected || !currentRoom) return;

    socket.emit('cursor-move', {
      fileId: currentRoom,
      position,
    });
  }, [socket, isConnected, currentRoom]);

  const broadcastSelection = useCallback((entityIds: string[]) => {
    if (!socket || !isConnected || !currentRoom) return;

    socket.emit('entity-select', {
      fileId: currentRoom,
      entityIds,
    });
  }, [socket, isConnected, currentRoom]);

  const broadcastEdit = useCallback((operation: EditOperation) => {
    if (!socket || !isConnected || !currentRoom) return;

    socket.emit('edit-operation', {
      fileId: currentRoom,
      operation,
    });
  }, [socket, isConnected, currentRoom]);

  const broadcastPartMove = useCallback((partMove: PartMoveData) => {
    if (!socket || !isConnected || !currentRoom) return;

    socket.emit('part-move', {
      fileId: currentRoom,
      partMove,
    });
  }, [socket, isConnected, currentRoom]);

  const disconnect = useCallback(() => {
    if (!socket) {
      return;
    }

    socket.disconnect();
    setSocket(null);
    setIsConnected(false);
    setMyUserId('');
    setCurrentRoom(null);
    setRemoteUsers(new Map());
    setRemoteCursors(new Map());
    setRemoteSelections(new Map());
    setRemotePartMoves(new Map());
  }, [socket]);

  const value = useMemo((): CollaborationState => ({
    isConnected,
    myUserId,
    myUsername,
    myColor,
    currentRoom,
    remoteUsers,
    remoteCursors,
    remoteSelections,
    remotePartMoves,
    onRemoteEdit,
    setOnRemoteEdit,
    joinRoom,
    leaveRoom,
    broadcastCursor,
    broadcastSelection,
    broadcastEdit,
    broadcastPartMove,
    disconnect,
  }), [
    isConnected,
    myUserId,
    myUsername,
    myColor,
    currentRoom,
    remoteUsers,
    remoteCursors,
    remoteSelections,
    remotePartMoves,
    onRemoteEdit,
    joinRoom,
    leaveRoom,
    broadcastCursor,
    broadcastSelection,
    broadcastEdit,
    broadcastPartMove,
    disconnect,
  ]);

  return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
};

export const useCollaboration = (): CollaborationState => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
};
