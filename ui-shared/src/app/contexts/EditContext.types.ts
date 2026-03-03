import { EditMode, EditTool, EditState, EditOperation, Part, Entity, Point } from '../types/editing';
import { EditCommandResponse } from '../services/api';

export type CurrentEditOperation = {
  step: 'select_boundary' | 'select_target' | 'complete' | null;
  boundaryEntityId: string | null;
};

export interface EditContextType {
  editState: EditState;
  setMode: (mode: EditMode) => void;
  setTool: (tool: EditTool) => void;
  selectEntity: (entityId: string) => void;
  selectMultipleEntities: (entityIds: string[]) => void;
  clearSelection: () => void;
  hoverEntity: (entityId: string | null) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  parts: Map<string, Part>;
  setParts: (parts: Map<string, Part>) => void;
  addPart: (part: Part) => void;
  removePart: (partId: string) => void;
  updatePart: (partId: string, updates: Partial<Part>) => void;
  selectPart: (partId: string) => void;
  clearPartSelection: () => void;
  executeTrim: (
    fileId: string,
    entityId: string,
    boundaryEntityId: string | null | undefined,
    clickPoint: Point,
  ) => Promise<EditCommandResponse>;
  executeExtend: (
    fileId: string,
    entityId: string,
    targetEntityId: string | null | undefined,
    clickPoint: Point,
  ) => Promise<EditCommandResponse>;
  executeDelete: (fileId: string, entityIds: string[]) => Promise<EditCommandResponse>;
  executeExplode: (fileId: string, entityId: string) => Promise<EditCommandResponse>;
  executeCreate: (fileId: string, entity: Entity) => Promise<EditCommandResponse>;
  onEntitiesUpdated?: (updatedEntities: Record<string, unknown>[], deletedEntityIds: string[]) => void;
  setOnEntitiesUpdated: (
    callback: (updatedEntities: Record<string, unknown>[], deletedEntityIds: string[]) => void,
  ) => void;
  updateEntity: (entityId: string, newGeometry: Record<string, unknown>) => void;
  trimEntity: (entityId: string, boundaryEntityId: string, trimPoint: Record<string, unknown>) => void;
  extendEntity: (entityId: string, targetEntityId: string, extensionPoint: Record<string, unknown>) => void;
  recognizeParts: (fileId: string, entities: Entity[]) => Promise<Part[]>;
  editOperation: CurrentEditOperation;
  setEditOperation: (operation: CurrentEditOperation) => void;
}

export type AddEditOperation = (operation: EditOperation) => void;

export type EntitiesUpdatedCallback = (
  updatedEntities: Record<string, unknown>[],
  deletedEntityIds: string[],
) => void;
