import {
  Entity,
  convertEntitiesToTypedArray,
  convertToThickVertices,
} from '../../../lib/webgpu/EntityToVertices';
import { generatePartFillFromEntities } from '../../../lib/webgpu/PartFillGenerator';
import { transformEntity } from '../../../utils/entityTransform';
import { Transformation } from '@dxf-fix/shared/utils/geometry';

export interface RenderOptions {
  selectedEntityIds?: Set<string>;
  hoveredEntityId?: string | null;
  selectedPartIds?: string[];
  selectedPartId?: string | null;
  previewEntities?: Entity[];
  invalidPartIds?: Set<string>;
}

const toFloat32 = (vertices: any[]) => {
  const data = new Float32Array(vertices.length * 6);
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    data[i * 6 + 0] = v.x;
    data[i * 6 + 1] = v.y;
    data[i * 6 + 2] = v.r;
    data[i * 6 + 3] = v.g;
    data[i * 6 + 4] = v.b;
    data[i * 6 + 5] = v.a;
  }
  return data;
};

const buildPartTransformations = (part: any): Transformation[] => {
  const pivot = {
    x: (part.boundingBox.minX + part.boundingBox.maxX) / 2,
    y: (part.boundingBox.minY + part.boundingBox.maxY) / 2,
  };

  const transformations: Transformation[] = [];

  if (part.mirroredX || part.mirroredY) {
    transformations.push({
      type: 'scale',
      scale: {
        sx: part.mirroredX ? -1 : 1,
        sy: part.mirroredY ? -1 : 1,
      },
      origin: pivot,
    });
  }

  if (part.rotation && part.rotation !== 0) {
    transformations.push({
      type: 'rotate',
      rotation: {
        angle: (part.rotation * Math.PI) / 180,
        origin: pivot,
      },
    });
  }

  if (part.position.x !== 0 || part.position.y !== 0) {
    transformations.push({
      type: 'translate',
      translation: { dx: part.position.x, dy: part.position.y },
    });
  }

  return transformations;
};

const applyPartTransforms = (part: any) => {
  const transformations = buildPartTransformations(part);
  return part.entities.map((entity: any) => (
    transformations.length > 0 ? transformEntity(entity, transformations) : entity
  ));
};

export const buildStaticVertexData = (
  entities: Entity[],
  partsForFilling: any[],
  theme: 'dark' | 'light',
): Float32Array => {
  if (!partsForFilling || partsForFilling.length === 0) {
    return convertEntitiesToTypedArray(entities, theme);
  }

  const allVertices: any[] = [];
  const partEntityIds = new Set<string>();

  for (const part of partsForFilling) {
    if (!part.entities) continue;
    for (const entity of part.entities) {
      partEntityIds.add(entity.id);
    }
  }

  const nonPartEntities = entities.filter((entity) => !partEntityIds.has(entity.id));
  allVertices.push(...convertEntitiesToTypedArray(nonPartEntities, theme));

  for (const part of partsForFilling) {
    if (!part.entities) continue;
    const transformedEntities = applyPartTransforms(part);
    allVertices.push(...convertEntitiesToTypedArray(transformedEntities, theme));
  }

  return new Float32Array(allVertices);
};

export const buildStaticFillBuffers = (
  parts: any[],
  theme: 'dark' | 'light',
  invalidPartIds?: Set<string>,
) => {
  const allOuterVertices: any[] = [];
  const allHoleVertices: any[] = [];

  for (const part of parts) {
    if (!part.entities || !part.color) continue;

    const transformedEntities = applyPartTransforms(part);
    const fillColor = invalidPartIds?.has(part.id)
      ? '#FF0000'
      : (part.color || (theme === 'dark' ? '#1a1a1c' : '#ffffff'));

    const result = generatePartFillFromEntities(transformedEntities, fillColor);
    if (result.outer) {
      allOuterVertices.push(...result.outer);
    }
    if (result.holes) {
      allHoleVertices.push(...result.holes);
    }
  }

  return {
    outerData: toFloat32(allOuterVertices),
    holeData: toFloat32(allHoleVertices),
    outerCount: allOuterVertices.length,
    holeCount: allHoleVertices.length,
  };
};

export const buildOverlayFillVertexData = (
  entities: Entity[],
  options: RenderOptions,
  theme: 'dark' | 'light',
  zoom: number,
): Float32Array | null => {
  if (entities.length === 0) {
    return null;
  }

  const relevantEntities = entities.filter((entity) => (
    options.selectedEntityIds?.has(entity.id) || options.hoveredEntityId === entity.id
  ));

  if (relevantEntities.length === 0) {
    return null;
  }

  const selectionEntities = relevantEntities.map((entity) => ({
    ...entity,
    isSelected: options.selectedEntityIds?.has(entity.id),
    isHovered: options.hoveredEntityId === entity.id,
  }));

  const thickVertices = convertToThickVertices(selectionEntities, theme, zoom);
  return toFloat32(thickVertices);
};
