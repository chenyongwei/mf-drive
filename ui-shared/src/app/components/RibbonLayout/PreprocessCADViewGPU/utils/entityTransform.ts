import { Entity } from '../../../../lib/webgpu/WebGPURenderer';
import {
  collectProjectedLayoutEntities,
  projectLayoutPoint,
  type LayoutProjectionTransform,
} from '../../../../utils/layoutProjection';
import type { ImportedFile, TiledLayout } from './layoutTypes';

/**
 * Transform entities for WebGPU rendering based on layout position and scale
 */
export const transformEntities = (
  tiledLayout: TiledLayout[],
  files: ImportedFile[],
  fileEntities: Map<string, any>,
  selectedFileIds: Set<string>,
  editState: any
): Entity[] => {
  const allEntities: Entity[] = [];

  tiledLayout.forEach((layout) => {
    const projected = collectProjectedLayoutEntities({
      layout,
      files,
      fileEntities,
      selectedFileIds,
      createEntity: (entity): Entity => ({
        id: entity.id,
        type: entity.type,
        color: entity.color || 7,
        isSelected: editState.selectedEntityIds.has(entity.id),
        isHovered: editState.hoverEntityId === entity.id,
        fileId: layout.fileId,
      }),
    });
    if (!projected) return;

    allEntities.push(projected.frameEntity, ...projected.projectedEntities);
  });

  return allEntities;
};

/**
 * Transform inspection issues to marker format
 */
export const transformInspectionMarkers = (
  inspectionIssues: any[],
  files: ImportedFile[],
  tiledLayout: TiledLayout[],
  selectedIssueIds: Set<string>,
  hoveredIssueId?: string
) => {
  if (!inspectionIssues || inspectionIssues.length === 0) return [];

  return inspectionIssues
    .map((issue) => {
      const file = files.find((f) => f.inspectionResult?.issues.some((i: any) => i.id === issue.id));

      if (!file) return null;

      const layout = tiledLayout.find((l) => l.fileId === file.id);
      if (!layout) return null;

      const bbox = file.bbox || { minX: 0, minY: 0, maxX: 100, maxY: 100 };
      const scaleX = layout.scale;
      const scaleY = layout.scale;
      const offsetX = layout.position.x;
      const offsetY = layout.position.y;
      const transform: LayoutProjectionTransform = {
        bbox,
        scaleX,
        scaleY,
        offsetX,
        offsetY,
      };
      const { x, y } = projectLayoutPoint(issue.location.position, transform);

      return {
        id: issue.id,
        x,
        y,
        level: issue.level,
        selected: selectedIssueIds.has(issue.id),
        hovered: hoveredIssueId === issue.id,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
};
