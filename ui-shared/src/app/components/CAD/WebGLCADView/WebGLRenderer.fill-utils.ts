import { generatePartFillFromEntities } from '../../../lib/webgpu/PartFillGenerator';
import type { Entity } from '../../../lib/webgpu/EntityToVertices';
import { transformEntity } from '../../../utils/entityTransform';
import type { Transformation } from '@dxf-fix/shared/utils/geometry';
import { flattenVertexColorData, type VertexColorPoint } from './WebGLRenderer.vertex-utils';
import type {
  FillDrawCommand,
  FillPart,
  FillPartBoundingBox,
  ThemeMode,
} from './WebGLRenderer.types';

export interface FillGeometryResult {
  data: Float32Array;
  vertexCount: number;
  drawCommands: FillDrawCommand[];
}

function asEntityArray(entities: unknown[]): Entity[] {
  return entities as Entity[];
}


function normalizeBoundingBox(part: FillPart): FillPartBoundingBox {
  const source = part.boundingBox;
  if (!source) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return {
    minX: Number.isFinite(source.minX) ? source.minX : 0,
    minY: Number.isFinite(source.minY) ? source.minY : 0,
    maxX: Number.isFinite(source.maxX) ? source.maxX : 0,
    maxY: Number.isFinite(source.maxY) ? source.maxY : 0,
  };
}

function normalizePosition(part: FillPart): { x: number; y: number } {
  const source = part.position;
  if (!source) {
    return { x: 0, y: 0 };
  }
  return {
    x: Number.isFinite(source.x) ? source.x : 0,
    y: Number.isFinite(source.y) ? source.y : 0,
  };
}

function buildTransformations(part: FillPart): Transformation[] {
  const transformations: Transformation[] = [];
  const bbox = normalizeBoundingBox(part);
  const pivot = {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
  };

  if (part.mirroredX || part.mirroredY) {
    transformations.push({
      type: 'scale',
      scale: { sx: part.mirroredX ? -1 : 1, sy: part.mirroredY ? -1 : 1 },
      origin: pivot,
    });
  }

  const rotation = Number(part.rotation ?? 0);
  if (Number.isFinite(rotation) && rotation !== 0) {
    transformations.push({
      type: 'rotate',
      rotation: { angle: (rotation * Math.PI) / 180, origin: pivot },
    });
  }

  const position = normalizePosition(part);
  if (position.x !== 0 || position.y !== 0) {
    transformations.push({
      type: 'translate',
      translation: { dx: position.x, dy: position.y },
    });
  }

  return transformations;
}

function normalizeInvalidPartIds(invalidPartIds: Set<string> | undefined): string[] {
  if (invalidPartIds && invalidPartIds.size > 0) {
    return Array.from(invalidPartIds).sort();
  }
  return [];
}

export function createFillSignature(
  parts: FillPart[],
  invalidPartIds: Set<string> | undefined,
): string {
  const key = parts
    .map(
      (part) =>
        `${part.id}|${part.rotation}|${part.position?.x}|${part.position?.y}|${part.entities?.length ?? 0}|${part.color}|${part.mirroredX ? 1 : 0}|${part.mirroredY ? 1 : 0}`,
    )
    .join(';');
  return `${key}|invalid:${normalizeInvalidPartIds(invalidPartIds).join(',')}`;
}

export function buildFillGeometry(
  parts: FillPart[],
  theme: ThemeMode,
  invalidPartIds: Set<string> | undefined,
): FillGeometryResult {
  const allFillVertices: VertexColorPoint[] = [];
  const drawCommands: FillDrawCommand[] = [];
  let currentStart = 0;

  for (const part of parts) {
    if (!Array.isArray(part.entities) || part.entities.length === 0) {
      continue;
    }

    const transformations = buildTransformations(part);
    const transformedEntities = asEntityArray(part.entities).map((entity) =>
      transformations.length > 0 ? transformEntity(entity, transformations) : entity,
    );

    const fillColor = invalidPartIds?.has(part.id)
      ? '#FF0000'
      : part.color || (theme === 'dark' ? '#1a1a1c' : '#ffffff');

    const generated = generatePartFillFromEntities(transformedEntities, fillColor) as {
      outer: VertexColorPoint[];
      holes: VertexColorPoint[];
    };
    if (!generated || generated.outer.length === 0) {
      continue;
    }

    const outerCount = generated.outer.length;
    const holeCount = generated.holes.length;

    allFillVertices.push(...generated.outer);
    if (holeCount > 0) {
      allFillVertices.push(...generated.holes);
    }

    drawCommands.push({
      outerStart: currentStart,
      outerCount,
      holeStart: currentStart + outerCount,
      holeCount,
    });
    currentStart += outerCount + holeCount;
  }

  return {
    data: flattenVertexColorData(allFillVertices),
    vertexCount: allFillVertices.length,
    drawCommands,
  };
}
