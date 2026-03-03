import type {
  CadKernelCommandRequest,
  CadKernelCommandResult,
  CadKernelEntity,
  CadKernelPoint,
} from '../types';
import {
  buildResult,
  deepClone,
  invalidParams,
  normalizeId,
  normalizeType,
  resolveTargetIds,
  toPoint,
  type MakeEntityIdFn,
} from './editCommandKernel.shared';

function shiftPoint(point: unknown, delta: CadKernelPoint): CadKernelPoint | null {
  const parsed = toPoint(point);
  if (!parsed) {
    return null;
  }
  return { x: parsed.x + delta.x, y: parsed.y + delta.y };
}

function moveGeometry(entity: CadKernelEntity, delta: CadKernelPoint): CadKernelEntity {
  const moved = deepClone(entity);
  const geometry = (moved.geometry ?? {}) as Record<string, unknown>;
  const type = normalizeType(moved.type);

  if (type === 'LINE') {
    const start = shiftPoint(geometry.start, delta);
    const end = shiftPoint(geometry.end, delta);
    if (start && end) {
      moved.geometry = { ...geometry, start, end };
    }
    return moved;
  }

  if (type === 'CIRCLE' || type === 'ARC') {
    const center = shiftPoint(geometry.center, delta);
    if (center) {
      moved.geometry = { ...geometry, center };
    }
    return moved;
  }

  if (type === 'TEXT' || type === 'MTEXT') {
    const position = shiftPoint(geometry.position, delta);
    if (position) {
      moved.geometry = { ...geometry, position };
    }
    const attributes =
      moved.attributes && typeof moved.attributes === 'object'
        ? (moved.attributes as Record<string, unknown>)
        : null;
    if (!attributes) {
      return moved;
    }

    const textRender =
      attributes.textRender && typeof attributes.textRender === 'object'
        ? (attributes.textRender as Record<string, unknown>)
        : null;
    if (!textRender) {
      return moved;
    }

    const shiftBbox = (bboxRaw: unknown) => {
      if (!bboxRaw || typeof bboxRaw !== 'object') {
        return bboxRaw;
      }
      const bbox = bboxRaw as Record<string, unknown>;
      const minX = Number(bbox.minX);
      const minY = Number(bbox.minY);
      const maxX = Number(bbox.maxX);
      const maxY = Number(bbox.maxY);
      if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
        return bboxRaw;
      }
      return {
        ...bbox,
        minX: minX + delta.x,
        minY: minY + delta.y,
        maxX: maxX + delta.x,
        maxY: maxY + delta.y,
      };
    };

    attributes.textRender = {
      ...textRender,
      bbox: shiftBbox(textRender.bbox),
      localBBox: shiftBbox(textRender.localBBox),
    };
    moved.attributes = attributes;
    return moved;
  }

  const points = Array.isArray(geometry.points) ? geometry.points : [];
  if (points.length > 0) {
    moved.geometry = {
      ...geometry,
      points: points.map((point) => shiftPoint(point, delta) ?? point),
    };
  }
  return moved;
}

export function handleCreateCommand(
  request: CadKernelCommandRequest,
  entitiesById: Map<string, CadKernelEntity>,
  makeEntityId: MakeEntityIdFn,
): CadKernelCommandResult {
  const command = request.command;
  const rawEntity =
    request.params.entityData && typeof request.params.entityData === 'object'
      ? (deepClone(request.params.entityData) as Partial<CadKernelEntity>)
      : null;
  if (!rawEntity) {
    return invalidParams(command, entitiesById, 'entityData is required');
  }

  const nextId =
    normalizeId(rawEntity.id) || normalizeId(request.params.entityId) || makeEntityId('entity');
  if (!nextId) {
    return invalidParams(command, entitiesById, 'entity id is required');
  }

  const nextEntity: CadKernelEntity = {
    id: nextId,
    fileId: rawEntity.fileId ?? request.fileId,
    type: normalizeType(rawEntity.type ?? 'POLYLINE') || 'POLYLINE',
    layerId: rawEntity.layerId,
    geometry:
      rawEntity.geometry && typeof rawEntity.geometry === 'object'
        ? (rawEntity.geometry as Record<string, unknown>)
        : {},
    style:
      rawEntity.style && typeof rawEntity.style === 'object'
        ? (rawEntity.style as Record<string, unknown>)
        : undefined,
    attributes:
      rawEntity.attributes && typeof rawEntity.attributes === 'object'
        ? (rawEntity.attributes as Record<string, unknown>)
        : undefined,
    partIds: Array.isArray(rawEntity.partIds)
      ? rawEntity.partIds.map((id) => String(id))
      : undefined,
    isInnerContour: Boolean(rawEntity.isInnerContour),
  };

  entitiesById.set(nextEntity.id, nextEntity);
  return buildResult(command, entitiesById, {
    success: true,
    message: 'command create applied',
    updatedEntities: [deepClone(nextEntity)],
    deletedEntityIds: [],
    affectedEntityIds: [nextEntity.id],
  });
}

export function handleDeleteCommand(
  request: CadKernelCommandRequest,
  entitiesById: Map<string, CadKernelEntity>,
): CadKernelCommandResult {
  const command = request.command;
  const targets = resolveTargetIds(request.params);
  if (targets.length === 0) {
    return invalidParams(command, entitiesById, 'entityId or entityIds is required');
  }

  const deletedEntityIds: string[] = [];
  targets.forEach((id) => {
    if (entitiesById.delete(id)) {
      deletedEntityIds.push(id);
    }
  });

  return buildResult(command, entitiesById, {
    success: true,
    message: 'command delete applied',
    updatedEntities: [],
    deletedEntityIds,
    affectedEntityIds: targets,
  });
}

export function handleMoveCommand(
  request: CadKernelCommandRequest,
  entitiesById: Map<string, CadKernelEntity>,
): CadKernelCommandResult {
  const command = request.command;
  const delta = toPoint(request.params.delta);
  if (!delta) {
    return invalidParams(command, entitiesById, 'delta is required');
  }

  const targets = resolveTargetIds(request.params);
  if (targets.length === 0) {
    return invalidParams(command, entitiesById, 'entityId or entityIds is required');
  }

  const updated: CadKernelEntity[] = [];
  targets.forEach((targetId) => {
    const target = entitiesById.get(targetId);
    if (!target) {
      return;
    }
    const moved = moveGeometry(target, delta);
    entitiesById.set(targetId, moved);
    updated.push(deepClone(moved));
  });

  if (updated.length === 0) {
    return buildResult(command, entitiesById, {
      success: false,
      message: 'entity not found',
      errorCode: 'ENTITY_NOT_FOUND',
      updatedEntities: [],
      deletedEntityIds: [],
      affectedEntityIds: targets,
    });
  }

  return buildResult(command, entitiesById, {
    success: true,
    message: 'command move applied',
    updatedEntities: updated,
    deletedEntityIds: [],
    affectedEntityIds: targets,
  });
}
