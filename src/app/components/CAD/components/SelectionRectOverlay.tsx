/**
 * Selection Rectangle Overlay
 *
 * Renders the box selection rectangle with visual feedback
 * - Window mode (left→right): Blue solid border
 * - Crossing mode (right→left): Green dashed border
 * - Shows selection count
 * - Displays mode label
 */

import React from 'react';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SelectionRectOverlayProps {
  currentRect: Rect | null;
  selectionMode: 'window' | 'crossing' | null;
  selectedCount: number;
}

export const SelectionRectOverlay: React.FC<SelectionRectOverlayProps> = ({
  currentRect,
  selectionMode,
  selectedCount,
}) => {
  if (!currentRect || !selectionMode) {
    return null;
  }

  const isWindowMode = selectionMode === 'window';

  // Style based on selection mode
  const rectStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 40,
    left: `${currentRect.x}px`,
    top: `${currentRect.y}px`,
    width: `${currentRect.width}px`,
    height: `${currentRect.height}px`,
    border: isWindowMode ? '2px solid #0066cc' : '2px dashed #00cc66',
    backgroundColor: isWindowMode ? 'rgba(0, 102, 204, 0.1)' : 'rgba(0, 204, 102, 0.1)',
    pointerEvents: 'none', // Let mouse events pass through
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-24px',
    left: '0',
    backgroundColor: isWindowMode ? '#0066cc' : '#00cc66',
    color: 'white',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  };

  const countStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-24px',
    right: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  };

  const modeLabel = isWindowMode ? '窗口选择' : '交叉选择';

  return (
    <div style={rectStyle}>
      {/* Mode label */}
      <div style={labelStyle}>{modeLabel}</div>

      {/* Selection count */}
      {selectedCount > 0 && (
        <div style={countStyle}>已选择 {selectedCount} 个对象</div>
      )}

      {/* Corner handles for visual feedback */}
      <CornerHandle x={0} y={0} />
      <CornerHandle x={currentRect.width} y={0} />
      <CornerHandle x={0} y={currentRect.height} />
      <CornerHandle x={currentRect.width} y={currentRect.height} />
    </div>
  );
};

interface CornerHandleProps {
  x: number;
  y: number;
}

const CornerHandle: React.FC<CornerHandleProps> = ({ x, y }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x - 4}px`,
    top: `${y - 4}px`,
    width: '8px',
    height: '8px',
    backgroundColor: 'white',
    border: '1px solid #666',
    borderRadius: '2px',
    pointerEvents: 'none',
  };

  return <div style={style} />;
};
