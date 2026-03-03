import type { Entity } from "../lib/webgpu/WebGPURenderer";

export interface ProjectionBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface LayoutProjectionTransform {
  bbox: ProjectionBBox;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

interface LayoutDescriptor {
  fileId: string;
  scale: number;
  position: { x: number; y: number };
}

interface FileDescriptor {
  id: string;
  bbox?: ProjectionBBox;
}

interface FileEntitiesDescriptor {
  loaded?: boolean;
}

interface LayoutEntityCollection extends FileEntitiesDescriptor {
  entities: any[];
}

interface LayoutProjectionContext<TFile, TEntities> {
  file: TFile;
  fileEntitiesData: TEntities;
  bbox: ProjectionBBox;
  transform: LayoutProjectionTransform;
}

interface Point2D {
  x: number;
  y: number;
}

interface Point3D extends Point2D {
  z?: number;
}

export function projectLayoutPoint(
  point: Point2D,
  { bbox, scaleX, scaleY, offsetX, offsetY }: LayoutProjectionTransform,
): Point2D {
  return {
    x: (point.x - bbox.minX) * scaleX + offsetX,
    y: -(point.y - bbox.minY) * scaleY + offsetY,
  };
}

export function createFramePolylinePoints(
  transform: LayoutProjectionTransform,
  framePaddingMM = 100,
): Point2D[] {
  const { bbox, scaleX, scaleY, offsetX, offsetY } = transform;
  return [
    { x: offsetX - framePaddingMM * scaleX, y: offsetY + framePaddingMM * scaleY },
    {
      x: (bbox.maxX - bbox.minX) * scaleX + offsetX + framePaddingMM * scaleX,
      y: offsetY + framePaddingMM * scaleY,
    },
    {
      x: (bbox.maxX - bbox.minX) * scaleX + offsetX + framePaddingMM * scaleX,
      y: -(bbox.maxY - bbox.minY) * scaleY + offsetY - framePaddingMM * scaleY,
    },
    {
      x: offsetX - framePaddingMM * scaleX,
      y: -(bbox.maxY - bbox.minY) * scaleY + offsetY - framePaddingMM * scaleY,
    },
    { x: offsetX - framePaddingMM * scaleX, y: offsetY + framePaddingMM * scaleY },
  ];
}

export function resolveLayoutProjectionContext<
  TFile extends FileDescriptor,
  TEntities extends FileEntitiesDescriptor,
>(
  layout: LayoutDescriptor,
  files: TFile[],
  fileEntities: Map<string, TEntities>,
): LayoutProjectionContext<TFile, TEntities> | null {
  const file = files.find((candidate) => candidate.id === layout.fileId);
  if (!file) {
    return null;
  }

  const fileEntitiesData = fileEntities.get(layout.fileId);
  if (!fileEntitiesData || !fileEntitiesData.loaded) {
    return null;
  }

  const bbox = file.bbox || { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  return {
    file,
    fileEntitiesData,
    bbox,
    transform: {
      bbox,
      scaleX: layout.scale,
      scaleY: layout.scale,
      offsetX: layout.position.x,
      offsetY: layout.position.y,
    },
  };
}

export function projectEntityGeometry(
  entity: any,
  transform: LayoutProjectionTransform,
): Entity["geometry"] | undefined {
  if (entity.type === "LINE") {
    const start = entity.geometry?.start;
    const end = entity.geometry?.end;
    if (start && end) {
      return {
        start: projectLayoutPoint(start, transform),
        end: projectLayoutPoint(end, transform),
      };
    }
    return undefined;
  }

  if (entity.type === "CIRCLE" || entity.type === "ARC") {
    const center = entity.geometry?.center;
    const radius = entity.geometry?.radius;
    if (center && radius) {
      return {
        center: projectLayoutPoint(center, transform),
        radius: radius * transform.scaleX,
      };
    }
    return undefined;
  }

  if (entity.type === "POLYLINE") {
    const points = entity.geometry?.points;
    if (Array.isArray(points)) {
      return {
        points: points.map((point: Point2D) => projectLayoutPoint(point, transform)),
        closed: entity.geometry.closed,
      };
    }
    return undefined;
  }

  if (entity.type === "SPLINE") {
    const controlPoints = entity.geometry?.controlPoints;
    if (Array.isArray(controlPoints)) {
      return {
        controlPoints: controlPoints.map((point: Point3D) => ({
          ...projectLayoutPoint(point, transform),
          z: point.z || 0,
        })),
        closed: entity.geometry.closed,
        degree: entity.geometry.degree,
      };
    }
    return undefined;
  }

  return undefined;
}

export function projectLayoutEntities(
  entities: any[],
  transform: LayoutProjectionTransform,
  createEntity: (entity: any) => Entity,
): Entity[] {
  const projectedEntities: Entity[] = [];
  entities.forEach((entity) => {
    if (!entity.geometry) {
      return;
    }
    const projectedEntity = createEntity(entity);
    const projectedGeometry = projectEntityGeometry(entity, transform);
    if (projectedGeometry) {
      projectedEntity.geometry = projectedGeometry;
    }
    projectedEntities.push(projectedEntity);
  });
  return projectedEntities;
}

interface CollectProjectedLayoutEntitiesOptions<
  TFile extends FileDescriptor,
  TEntities extends LayoutEntityCollection,
> {
  layout: LayoutDescriptor;
  files: TFile[];
  fileEntities: Map<string, TEntities>;
  selectedFileIds: Set<string>;
  createEntity: (entity: any, layoutFileId: string) => Entity;
}

interface CollectProjectedLayoutEntitiesResult {
  frameEntity: Entity;
  projectedEntities: Entity[];
}

export function collectProjectedLayoutEntities<
  TFile extends FileDescriptor,
  TEntities extends LayoutEntityCollection,
>({
  layout,
  files,
  fileEntities,
  selectedFileIds,
  createEntity,
}: CollectProjectedLayoutEntitiesOptions<TFile, TEntities>): CollectProjectedLayoutEntitiesResult | null {
  const context = resolveLayoutProjectionContext(layout, files, fileEntities);
  if (!context) {
    return null;
  }

  const { file, fileEntitiesData, transform } = context;
  const borderColor = selectedFileIds.has(file.id) ? "#6366f1" : "#4b5563";
  const frameEntity: Entity = {
    id: `frame-${layout.fileId}`,
    type: "POLYLINE",
    color: borderColor,
    strokeColor: borderColor,
    geometry: {
      points: createFramePolylinePoints(transform),
      closed: true,
    },
    isSelected: false,
    isHovered: false,
  };

  const projectedEntities = projectLayoutEntities(
    fileEntitiesData.entities,
    transform,
    (entity) => createEntity(entity, layout.fileId),
  );

  return { frameEntity, projectedEntities };
}
