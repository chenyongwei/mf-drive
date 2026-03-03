/**
 * Calculate optimal grid layout for tiles
 */
export function calculateOptimalGrid(
  count: number,
  viewportWidth: number,
  viewportHeight: number
): { rows: number; cols: number } {
  if (count === 0) return { rows: 0, cols: 0 };

  let bestGrid = { rows: 1, cols: 1 };
  let minWastedSpace = Infinity;

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cellWidth = viewportWidth / cols;
    const cellHeight = viewportHeight / rows;

    const totalArea = cellWidth * cellHeight * count;
    const usedArea = Math.min(cellWidth * cellHeight * cols * rows, totalArea);
    const wastedSpace = usedArea - totalArea;

    if (wastedSpace < minWastedSpace) {
      minWastedSpace = wastedSpace;
      bestGrid = { rows, cols };
    }
  }

  return bestGrid;
}

/**
 * Calculate grid cell position
 */
export function getCellPosition(
  index: number,
  cols: number,
  cellWidth: number,
  cellHeight: number,
  spacing: number
): { x: number; y: number } {
  const row = Math.floor(index / cols);
  const col = index % cols;

  return {
    x: col * (cellWidth + spacing),
    y: row * (cellHeight + spacing)
  };
}

/**
 * Calculate scale to fit content in cell
 */
export function calculateFitScale(
  contentWidth: number,
  contentHeight: number,
  cellWidth: number,
  cellHeight: number,
  padding: number
): number {
  return Math.min(
    (cellWidth - padding * 2) / contentWidth,
    (cellHeight - padding * 2) / contentHeight
  );
}

/**
 * Calculate centered position in cell
 */
export function calculateCenteredPosition(
  contentWidth: number,
  contentHeight: number,
  scale: number,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number
): { x: number; y: number } {
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;

  return {
    x: cellX + (cellWidth - scaledWidth) / 2,
    y: cellY + (cellHeight - scaledHeight) / 2
  };
}
