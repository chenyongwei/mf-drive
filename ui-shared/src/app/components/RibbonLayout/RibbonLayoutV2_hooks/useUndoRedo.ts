import { useCallback, useState } from 'react';

/**
 * Custom hook for undo/redo functionality
 */
export const useUndoRedo = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback((action: any) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ action, timestamp: Date.now() });
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    const action = history[historyIndex];
    // Implement undo logic based on action type
    setHistoryIndex((prev) => prev - 1);
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex((prev) => prev + 1);
  }, [history, historyIndex]);

  return {
    history,
    historyIndex,
    addToHistory,
    handleUndo,
    handleRedo,
  };
};
