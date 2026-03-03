import { useEffect, DependencyList } from 'react';

/**
 * Custom hook for handling keyboard shortcuts
 */
export const useKeyboardShortcuts = (
  handlers: {
    onRotateLeft?: () => void;
    onRotateRight?: () => void;
    onMirrorHorizontal?: () => void;
    onMirrorVertical?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFitToView?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onSelectAllParts?: () => void;
    onExportDXF?: () => void;
    onStartNesting?: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
  },
  conditions: {
    isNestingRunning: boolean;
    hotkeyConfigOpen: boolean;
    materialGroupDialogOpen: boolean;
    nestingResultSelectorOpen: boolean;
  },
  deps: DependencyList
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we should confirm with space
      if (e.key === ' ') {
        e.preventDefault();
        if (conditions.nestingResultSelectorOpen || conditions.hotkeyConfigOpen || conditions.materialGroupDialogOpen) {
          handlers.onConfirm?.();
        } else if (!conditions.isNestingRunning) {
          handlers.onStartNesting?.();
        }
        return;
      }

      // Escape key for closing dialogs
      if (e.key === 'Escape') {
        handlers.onCancel?.();
        return;
      }

      // Arrow keys for rotation
      if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onRotateLeft?.();
      }
      if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onRotateRight?.();
      }

      // H/V for mirror
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onMirrorHorizontal?.();
      }
      if (e.key === 'v' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onMirrorVertical?.();
      }

      // +/- for zoom
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handlers.onZoomIn?.();
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handlers.onZoomOut?.();
      }

      // F for fit to view
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onFitToView?.();
      }

      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handlers.onUndo?.();
      }

      // Ctrl+Y for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handlers.onRedo?.();
      }

      // Ctrl+A for select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handlers.onSelectAllParts?.();
      }

      // D for export DXF
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onExportDXF?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, conditions, ...deps]);
};
