import {
  computeExtendPlan,
  computeTrimPlan,
} from '../../geometry/trimExtend';
import { NoopTextVectorizer } from '../../text';
import type {
  CadKernelCommandRequest,
  CadKernelCommandResult,
  CadKernelExecuteOptions,
} from '../types';
import {
  handleCreateCommand,
  handleDeleteCommand,
  handleMoveCommand,
} from './editCommandKernel.mutation';
import {
  handleExplodeCommand,
  handleTrimOrExtendCommand,
  handleUpdateTextCommand,
} from './editCommandKernel.target';
import {
  buildResult,
  createEntitiesById,
  invalidParams,
  normalizeId,
  unsupported,
} from './editCommandKernel.shared';

const DEFAULT_TEXT_VECTORIZER = new NoopTextVectorizer();

export async function executeEditCommandKernel(
  request: CadKernelCommandRequest,
  options: CadKernelExecuteOptions,
): Promise<CadKernelCommandResult> {
  const command = request.command;
  const entitiesById = createEntitiesById(options.entities);

  const trimExtendCommand =
    options.trimExtendCommand ??
    ((kind, entities, params) =>
      kind === 'trim'
        ? computeTrimPlan({
            entities,
            targetEntityId: params.targetEntityId,
            boundaryEntityId: params.boundaryEntityId,
            clickPoint: params.clickPoint,
          })
        : computeExtendPlan({
            entities,
            targetEntityId: params.targetEntityId,
            boundaryEntityId: params.boundaryEntityId,
            clickPoint: params.clickPoint,
          }));

  const makeEntityId =
    options.makeEntityId ??
    ((seed: string) => `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  if (command === 'create') {
    return handleCreateCommand(request, entitiesById, makeEntityId);
  }

  if (command === 'delete') {
    return handleDeleteCommand(request, entitiesById);
  }

  if (command === 'move') {
    return handleMoveCommand(request, entitiesById);
  }

  const targetId = normalizeId(request.params.entityId);
  if (!targetId) {
    return invalidParams(command, entitiesById, 'entityId is required');
  }

  const target = entitiesById.get(targetId);
  if (!target) {
    return buildResult(command, entitiesById, {
      success: false,
      message: 'entity not found',
      errorCode: 'TARGET_NOT_FOUND',
      updatedEntities: [],
      deletedEntityIds: [],
      affectedEntityIds: [targetId],
    });
  }

  if (command === 'update-text') {
    return handleUpdateTextCommand(
      request,
      entitiesById,
      targetId,
      target,
      DEFAULT_TEXT_VECTORIZER,
    );
  }

  if (command === 'explode') {
    return handleExplodeCommand(request, entitiesById, targetId, target, makeEntityId);
  }

  if (command === 'trim' || command === 'extend') {
    return handleTrimOrExtendCommand(
      request,
      entitiesById,
      targetId,
      target,
      trimExtendCommand,
    );
  }

  return unsupported(command, entitiesById);
}
