import { useEffect } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";

interface UseCadEditEntitySyncOptions {
  setOnEntitiesUpdated: (
    fn: ((updatedEntities: any[], deletedEntityIds: string[]) => void) | null,
  ) => void;
  setEntitiesMap: React.Dispatch<React.SetStateAction<Record<string, Entity[]>>>;
  setSelectedEntityIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useCadEditEntitySync = ({
  setOnEntitiesUpdated,
  setEntitiesMap,
  setSelectedEntityIds,
}: UseCadEditEntitySyncOptions) => {
  useEffect(() => {
    const onEntitiesUpdated = (updatedEntities: any[], deletedEntityIds: string[]) => {
      setEntitiesMap((prev) => {
        const newMap: Record<string, Entity[]> = { ...prev };
        const updatedByFile: Record<string, any[]> = {};
        updatedEntities.forEach((entity) => {
          const fileId = entity.fileId;
          if (!updatedByFile[fileId]) updatedByFile[fileId] = [];
          updatedByFile[fileId].push(entity);
        });
        Object.entries(updatedByFile).forEach(([fileId, entities]) => {
          const existingEntities = newMap[fileId] || [];
          const entityMap = new Map(existingEntities.map((e) => [e.id, e]));
          entities.forEach((entity) => entityMap.set(entity.id, entity));
          newMap[fileId] = Array.from(entityMap.values());
        });
        if (deletedEntityIds.length > 0) {
          Object.keys(newMap).forEach((fileId) => {
            newMap[fileId] = newMap[fileId].filter((entity) => !deletedEntityIds.includes(entity.id));
          });
        }
        return newMap;
      });
      if (deletedEntityIds.length > 0) setSelectedEntityIds([]);
    };
    setOnEntitiesUpdated(onEntitiesUpdated);
    return () => setOnEntitiesUpdated(null);
  }, [setOnEntitiesUpdated, setEntitiesMap, setSelectedEntityIds]);
};
