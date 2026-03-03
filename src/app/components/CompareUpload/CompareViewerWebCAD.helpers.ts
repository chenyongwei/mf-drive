import { BoundingBox } from '../common/WebGPUCADView';
import {
  GROUP_SPACING,
  PART_EXPANSION,
  PART_SPACING,
  ROW_WIDTH,
} from '../../constants/layoutConstants';
import { FileData, LoadedPart } from './CompareViewerWebCAD.types';

const getRandomPantoneColor = (partId: string): string => {
  const colors = ['#FFD700', '#FFC125', '#87CEEB', '#90EE90', '#FFB6C1', '#DDA0DD', '#F0E68C'];
  let hash = 0;
  for (let i = 0; i < partId.length; i++) {
    hash = partId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const calculateLayoutWithGrouping = (
  parts: LoadedPart[],
  groups: Array<{ baseName: string; files: FileData[] }>,
): { parts: LoadedPart[]; globalBox: BoundingBox } => {
  if (parts.length === 0) {
    return { parts: [], globalBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
  }

  const partMap = new Map<string, LoadedPart[]>();
  parts.forEach(part => {
    const baseName = part.baseName || part.originalFilename || part.partId;
    if (!partMap.has(baseName)) {
      partMap.set(baseName, []);
    }
    partMap.get(baseName)!.push(part);
  });

  let currentX = 0;
  let currentY = 0;
  let maxHeightInRow = 0;
  let globalMinX = Infinity;
  let globalMinY = Infinity;
  let globalMaxX = -Infinity;
  let globalMaxY = -Infinity;

  groups.forEach((group) => {
    const groupParts = partMap.get(group.baseName) || [];

    let groupWidth = 0;
    let groupMaxHeight = 0;
    groupParts.forEach(part => {
      const { minX, minY, maxX, maxY } = part.geometry.boundingBox;
      const partWidth = (maxX - minX) + 2 * PART_EXPANSION;
      const partHeight = (maxY - minY) + 2 * PART_EXPANSION;

      if (groupParts.length > 1) {
        groupWidth += partWidth + PART_SPACING;
      } else {
        groupWidth = Math.max(groupWidth, partWidth);
      }
      groupMaxHeight = Math.max(groupMaxHeight, partHeight);
    });

    if (groupParts.length > 1) {
      groupWidth -= PART_SPACING;
    }

    if (currentX + groupWidth > ROW_WIDTH && currentX > 0) {
      currentX = 0;
      currentY += maxHeightInRow + GROUP_SPACING;
      maxHeightInRow = 0;
    }

    let partOffsetX = currentX;
    groupParts.forEach(part => {
      const { minX, minY, maxX, maxY } = part.geometry.boundingBox;
      const partHeight = (maxY - minY) + 2 * PART_EXPANSION;

      part.offsetX = partOffsetX + PART_EXPANSION - part.geometry.boundingBox.minX;
      part.offsetY = currentY + PART_EXPANSION - part.geometry.boundingBox.minY;

      const partActualWidth = (maxX - minX) + 2 * PART_EXPANSION;
      globalMinX = Math.min(globalMinX, partOffsetX);
      globalMinY = Math.min(globalMinY, currentY);
      globalMaxX = Math.max(globalMaxX, partOffsetX + partActualWidth);
      globalMaxY = Math.max(globalMaxY, currentY + partHeight);

      if (groupParts.length > 1) {
        partOffsetX += partActualWidth + PART_SPACING;
      }
    });

    if (groupParts.length > 1) {
      currentX += groupWidth + GROUP_SPACING;
    } else if (groupParts[0]) {
      const { minX, maxX } = groupParts[0].geometry.boundingBox;
      currentX += (maxX - minX) + 2 * PART_EXPANSION + GROUP_SPACING;
    }

    maxHeightInRow = Math.max(maxHeightInRow, groupMaxHeight);
  });

  return {
    parts,
    globalBox: {
      minX: globalMinX,
      minY: globalMinY,
      maxX: globalMaxX,
      maxY: globalMaxY,
    },
  };
};

export const fetchGroupedParts = async (
  files: FileData[],
): Promise<{ parts: LoadedPart[]; globalBox: BoundingBox }> => {
  const fileGroups = new Map<string, FileData[]>();
  files.forEach(fileInfo => {
    if (!fileGroups.has(fileInfo.baseName)) {
      fileGroups.set(fileInfo.baseName, []);
    }
    fileGroups.get(fileInfo.baseName)!.push(fileInfo);
  });

  const sortedGroups: Array<{ baseName: string; files: FileData[] }> = [];
  fileGroups.forEach((groupFiles, baseName) => {
    groupFiles.sort((a, b) => {
      if (a.fileType === 'DXF' && b.fileType === 'PRTS') return -1;
      if (a.fileType === 'PRTS' && b.fileType === 'DXF') return 1;
      return 0;
    });
    sortedGroups.push({ baseName, files: groupFiles });
  });

  sortedGroups.sort((a, b) => a.baseName.localeCompare(b.baseName));
  const flatList = sortedGroups.flatMap(group => group.files);

  const partPromises = flatList.map(async (fileInfo) => {
    const apiUrl = fileInfo.fileType === 'DXF'
      ? `/api/drawing/files/${fileInfo.partId}/parts`
      : `/api/drawing/parts/${fileInfo.partId}`;

    let responseData: any;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to load part: ${fileInfo.partId}`);
      }

      responseData = await response.json();
      if (fileInfo.fileType !== 'DXF') {
        break;
      }

      if (responseData.status === 'pending' || (!responseData.parts || responseData.parts.length === 0)) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      break;
    }

    let data: any;
    if (fileInfo.fileType === 'DXF') {
      if (attempts >= maxAttempts) {
        throw new Error('DXF file parsing timed out. Please refresh the page to try again.');
      }
      if (!responseData.parts || responseData.parts.length === 0) {
        throw new Error(`No parts found for DXF file: ${fileInfo.originalFilename}`);
      }
      data = responseData.parts[0];
    } else {
      data = responseData;
    }

    const convertedEntities = (data.entities || []).map((apiEntity: any) => {
      const entityType = (apiEntity.type || '').toUpperCase();
      if (entityType === 'LWPOLYLINE') {
        return {
          id: `${data.partId}-entity-${apiEntity.id}`,
          type: 'POLYLINE' as const,
          geometry: {
            points: apiEntity.points || [],
            closed: apiEntity.polyflag === 1,
          },
          color: 3,
          isPart: true,
          isInnerContour: apiEntity.isInnerContour,
        };
      }

      return {
        ...apiEntity,
        type: entityType,
      };
    });

    const normalizedData = {
      ...data,
      geometry: data.geometry || {
        boundingBox: data.bbox || data.geometry?.boundingBox || { minX: 0, minY: 0, maxX: 0, maxY: 0 },
        area: data.geometry?.area || 0,
      },
    };

    return {
      ...normalizedData,
      entities: convertedEntities,
      originalFilename: fileInfo.originalFilename || fileInfo.name,
      fileType: fileInfo.fileType,
      baseName: fileInfo.baseName,
      offsetX: 0,
      offsetY: 0,
      isPartMode: fileInfo.fileType === 'PRTS',
      channel: getRandomPantoneColor(data.id || data.partId || data.fileId || fileInfo.partId),
    } satisfies LoadedPart;
  });

  const partsData = await Promise.all(partPromises);
  return calculateLayoutWithGrouping(partsData, sortedGroups);
};
