import type { ExplodeSegmentPlan } from '../../geometry/explode';
import type { TrimExtendEntityLike } from '../../geometry/trimExtend';
import type {
  CadKernelCommand,
  CadKernelCommandRequest,
  CadKernelCommandResult,
  CadKernelEntity,
  CadKernelExecuteOptions,
  CadKernelPoint,
} from '../types';

export type TrimExtendCommandFn = NonNullable<CadKernelExecuteOptions['trimExtendCommand']>;
export type MakeEntityIdFn = NonNullable<CadKernelExecuteOptions['makeEntityId']>;

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizeId(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeType(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

export function toPoint(value: unknown): CadKernelPoint | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as { x?: unknown; y?: unknown };
  const x = Number(candidate.x);
  const y = Number(candidate.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

export function resolveTargetIds(params: CadKernelCommandRequest['params']): string[] {
  return Array.from(
    new Set(
      [params.entityId, ...(params.entityIds ?? [])]
        .map((id) => normalizeId(id))
        .filter((id) => id.length > 0),
    ),
  );
}

export function createEntitiesById(entities: CadKernelEntity[]): Map<string, CadKernelEntity> {
  const entitiesById = new Map<string, CadKernelEntity>();
  entities.forEach((entity) => {
    entitiesById.set(entity.id, deepClone(entity));
  });
  return entitiesById;
}

export function asTrimExtendEntities(entities: CadKernelEntity[]): TrimExtendEntityLike[] {
  return entities.map((entity) => ({
    id: entity.id,
    fileId: entity.fileId,
    type: entity.type,
    geometry: entity.geometry,
  }));
}

export function buildResult(
  command: CadKernelCommand,
  entitiesById: Map<string, CadKernelEntity>,
  partial: Omit<CadKernelCommandResult, 'command' | 'nextEntities'>,
): CadKernelCommandResult {
  return {
    command,
    nextEntities: Array.from(entitiesById.values()).map((entity) => deepClone(entity)),
    ...partial,
  };
}

export function unsupported(
  command: CadKernelCommand,
  entitiesById: Map<string, CadKernelEntity>,
  message = `unsupported command: ${command}`,
): CadKernelCommandResult {
  return buildResult(command, entitiesById, {
    success: false,
    message,
    errorCode: 'UNSUPPORTED_COMMAND',
    updatedEntities: [],
    deletedEntityIds: [],
    affectedEntityIds: [],
  });
}

export function invalidParams(
  command: CadKernelCommand,
  entitiesById: Map<string, CadKernelEntity>,
  message: string,
): CadKernelCommandResult {
  return buildResult(command, entitiesById, {
    success: false,
    message,
    errorCode: 'INVALID_PARAMS',
    updatedEntities: [],
    deletedEntityIds: [],
    affectedEntityIds: [],
  });
}

export function toSegmentEntity(
  target: CadKernelEntity,
  segment: ExplodeSegmentPlan,
  index: number,
  makeEntityId: MakeEntityIdFn,
): CadKernelEntity {
  const id = makeEntityId(`${target.id}-explode-${index + 1}`);
  if (segment.type === 'LINE') {
    return {
      ...deepClone(target),
      id,
      type: 'LINE',
      geometry: {
        start: { ...segment.geometry.start },
        end: { ...segment.geometry.end },
      },
    };
  }

  return {
    ...deepClone(target),
    id,
    type: 'ARC',
    geometry: {
      center: { ...segment.geometry.center },
      radius: segment.geometry.radius,
      startAngle: segment.geometry.startAngle,
      endAngle: segment.geometry.endAngle,
    },
  };
}
