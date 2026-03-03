import { ReactNode } from 'react';

export interface RemoteUser {
  userId: string;
  username: string;
  color: string;
}

export interface CursorPosition {
  x: number;
  y: number;
}

export interface EditOperation {
  type: 'trim' | 'extend' | 'delete' | 'move' | 'rotate';
  entityId?: string;
  entityIds?: string[];
  data: any;
}

export interface PartMoveData {
  partId: string;
  position: { x: number; y: number };
  rotation: number;
}

export interface CollaborationState {
  isConnected: boolean;
  myUserId: string;
  myUsername: string | null;
  myColor: string | null;
  currentRoom: string | null;
  remoteUsers: Map<string, RemoteUser>;
  remoteCursors: Map<string, CursorPosition>;
  remoteSelections: Map<string, string[]>;
  remotePartMoves: Map<string, PartMoveData>;
  onRemoteEdit: ((data: { userId: string; operation: EditOperation }) => void) | null;
  setOnRemoteEdit: (callback: ((data: { userId: string; operation: EditOperation }) => void) | null) => void;
  joinRoom: (fileId: string) => void;
  leaveRoom: () => void;
  broadcastCursor: (position: CursorPosition) => void;
  broadcastSelection: (entityIds: string[]) => void;
  broadcastEdit: (operation: EditOperation) => void;
  broadcastPartMove: (partMove: PartMoveData) => void;
  disconnect: () => void;
}

export interface CollaborationProviderProps {
  children: ReactNode;
}
