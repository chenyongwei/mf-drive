/**
 * Box Selection Overlay Component
 *
 * Renders the selection rectangle during box selection
 * Shows different styles for different selection modes
 */

import React from 'react';
import { useCADBoxSelection, SelectionMode, ModifierKey } from '../hooks/useCADBoxSelection';

interface BoxSelectionOverlayProps {
  boxSelection: ReturnType<typeof useCADBoxSelection>;
}

const styles = {
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    zIndex: 1000,
  },
  selectionRect: (mode: SelectionMode) => ({
    position: 'absolute' as const,
    border: '2px solid',
    backgroundColor: mode === 'window' ? 'rgba(74, 158, 255, 0.1)' : 'rgba(76, 175, 80, 0.1)',
    pointerEvents: 'none' as const,
  }),
  label: {
    position: 'absolute' as const,
    top: '-24px',
    left: '0px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: '#ffffff',
    borderRadius: '3px',
    whiteSpace: 'nowrap' as const,
  },
};

const BoxSelectionOverlay: React.FC<BoxSelectionOverlayProps> = ({ boxSelection }) => {
  const { isSelecting, currentRect, selectionMode, modifierKey, selectedEntities } = boxSelection;

  if (!isSelecting || !currentRect) {
    return null;
  }

  // Calculate rectangle position and size
  const width = currentRect.maxX - currentRect.minX;
  const height = currentRect.maxY - currentRect.minY;

  // Determine style based on mode
  const isWindowMode = selectionMode === 'window';
  const borderColor = isWindowMode ? '#4a9eff' : '#4caf50'; // Blue for window, green for crossing
  const borderStyle = isWindowMode ? 'solid' : 'dashed'; // Solid for window, dashed for crossing

  // Mode label
  const getModeLabel = (): string => {
    let label = isWindowMode ? '窗口选择' : '交叉选择';

    if (modifierKey === 'shift') {
      label += ' (添加)';
    } else if (modifierKey === 'ctrl') {
      label += ' (移除)';
    }

    return label;
  };

  return (
    <div style={styles.overlay}>
      {/* Selection Rectangle */}
      <div
        style={{
          ...styles.selectionRect(selectionMode),
          left: currentRect.minX,
          top: currentRect.minY,
          width,
          height,
          borderColor,
          borderStyle,
        }}
      >
        {/* Mode Label */}
        <div
          style={{
            ...styles.label,
            backgroundColor: borderColor,
          }}
        >
          {getModeLabel()} ({selectedEntities.size} 已选择)
        </div>
      </div>

      {/* Corner handles for visual feedback */}
      <div
        style={{
          position: 'absolute',
          left: currentRect.minX - 4,
          top: currentRect.minY - 4,
          width: 8,
          height: 8,
          backgroundColor: borderColor,
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: currentRect.maxX - 4,
          top: currentRect.minY - 4,
          width: 8,
          height: 8,
          backgroundColor: borderColor,
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: currentRect.minX - 4,
          top: currentRect.maxY - 4,
          width: 8,
          height: 8,
          backgroundColor: borderColor,
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: currentRect.maxX - 4,
          top: currentRect.maxY - 4,
          width: 8,
          height: 8,
          backgroundColor: borderColor,
          borderRadius: '50%',
        }}
      />
    </div>
  );
};

export default BoxSelectionOverlay;
