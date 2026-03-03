import { useCallback } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";

interface UseCadPartMappingsOptions {
  setEntitiesMap: (
    updater: (prev: Record<string, Entity[]>) => Record<string, Entity[]>,
  ) => void;
}

export function useCadPartMappings({
  setEntitiesMap,
}: UseCadPartMappingsOptions) {
  const applyRecognizedPartMappings = useCallback(
    (
      fileId: string,
      records: Array<{ partId?: string; sourceEntityIds?: string[] }>,
    ) => {
      if (!fileId || !Array.isArray(records) || records.length === 0) {
        return;
      }
      setEntitiesMap((prev) => {
        const fileEntities = prev[fileId];
        if (!fileEntities || fileEntities.length === 0) return prev;

        const entityToPartIds = new Map<string, Set<string>>();
        records.forEach((record) => {
          const partId = String(record.partId ?? "").trim();
          if (!partId) return;
          const sourceEntityIds = Array.isArray(record.sourceEntityIds)
            ? record.sourceEntityIds
            : [];
          sourceEntityIds.forEach((entityId) => {
            const normalizedId = String(entityId ?? "").trim();
            if (!normalizedId) return;
            if (!entityToPartIds.has(normalizedId)) {
              entityToPartIds.set(normalizedId, new Set<string>());
            }
            entityToPartIds.get(normalizedId)!.add(partId);
          });
        });
        if (entityToPartIds.size === 0) return prev;

        let hasChange = false;
        const nextFileEntities = fileEntities.map((entity) => {
          const partIdsToAdd = entityToPartIds.get(entity.id);
          if (!partIdsToAdd || partIdsToAdd.size === 0) return entity;
          const merged = new Set(entity.partIds ?? []);
          partIdsToAdd.forEach((partId) => merged.add(partId));
          hasChange = true;
          return {
            ...entity,
            isPart: true,
            partIds: Array.from(merged),
          };
        });
        if (!hasChange) return prev;
        return {
          ...prev,
          [fileId]: nextFileEntities,
        };
      });
    },
    [setEntitiesMap],
  );

  const removeRecognizedPartMappings = useCallback(
    (fileId: string, partIds: string[]) => {
      const normalizedPartIds = Array.isArray(partIds)
        ? partIds.map((partId) => String(partId ?? "").trim()).filter(Boolean)
        : [];
      if (!fileId || normalizedPartIds.length === 0) return;
      const removeSet = new Set(normalizedPartIds);

      setEntitiesMap((prev) => {
        const fileEntities = prev[fileId];
        if (!fileEntities || fileEntities.length === 0) return prev;
        let hasChange = false;

        const nextFileEntities = fileEntities.map((entity) => {
          const currentPartIds = Array.isArray(entity.partIds) ? entity.partIds : [];
          if (currentPartIds.length === 0) return entity;

          const nextPartIds = currentPartIds.filter((partId) => !removeSet.has(partId));
          if (nextPartIds.length === currentPartIds.length) return entity;
          hasChange = true;
          if (nextPartIds.length === 0) {
            return {
              ...entity,
              isPart: false,
              partIds: undefined,
            };
          }
          return {
            ...entity,
            isPart: true,
            partIds: nextPartIds,
          };
        });

        if (!hasChange) return prev;
        return {
          ...prev,
          [fileId]: nextFileEntities,
        };
      });
    },
    [setEntitiesMap],
  );

  return {
    applyRecognizedPartMappings,
    removeRecognizedPartMappings,
  };
}
