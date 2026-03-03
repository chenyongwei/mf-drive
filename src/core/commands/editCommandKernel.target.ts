import {
  computeExplodePlan,
  isExplodableType,
} from '../../geometry/explode';
import type { TextVectorizer } from '../../text';
import type {
  CadKernelCommandRequest,
  CadKernelCommandResult,
  CadKernelEntity,
} from '../types';
import {
  asTrimExtendEntities,
  buildResult,
  deepClone,
  invalidParams,
  normalizeType,
  toPoint,
  toSegmentEntity,
  type MakeEntityIdFn,
  type TrimExtendCommandFn,
} from './editCommandKernel.shared';

async function updateTextEntity(
  target: CadKernelEntity,
  request: CadKernelCommandRequest,
  textVectorizer: TextVectorizer,
): Promise<CadKernelEntity> {
  const geometry = (target.geometry ?? {}) as Record<string, unknown>;
  const position = toPoint(geometry.position) ?? { x: 0, y: 0 };
  const rawAttributes =
    target.attributes && typeof target.attributes === 'object'
      ? (target.attributes as Record<string, unknown>)
      : {};
  const existingTextData =
    rawAttributes.textData && typeof rawAttributes.textData === 'object'
      ? (rawAttributes.textData as Record<string, unknown>)
      : {};
  const incomingTextData =
    request.params.textData && typeof request.params.textData === 'object'
      ? request.params.textData
      : {};

  const vectorized = await textVectorizer.vectorize({
    userId: request.userId,
    position,
    textData: {
      ...existingTextData,
      ...incomingTextData,
      content: String(
        (incomingTextData as Record<string, unknown>).content ??
          existingTextData.content ??
          geometry.text ??
          '',
      ),
    },
  });

  return {
    ...deepClone(target),
    type: vectorized.textData.content.includes('\n') ? 'MTEXT' : 'TEXT',
    geometry: {
      ...geometry,
      position,
      text: vectorized.textData.content,
      height: vectorized.textData.fontSize,
      rotation: vectorized.textData.rotation,
    },
    attributes: {
      ...rawAttributes,
      textData: vectorized.textData,
      textRender: vectorized.textRender,
    },
  };
}

export async function handleUpdateTextCommand(
  request: CadKernelCommandRequest,
  entitiesById: Map<string, CadKernelEntity>,
  targetId: string,
  target: CadKernelEntity,
  textVectorizer: TextVectorizer,
): Promise<CadKernelCommandResult> {
  const command = request.command;
  const normalizedType = normalizeType(target.type);
  if (normalizedType !== 'TEXT' && normalizedType !== 'MTEXT') {
    return buildResult(command, entitiesById, {
      success: false,
      message: 'target is not TEXT/MTEXT',
      errorCode: 'UNSUPPORTED_TARGET',
      updatedEntities: [],
      deletedEntityIds: [],
      affectedEntityIds: [targetId],
    });
  }

  const updated = await updateTextEntity(target, request, textVectorizer);
  entitiesById.set(targetId, updated);
  return buildResult(command, entitiesById, {
    success: true,
    message: 'command update-text applied',
    updatedEntities: [deepClone(updated)],
    deletedEntityIds: [],
    affectedEntityIds: [targetId],
  });
}

export function handleExplodeCommand(
  request: CadKernelCommandRequest,
  entitiesById: Map<string, CadKernelEntity>,
  targetId: string,
  target: CadKernelEntity,
  makeEntityId: MakeEntityIdFn,
): CadKernelCommandResult {
  const command = request.command;
  if (!isExplodableType(target.type)) {
    return buildResult(command, entitiesById, {
      success: false,
      message: 'only LINE/CIRCLE/POLYLINE can explode',
      updatedEntities: [],
      deletedEntityIds: [],
      affectedEntityIds: [targetId],
    });
  }

  const explodePlan = computeExplodePlan(
    { id: target.id, type: target.type, geometry: target.geometry },
    Array.from(entitiesById.values()).map((entity) => ({
      id: entity.id,
      type: entity.type,
      geometry: entity.geometry,
    })),
  );

  if (!explodePlan || explodePlan.segments.length === 0) {
    return buildResult(command, entitiesById, {
      success: false,
      message: 'no explodable intersections found',
      updatedEntities: [],
      deletedEntityIds: [],
      affectedEntityIds: [targetId],
    });
  }

  const replacementEntities = explodePlan.segments.map((segment, index) =>
    toSegmentEntity(target, segment, index, makeEntityId),
  );

  entitiesById.delete(targetId);
  replacementEntities.forEach((entity) => {
    entitiesById.set(entity.id, entity);
  });

  return buildResult(command, entitiesById, {
    success: true,
    message: 'command explode applied',
    updatedEntities: replacementEntities.map((entity) => deepClone(entity)),
    deletedEntityIds: [targetId],
    affectedEntityIds: [targetId, ...replacementEntities.map((entity) => entity.id)],
    animationPoints: explodePlan.animationPoints.map((point) => ({ x: point.x, y: point.y })),
  });
}

export function handleTrimOrExtendCommand(
  request: CadKernelCommandRequest,
  entitiesById: Map<string, CadKernelEntity>,
  targetId: string,
  target: CadKernelEntity,
  trimExtendCommand: TrimExtendCommandFn,
): CadKernelCommandResult {
  const command = request.command;
  if (command !== 'trim' && command !== 'extend') {
    return invalidParams(command, entitiesById, 'command must be trim or extend');
  }

  const clickPoint = toPoint(request.params.clickPoint);
  if (!clickPoint) {
    return invalidParams(command, entitiesById, 'clickPoint is required');
  }

  const boundaryEntityId = String(request.params.targetEntityId ?? '').trim() || undefined;
  const trimExtendPlan = trimExtendCommand(
    command,
    asTrimExtendEntities(Array.from(entitiesById.values())),
    {
      targetEntityId: targetId,
      boundaryEntityId,
      clickPoint,
    },
  );

  if (!trimExtendPlan.success || !trimExtendPlan.updatedEntity) {
    return buildResult(command, entitiesById, {
      success: false,
      message: trimExtendPlan.message ?? `${command} failed`,
      errorCode: trimExtendPlan.errorCode,
      updatedEntities: [],
      deletedEntityIds: [],
      affectedEntityIds:
        trimExtendPlan.affectedEntityIds.length > 0
          ? trimExtendPlan.affectedEntityIds
          : [targetId],
      boundaryEntityId: trimExtendPlan.boundaryEntityId,
      boundarySource: trimExtendPlan.boundarySource,
      intersectionPoint: trimExtendPlan.intersectionPoint,
    });
  }

  const updatedTarget: CadKernelEntity = {
    ...deepClone(target),
    type: normalizeType(trimExtendPlan.updatedEntity.type ?? target.type),
    geometry: deepClone(trimExtendPlan.updatedEntity.geometry),
  };
  entitiesById.set(targetId, updatedTarget);

  return buildResult(command, entitiesById, {
    success: true,
    message: `command ${command} applied`,
    updatedEntities: [deepClone(updatedTarget)],
    deletedEntityIds: [],
    affectedEntityIds: [targetId],
    boundaryEntityId: trimExtendPlan.boundaryEntityId,
    boundarySource: trimExtendPlan.boundarySource,
    intersectionPoint: trimExtendPlan.intersectionPoint,
  });
}
