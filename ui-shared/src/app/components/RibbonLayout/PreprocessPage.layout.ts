import type { ImportedFile, TiledLayout } from './PreprocessPage.types';

export function calculateTiledLayout(importedFiles: ImportedFile[], selectedFileIds: Set<string>): TiledLayout[] {
  const selectedFiles = importedFiles.filter((f) => selectedFileIds.has(f.id) && f.status === 'ready');

  if (selectedFiles.length === 0) {
    return [];
  }

  const viewportWidth = 3000;
  const viewportHeight = 2000;
  const viewportPadding = 100;
  const availableWidth = viewportWidth - viewportPadding * 2;
  const availableHeight = viewportHeight - viewportPadding * 2;

  const viewportRatio = availableWidth / availableHeight;
  let bestGrid = { rows: 1, cols: selectedFiles.length };
  let bestScore = 0;

  for (let cols = 1; cols <= selectedFiles.length; cols++) {
    const rows = Math.ceil(selectedFiles.length / cols);
    const gridRatio = cols / rows;
    const score = 1 / Math.abs(gridRatio - viewportRatio + 0.001);

    if (score > bestScore) {
      bestScore = score;
      bestGrid = { rows, cols };
    }
  }

  const { rows, cols } = bestGrid;
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;

  const framePaddingMM = 100;
  const cellPadding = 20;
  const layouts: TiledLayout[] = [];

  selectedFiles.forEach((file, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const cellX = viewportPadding + col * cellWidth;
    const cellY = viewportPadding + row * cellHeight;

    const fileBbox = file.bbox || { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const fileWidth = fileBbox.maxX - fileBbox.minX;
    const fileHeight = fileBbox.maxY - fileBbox.minY;

    const effectiveWidth = fileWidth + framePaddingMM * 2;
    const effectiveHeight = fileHeight + framePaddingMM * 2;
    const scale = Math.min(
      (cellWidth - cellPadding * 2) / effectiveWidth,
      (cellHeight - cellPadding * 2) / effectiveHeight,
    );

    const scaledWidth = fileWidth * scale;
    const scaledHeight = fileHeight * scale;
    const framePaddingPixels = framePaddingMM * scale;

    const position = {
      x: cellX + (cellWidth - scaledWidth - framePaddingPixels * 2) / 2,
      y: cellY + (cellHeight - scaledHeight - framePaddingPixels * 2) / 2,
    };

    const scaledBbox = {
      minX: position.x - framePaddingPixels,
      minY: position.y - framePaddingPixels,
      maxX: position.x + scaledWidth + framePaddingPixels,
      maxY: position.y + scaledHeight + framePaddingPixels,
    };

    layouts.push({
      fileId: file.id,
      position,
      scale,
      bbox: scaledBbox,
    });
  });

  return layouts;
}
