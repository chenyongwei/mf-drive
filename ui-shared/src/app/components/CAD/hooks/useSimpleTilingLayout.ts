import { useMemo, useRef } from 'react';
import type { Entity } from '../../../webgpu/EntityToVertices';
import { translateEntity } from '../../../utils/entityTransform';
import {
  ROW_WIDTH,
  SPACING,
  EXPANSION,
  FILE_FRAME_CLEARANCE_MM,
} from '../../../constants/layoutConstants';
import { resolveCollisionFreeLayouts } from '../utils/layoutCollisionResolver';
import { calculateBoundingBox } from './useSimpleTilingLayout.bbox';
import type { FileLayout, LayoutProps, LayoutResult } from './useSimpleTilingLayout.types';


export const useSimpleTilingLayout = ({
  entitiesMap,
  files,
  selectedFileId = null,
  preferredAnchorFileId = null,
}: LayoutProps): LayoutResult => {

  // Persistent storage for layouts to maintain stability
  const lastLayoutsRef = useRef<Map<string, { offsetX: number, offsetY: number }>>(new Map());

  // Persistent storage for translated entities to maintain stability
  const translatedEntitiesCacheRef = useRef<Map<string, { entities: Entity[], offsetX: number, offsetY: number, sourceEntities: Entity[] }>>(new Map());

  // Layout calculation - decoupled from interaction state
  const layout = useMemo<LayoutResult>(() => {
    const entityKeys = Object.keys(entitiesMap);
    if (entityKeys.length === 0) {
      lastLayoutsRef.current.clear();
      translatedEntitiesCacheRef.current.clear();
      return { entities: [], contentBox: null, fileLayouts: [] };
    }

    // Process ALL loaded files (no filtering by selection)
    const fileIdsToProcess = entityKeys;

    // Calculate bounding box for each file
    const fileLayouts: FileLayout[] = [];

    fileIdsToProcess.forEach(fileId => {
      const entities = entitiesMap[fileId];
      if (!entities || entities.length === 0) return;

      const bbox = calculateBoundingBox(entities);
      if (!bbox) {
        return;
      }

      fileLayouts.push({
        fileId,
        offsetX: 0,
        offsetY: 0,
        boundingBox: bbox,
      });
    });

    // Check which layouts we can reuse
    const currentLayoutsMap = lastLayoutsRef.current;

    // Determine which files are "new" and need layout
    const layoutsToPosition: FileLayout[] = [];
    fileLayouts.forEach(layout => {
      const existing = currentLayoutsMap.get(layout.fileId);
      if (existing) {
        layout.offsetX = existing.offsetX;
        layout.offsetY = existing.offsetY;
      } else {
        layoutsToPosition.push(layout);
      }
    });

    // Separate layouts to be positioned into PRTS and non-PRTS
    const prtsToPosition: FileLayout[] = [];
    const nonPrtsToPosition: FileLayout[] = [];

    layoutsToPosition.forEach(layout => {
      const bbox = layout.boundingBox;
      const originThreshold = 1; // 1mm tolerance from origin
      const isAtOrigin =
        Math.abs(bbox.minX) < originThreshold &&
        Math.abs(bbox.minY) < originThreshold;

      if (isAtOrigin) {
        prtsToPosition.push(layout);
      } else {
        nonPrtsToPosition.push(layout);
      }
    });

    // Sort by width (descending) for better packing
    prtsToPosition.sort((a, b) => {
      const widthA = a.boundingBox.maxX - a.boundingBox.minX;
      const widthB = b.boundingBox.maxX - b.boundingBox.minX;
      return widthB - widthA;
    });

    nonPrtsToPosition.sort((a, b) => {
      const widthA = a.boundingBox.maxX - a.boundingBox.minX;
      const widthB = b.boundingBox.maxX - b.boundingBox.minX;
      return widthB - widthA;
    });

    // Calculate current global bounds based on existing layouts
    let globalMinX = 0;
    let globalMinY = 0;
    let globalMaxX = 0;
    let globalMaxY = 0;

    fileLayouts.forEach(layout => {
      if (currentLayoutsMap.has(layout.fileId)) {
        const width = layout.boundingBox.maxX - layout.boundingBox.minX;
        const height = layout.boundingBox.maxY - layout.boundingBox.minY;
        const actualWidth = width + 2 * EXPANSION;
        const actualHeight = height + 2 * EXPANSION;

        // offsetX = currentX - minX + EXPANSION  => currentX = offsetX + minX - EXPANSION
        const left = layout.offsetX + layout.boundingBox.minX - EXPANSION;
        const top = layout.offsetY + layout.boundingBox.minY - EXPANSION;

        globalMaxX = Math.max(globalMaxX, left + actualWidth);
        globalMaxY = Math.max(globalMaxY, top + actualHeight);
      }
    });

    // Arrange non-PRTS files in a flow layout starting from the end of current layout
    let currentX = 0;
    let currentY = 0;
    let maxHeightInRow = 0;

    // If we have some files already, start non-PRTS at a new row to be safe
    // or just continue if we wanted more complex packing. 
    // For now, simplicity: if any non-PRTS exists, let's start after its Row.
    if (globalMaxY > 0) {
      currentY = globalMaxY + SPACING;
    }

    nonPrtsToPosition.forEach((layout) => {
      const width = layout.boundingBox.maxX - layout.boundingBox.minX;
      const height = layout.boundingBox.maxY - layout.boundingBox.minY;

      // Check if we need to wrap to next row
      if (currentX + width > ROW_WIDTH && currentX > 0) {
        currentX = 0;
        currentY += maxHeightInRow + SPACING;
        maxHeightInRow = 0;
      }

      // Set offset for this file
      layout.offsetX = currentX - layout.boundingBox.minX + EXPANSION;
      layout.offsetY = currentY - layout.boundingBox.minY + EXPANSION;

      // Update global bounds
      const actualMaxX = currentX + width + 2 * EXPANSION;
      const actualMaxY = currentY + height + 2 * EXPANSION;

      globalMaxX = Math.max(globalMaxX, actualMaxX);
      globalMaxY = Math.max(globalMaxY, actualMaxY);
      maxHeightInRow = Math.max(maxHeightInRow, height + 2 * EXPANSION);

      // Move to next position
      currentX += width + SPACING + 2 * EXPANSION;
    });

    // Arrange PRTS files in a grid below non-PRTS files
    const gridStartY = globalMaxY + SPACING;
    const gridCols = 10; // 10 files per row
    const forcedWidth = 500; // Minimum 500mm width
    const forcedHeight = 500; // Minimum 500mm height

    // Calculate unified cell size for the grid (max of all part dimensions)
    const cellWidth = Math.max(
      forcedWidth,
      ...fileLayouts.map(l => l.boundingBox.maxX - l.boundingBox.minX)
    );
    const cellHeight = Math.max(
      forcedHeight,
      ...fileLayouts.map(l => l.boundingBox.maxY - l.boundingBox.minY)
    );

    prtsToPosition.forEach((layout, index) => {
      const gridCol = index % gridCols;
      const gridRow = Math.floor(index / gridCols);

      layout.offsetX = gridCol * (cellWidth + SPACING) + EXPANSION - layout.boundingBox.minX;
      layout.offsetY = gridStartY + gridRow * (cellHeight + SPACING) + EXPANSION - layout.boundingBox.minY;

      // Update global bounds
      const actualMaxX = (gridCol + 1) * (cellWidth + SPACING) + 2 * EXPANSION;
      const actualMaxY = gridStartY + (gridRow + 1) * (cellHeight + SPACING) + 2 * EXPANSION;

      globalMaxX = Math.max(globalMaxX, actualMaxX);
      globalMaxY = Math.max(globalMaxY, actualMaxY);
    });

    const layoutIds = new Set(fileLayouts.map((layout) => layout.fileId));
    const anchorFileId =
      (selectedFileId && layoutIds.has(selectedFileId) ? selectedFileId : null) ||
      (preferredAnchorFileId && layoutIds.has(preferredAnchorFileId)
        ? preferredAnchorFileId
        : null) ||
      files.find((file) => layoutIds.has(file.id))?.id ||
      fileLayouts[0]?.fileId ||
      null;

    const collisionFreeLayouts = resolveCollisionFreeLayouts(fileLayouts, {
      anchorFileId,
      framePaddingMm: EXPANSION,
      clearanceMm: FILE_FRAME_CLEARANCE_MM,
    });

    let contentMinX = Infinity;
    let contentMinY = Infinity;
    let contentMaxX = -Infinity;
    let contentMaxY = -Infinity;

    collisionFreeLayouts.forEach((layout) => {
      const left = layout.offsetX + layout.boundingBox.minX - EXPANSION;
      const top = layout.offsetY + layout.boundingBox.minY - EXPANSION;
      const right = layout.offsetX + layout.boundingBox.maxX + EXPANSION;
      const bottom = layout.offsetY + layout.boundingBox.maxY + EXPANSION;
      contentMinX = Math.min(contentMinX, left);
      contentMinY = Math.min(contentMinY, top);
      contentMaxX = Math.max(contentMaxX, right);
      contentMaxY = Math.max(contentMaxY, bottom);
    });

    // Update the ref for next time
    const nextLayoutsMap = new Map<string, { offsetX: number, offsetY: number }>();
    collisionFreeLayouts.forEach(l => {
      nextLayoutsMap.set(l.fileId, { offsetX: l.offsetX, offsetY: l.offsetY });
    });
    lastLayoutsRef.current = nextLayoutsMap;

    // Apply translations to all entities (with caching)
    const allTranslatedEntities: Entity[] = [];
    const newTranslatedCache = new Map<string, { entities: Entity[], offsetX: number, offsetY: number, sourceEntities: Entity[] }>();

    collisionFreeLayouts.forEach((fileLayout) => {
      const sourceEntities = entitiesMap[fileLayout.fileId];
      if (!sourceEntities) return;

      const cached = translatedEntitiesCacheRef.current.get(fileLayout.fileId);
      let translated: Entity[];

      if (cached &&
        cached.offsetX === fileLayout.offsetX &&
        cached.offsetY === fileLayout.offsetY &&
        cached.sourceEntities === sourceEntities) {
        translated = cached.entities;
      } else {
        translated = sourceEntities.map((entity) => {
          const translatedEntity = translateEntity(entity, fileLayout.offsetX, fileLayout.offsetY);
          (translatedEntity as any).fileId = fileLayout.fileId;
          return translatedEntity;
        });
      }

      newTranslatedCache.set(fileLayout.fileId, {
        entities: translated,
        offsetX: fileLayout.offsetX,
        offsetY: fileLayout.offsetY,
        sourceEntities: sourceEntities
      });

      allTranslatedEntities.push(...translated);
    });

    translatedEntitiesCacheRef.current = newTranslatedCache;

    return {
      entities: allTranslatedEntities,
      contentBox: isFinite(contentMinX)
        ? {
            minX: contentMinX,
            minY: contentMinY,
            maxX: contentMaxX,
            maxY: contentMaxY,
          }
        : null,
      fileLayouts: collisionFreeLayouts,
    };
  }, [entitiesMap, files, selectedFileId, preferredAnchorFileId]);

  return layout;
};
