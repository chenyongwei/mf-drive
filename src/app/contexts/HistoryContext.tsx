/**
 * History Context
 *
 * Manages server-side edit history with undo/redo support
 * Handles:
 * - Fetching history state
 * - Performing undo operations
 * - Performing redo operations
 * - Operation transformation (OT)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';

export interface EditOperation {
  id?: number;
  fileId: string;
  operationType: 'create' | 'trim' | 'extend' | 'delete' | 'explode' | 'move' | 'rotate' | 'update';
  entityId?: string;
  entityIds?: string[];
  operationData: any;
  userId: string;
  username: string;
  timestamp: number;
  version: number;
}

export interface HistoryState {
  currentVersion: number;
  operations: EditOperation[];
  canUndo: boolean;
  canRedo: boolean;
}

interface HistoryContextState {
  // State
  historyState: HistoryState | null;
  isLoading: boolean;
  error: string | null;

  // Operations
  fetchHistoryState: (fileId: string) => Promise<void>;
  undo: (fileId: string, userId: string, username: string) => Promise<EditOperation | null>;
  redo: (fileId: string, userId: string, username: string) => Promise<EditOperation | null>;
  jumpToVersion: (fileId: string, targetVersion: number, userId: string, username: string) => Promise<void>;
  transformOperation: (fileId: string, operation: EditOperation, baseVersion: number) => Promise<EditOperation>;
}

const HistoryContext = createContext<HistoryContextState | undefined>(undefined);

interface HistoryProviderProps {
  children: ReactNode;
}

export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children }) => {
  const [historyState, setHistoryState] = useState<HistoryState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch history state for a file
   */
  const fetchHistoryState = useCallback(async (fileId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history/${fileId}/state`);

      if (!response.ok) {
        // Silently ignore 404/500 errors for PRTS parts (they may not have history)
        if (response.status === 404 || response.status === 500) {
          // Silent - no console log needed
          setHistoryState(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setHistoryState(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch history state');
      }
    } catch (err) {
      // Silently handle errors (PRTS parts don't have history)
      setHistoryState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Undo the last operation
   */
  const undo = useCallback(async (
    fileId: string,
    userId: string,
    username: string
  ): Promise<EditOperation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history/${fileId}/undo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, username }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Refresh history state after undo
        await fetchHistoryState(fileId);
        return result.data.operation;
      } else {
        throw new Error(result.error || 'Failed to undo operation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[HistoryContext] Error undoing:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistoryState]);

  /**
   * Redo the last undone operation
   */
  const redo = useCallback(async (
    fileId: string,
    userId: string,
    username: string
  ): Promise<EditOperation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history/${fileId}/redo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, username }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Refresh history state after redo
        await fetchHistoryState(fileId);
        return result.data.operation;
      } else {
        throw new Error(result.error || 'Failed to redo operation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[HistoryContext] Error redoing:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistoryState]);

  /**
   * Transform an operation against concurrent operations
   */
  const transformOperation = useCallback(async (
    fileId: string,
    operation: EditOperation,
    baseVersion: number
  ): Promise<EditOperation> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history/${fileId}/transform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation, baseVersion }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return result.data.transformedOperation;
      } else {
        throw new Error(result.error || 'Failed to transform operation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[HistoryContext] Error transforming operation:', errorMessage);
      setError(errorMessage);
      return operation; // Return original if transform fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Jump to a specific version in history
   */
  const jumpToVersion = useCallback(async (
    fileId: string,
    targetVersion: number,
    userId: string,
    username: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history/${fileId}/jump-to/${targetVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, username }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Refresh history state after jump
        await fetchHistoryState(fileId);
      } else {
        throw new Error(result.error || 'Failed to jump to version');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[HistoryContext] Error jumping to version:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistoryState]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo((): HistoryContextState => ({
    historyState,
    isLoading,
    error,
    fetchHistoryState,
    undo,
    redo,
    jumpToVersion,
    transformOperation,
  }), [
    historyState,
    isLoading,
    error,
    fetchHistoryState,
    undo,
    redo,
    jumpToVersion,
    transformOperation,
  ]);

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

export const useHistory = (): HistoryContextState => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
};
