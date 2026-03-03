import { useCallback } from 'react';
import { detectContours } from '../utils/geometry/contourDetection';
import { executeEditCommand, EditCommandRequest, EditCommandResponse } from '../services/api';
import { EditOperation, Entity, Part, Point } from '../types/editing';
import { AddEditOperation, CurrentEditOperation, EntitiesUpdatedCallback } from './EditContext.types';

type UseEditCommandsParams = {
  onEntitiesUpdated: EntitiesUpdatedCallback;
  addOperation: AddEditOperation;
  clearSelection: () => void;
  setEditOperation: (operation: CurrentEditOperation) => void;
  addPart: (part: Part) => void;
};

export function useEditCommands({
  onEntitiesUpdated,
  addOperation,
  clearSelection,
  setEditOperation,
  addPart,
}: UseEditCommandsParams) {
  const executeTrim = useCallback(async (
    fileId: string,
    entityId: string,
    boundaryEntityId: string | null | undefined,
    clickPoint: Point,
  ) => {
    try {
      const request: EditCommandRequest = {
        fileId,
        command: 'trim',
        params: { entityId, clickPoint },
      };
      if (typeof boundaryEntityId === 'string' && boundaryEntityId.trim().length > 0) {
        request.params.targetEntityId = boundaryEntityId.trim();
      }

      const response = await executeEditCommand(request);
      if (response.success) {
        onEntitiesUpdated(response.updatedEntities || [], response.deletedEntityIds || []);
        addOperation({
          id: `trim-${Date.now()}`,
          type: 'trim',
          timestamp: Date.now(),
          entityId,
          previousState: {},
          newState: { updatedEntities: response.updatedEntities },
          description: `修剪实体 ${entityId}`,
        });
        setEditOperation({ step: null, boundaryEntityId: null });
      } else {
        console.error('❌ Trim failed:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ Trim error:', error);
      return {
        success: false,
        message: '修剪操作失败',
      } as EditCommandResponse;
    }
  }, [onEntitiesUpdated, addOperation, setEditOperation]);

  const executeExtend = useCallback(async (
    fileId: string,
    entityId: string,
    targetEntityId: string | null | undefined,
    clickPoint: Point,
  ) => {
    try {
      const request: EditCommandRequest = {
        fileId,
        command: 'extend',
        params: { entityId, clickPoint },
      };
      if (typeof targetEntityId === 'string' && targetEntityId.trim().length > 0) {
        request.params.targetEntityId = targetEntityId.trim();
      }

      const response = await executeEditCommand(request);
      if (response.success) {
        onEntitiesUpdated(response.updatedEntities || [], response.deletedEntityIds || []);
        addOperation({
          id: `extend-${Date.now()}`,
          type: 'extend',
          timestamp: Date.now(),
          entityId,
          previousState: {},
          newState: { updatedEntities: response.updatedEntities },
          description: `延长实体 ${entityId}`,
        });
        setEditOperation({ step: null, boundaryEntityId: null });
      } else {
        console.error('❌ Extend failed:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ Extend error:', error);
      return {
        success: false,
        message: '延长操作失败',
      } as EditCommandResponse;
    }
  }, [onEntitiesUpdated, addOperation, setEditOperation]);

  const executeDelete = useCallback(async (fileId: string, entityIds: string[]) => {
    try {
      const normalizedEntityIds = Array.from(
        new Set(
          entityIds
            .map((entityId) => String(entityId ?? '').trim())
            .filter((entityId) => entityId.length > 0),
        ),
      );
      if (normalizedEntityIds.length === 0) {
        return {
          success: false,
          message: 'missing entity id',
          updatedEntities: [],
          deletedEntityIds: [],
          affectedEntityIds: [],
        } satisfies EditCommandResponse;
      }

      const response = await executeEditCommand({
        fileId,
        command: 'delete',
        params: { entityIds: normalizedEntityIds },
      });

      if (response.success) {
        onEntitiesUpdated(response.updatedEntities || [], response.deletedEntityIds || []);
        addOperation({
          id: `delete-${Date.now()}`,
          type: 'delete',
          timestamp: Date.now(),
          entityIds: normalizedEntityIds,
          previousState: {},
          newState: {},
          description: `删除 ${normalizedEntityIds.length} 个实体`,
        });
        clearSelection();
      } else {
        console.error('❌ Delete failed:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ Delete error:', error);
      return {
        success: false,
        message: '删除操作失败',
        updatedEntities: [],
        deletedEntityIds: [],
        affectedEntityIds: [],
      } satisfies EditCommandResponse;
    }
  }, [onEntitiesUpdated, addOperation, clearSelection]);

  const executeExplode = useCallback(async (fileId: string, entityId: string) => {
    try {
      const request: EditCommandRequest = {
        fileId,
        command: 'explode',
        params: { entityId },
      };

      const response = await executeEditCommand(request);
      if (response.success) {
        onEntitiesUpdated(response.updatedEntities || [], response.deletedEntityIds || []);
        addOperation({
          id: `explode-${Date.now()}`,
          type: 'explode',
          timestamp: Date.now(),
          entityId,
          previousState: {},
          newState: { updatedEntities: response.updatedEntities },
          description: `炸开实体 ${entityId}`,
        });
        clearSelection();
      } else {
        console.error('❌ Explode failed:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ Explode error:', error);
      return {
        success: false,
        message: '炸开操作失败',
        updatedEntities: [],
        deletedEntityIds: [],
        affectedEntityIds: [entityId],
      } satisfies EditCommandResponse;
    }
  }, [onEntitiesUpdated, addOperation, clearSelection]);

  const executeCreate = useCallback(async (fileId: string, entity: Entity) => {
    try {
      const request: EditCommandRequest = {
        fileId,
        command: 'create',
        params: {
          entityId: entity.id,
          entityData: entity,
        },
      };

      const response = await executeEditCommand(request);
      if (response.success) {
        onEntitiesUpdated(response.updatedEntities || [entity], []);
        addOperation({
          id: `create-${Date.now()}`,
          type: 'create',
          timestamp: Date.now(),
          entityId: entity.id,
          previousState: {},
          newState: { updatedEntities: [entity] },
          description: `创建实体 ${entity.type}`,
        });
      } else {
        console.error('❌ Create failed:', response.message);
      }

      return response;
    } catch (error) {
      console.error('❌ Create error:', error);
      return {
        success: false,
        message: '创建实体失败',
        updatedEntities: [],
        deletedEntityIds: [],
        affectedEntityIds: [],
      } satisfies EditCommandResponse;
    }
  }, [onEntitiesUpdated, addOperation]);

  const recognizeParts = useCallback(async (fileId: string, entities: Entity[]): Promise<Part[]> => {
    const detectionResult = detectContours(entities);
    const recognizedParts: Part[] = [];

    detectionResult.contours.forEach((contour, index) => {
      if (!contour.isClosed) return;

      const hue = (index * 137.508) % 360;
      const color = `hsla(${hue}, 70%, 60%, 0.3)`;
      const part: Part = {
        id: `part-${fileId}-${index}`,
        fileId,
        name: `零件 ${index + 1}`,
        contour,
        entityIds: contour.entityIds,
        bbox: contour.bbox,
        area: contour.area,
        color,
        createdAt: Date.now(),
      };

      recognizedParts.push(part);
      addPart(part);
    });

    addOperation({
      id: `recognize-${Date.now()}`,
      type: 'recognize',
      timestamp: Date.now(),
      entityIds: entities.map((entity) => entity.id),
      previousState: {},
      newState: { parts: recognizedParts },
      description: `识别了 ${recognizedParts.length} 个零件`,
    } as EditOperation);

    return recognizedParts;
  }, [addOperation, addPart]);

  return {
    executeTrim,
    executeExtend,
    executeDelete,
    executeExplode,
    executeCreate,
    recognizeParts,
  };
}
