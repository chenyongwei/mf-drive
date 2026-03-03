import { ROW_WIDTH, PART_SPACING, PART_EXPANSION } from '../../constants/layoutConstants';
import type { BoundingBox, Part } from '../../lib/webgpu/CollisionDetectionEngine';
import type { LoadedPart } from './PartViewerWebCAD.types';

export function calculateLayout(parts: LoadedPart[]): { parts: LoadedPart[]; globalBox: BoundingBox } {
  if (parts.length === 0) {
    return { parts: [], globalBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
  }

  const partsWithLayout = [...parts];
  const partBoxes = partsWithLayout.map((part) => {
    const { minX, minY, maxX, maxY } = part.geometry.boundingBox;
    return {
      part,
      width: maxX - minX + 2 * PART_EXPANSION,
      height: maxY - minY + 2 * PART_EXPANSION,
    };
  });
  partBoxes.sort((a, b) => b.height - a.height);

  let currentX = 0;
  let currentY = 0;
  let maxHeightInRow = 0;
  let globalMinX = Infinity;
  let globalMinY = Infinity;
  let globalMaxX = -Infinity;
  let globalMaxY = -Infinity;

  partBoxes.forEach(({ part, width, height }, index) => {
    if (currentX + width > ROW_WIDTH && index > 0) {
      currentX = 0;
      currentY += maxHeightInRow + PART_SPACING;
      maxHeightInRow = 0;
    }

    part.offsetX = currentX + PART_EXPANSION - part.geometry.boundingBox.minX;
    part.offsetY = currentY + PART_EXPANSION - part.geometry.boundingBox.minY;

    globalMinX = Math.min(globalMinX, currentX);
    globalMinY = Math.min(globalMinY, currentY);
    globalMaxX = Math.max(globalMaxX, currentX + width);
    globalMaxY = Math.max(globalMaxY, currentY + height);

    currentX += width + PART_SPACING;
    maxHeightInRow = Math.max(maxHeightInRow, height);
  });

  return {
    parts: partsWithLayout,
    globalBox: {
      minX: globalMinX,
      minY: globalMinY,
      maxX: globalMaxX,
      maxY: globalMaxY,
    },
  };
}

export function convertToCollisionPart(part: LoadedPart): Part {
  return {
    id: part.partId,
    outerContour: {
      points: [
        { x: part.geometry.boundingBox.minX, y: part.geometry.boundingBox.minY },
        { x: part.geometry.boundingBox.maxX, y: part.geometry.boundingBox.minY },
        { x: part.geometry.boundingBox.maxX, y: part.geometry.boundingBox.maxY },
        { x: part.geometry.boundingBox.minX, y: part.geometry.boundingBox.maxY },
      ],
    },
    boundingBox: part.geometry.boundingBox,
    position: { x: part.offsetX, y: part.offsetY },
    rotation: 0,
  };
}
