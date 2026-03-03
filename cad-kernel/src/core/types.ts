import type {
  BoundarySource,
  TrimExtendCommand,
  TrimExtendEntityLike,
  TrimExtendErrorCode,
  TrimExtendPoint,
} from '../geometry/trimExtend';
import type { CadTextData } from '../text/types';

export type CadKernelPoint = { x: number; y: number };

export type CadKernelCommand =
  | 'trim'
  | 'extend'
  | 'delete'
  | 'explode'
  | 'create'
  | 'move'
  | 'update-text';

export type CadKernelCommandErrorCode =
  | TrimExtendErrorCode
  | 'UNSUPPORTED_COMMAND'
  | 'INVALID_PARAMS'
  | 'ENTITY_NOT_FOUND';

export type CadKernelEntity = TrimExtendEntityLike & {
  layerId?: string;
  style?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  partIds?: string[];
  isInnerContour?: boolean;
};

export type CadKernelCommandParams = {
  entityId?: string;
  entityIds?: string[];
  targetEntityId?: string;
  clickPoint?: TrimExtendPoint;
  delta?: CadKernelPoint;
  entityData?: Partial<CadKernelEntity>;
  textData?: Partial<CadTextData>;
};

export type CadKernelCommandRequest = {
  fileId: string;
  command: CadKernelCommand;
  params: CadKernelCommandParams;
  userId?: string | null;
};

export type CadKernelCommandResult = {
  success: boolean;
  command: CadKernelCommand;
  message: string;
  errorCode?: CadKernelCommandErrorCode;
  updatedEntities: CadKernelEntity[];
  deletedEntityIds: string[];
  affectedEntityIds: string[];
  nextEntities: CadKernelEntity[];
  boundaryEntityId?: string;
  boundarySource?: BoundarySource;
  intersectionPoint?: TrimExtendPoint;
  animationPoints?: CadKernelPoint[];
};

export type CadKernelExecuteOptions = {
  entities: CadKernelEntity[];
  trimExtendCommand?: (command: TrimExtendCommand, entities: TrimExtendEntityLike[], params: {
    targetEntityId: string;
    boundaryEntityId?: string;
    clickPoint: TrimExtendPoint;
  }) => {
    success: boolean;
    updatedEntity?: TrimExtendEntityLike;
    affectedEntityIds: string[];
    boundaryEntityId?: string;
    boundarySource?: BoundarySource;
    intersectionPoint?: TrimExtendPoint;
    errorCode?: TrimExtendErrorCode;
    message?: string;
  };
  makeEntityId?: (seed: string) => string;
};
