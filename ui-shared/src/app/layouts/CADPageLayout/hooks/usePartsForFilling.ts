import { useMemo } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { NestingPart } from "../../../components/CAD/types/NestingTypes";
import { calculateBoundingBox as calculateEntitiesBBox } from "../../../utils/entityBBox";
import {
  buildDistinctPartTypeColorMap,
  getRandomPantoneColor,
} from "../CADPageLayout.styles";
import type { FileData } from "../CADPageLayout.file-utils";

interface UsePartsForFillingOptions {
  files: FileData[];
  isNestingMode: boolean;
  layoutEntities: Entity[];
}

function normalizeQuantity(value: number | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  const integer = Math.floor(parsed);
  if (integer < 1) return 1;
  if (integer > 9999) return 9999;
  return integer;
}

function getPartInstanceId(basePartId: string, instanceIndex: number): string {
  return instanceIndex === 0
    ? basePartId
    : `${basePartId}__copy-${instanceIndex + 1}`;
}

function resolvePartTypeKey(sourcePartId: string | undefined, partId: string): string {
  const sourceKey = typeof sourcePartId === "string" ? sourcePartId.trim() : "";
  if (sourceKey.length > 0) {
    return sourceKey;
  }
  return partId.trim() || partId;
}

function cloneEntitiesForInstance(
  entities: Entity[],
  fileId: string,
  sourcePartId: string,
  instanceId: string,
  instanceIndex: number,
): Entity[] {
  const suffix = instanceIndex === 0 ? "" : `__copy-${instanceIndex + 1}`;
  return entities.map((entity, entityIndex) => {
    const baseEntityId = String(entity.id ?? `${sourcePartId}-entity-${entityIndex + 1}`);
    return {
      ...entity,
      id: `${baseEntityId}${suffix}`,
      fileId,
      isPart: true,
      partIds: [instanceId],
    };
  });
}

export function usePartsForFilling({
  files,
  isNestingMode,
  layoutEntities,
}: UsePartsForFillingOptions) {
  return useMemo(() => {
    if (!layoutEntities || layoutEntities.length === 0) {
      return [];
    }

    const entitiesByFile: Record<string, Entity[]> = {};
    layoutEntities.forEach((entity) => {
      const fileId = entity.fileId || entity.id.split("-")[0];
      if (!entitiesByFile[fileId]) {
        entitiesByFile[fileId] = [];
      }
      entitiesByFile[fileId].push(entity);
    });

    const buildPart = (
      partId: string,
      entities: Entity[],
      color: string,
    ): NestingPart | null => {
      if (entities.length === 0) {
        return null;
      }
      const outerEntities = entities.filter((entity) => !entity.isInnerContour);
      const bbox = calculateEntitiesBBox(
        outerEntities.length > 0 ? outerEntities : entities,
      );
      if (!bbox) {
        return null;
      }
      return {
        id: partId,
        entities,
        color,
        position: { x: 0, y: 0 },
        rotation: 0,
        boundingBox: bbox,
        status: "unplaced",
        plateId: null,
        mirroredX: false,
        mirroredY: false,
      };
    };

    const prtsFiles = files.filter((file) => file.type === "PRTS");
    const partMap = new Map<string, NestingPart>();

    if (isNestingMode) {
      const parts: NestingPart[] = [];
      const typeKeys = prtsFiles.map((file) =>
        resolvePartTypeKey(file.partId || file.id, file.id),
      );
      const typeColorMap = buildDistinctPartTypeColorMap(typeKeys);
      prtsFiles.forEach((file) => {
        const sourcePartId = file.partId || file.id;
        const typeKey = resolvePartTypeKey(sourcePartId, file.id);
        const partColor =
          typeColorMap.get(typeKey) ?? getRandomPantoneColor(typeKey);
        const quantity = normalizeQuantity(file.quantity);
        const rawEntities = entitiesByFile[file.id] || [];
        for (let instanceIndex = 0; instanceIndex < quantity; instanceIndex += 1) {
          const instanceId = getPartInstanceId(sourcePartId, instanceIndex);
          const entities = cloneEntitiesForInstance(
            rawEntities,
            file.id,
            sourcePartId,
            instanceId,
            instanceIndex,
          );
          const part = buildPart(instanceId, entities, partColor);
          if (!part) continue;
          part.fileId = file.id;
          part.name = file.name;
          part.sourcePartId = sourcePartId;
          part.instanceIndex = instanceIndex;
          part.instanceCount = quantity;
          parts.push(part);
        }
      });
      return parts;
    }

    const dxfPartGroups = new Map<string, Entity[]>();
    layoutEntities.forEach((entity) => {
      const partIds = Array.isArray(entity.partIds)
        ? entity.partIds.filter(
            (partId): partId is string =>
              typeof partId === "string" && partId.trim().length > 0,
          )
        : [];
      partIds.forEach((partId) => {
        if (!dxfPartGroups.has(partId)) {
          dxfPartGroups.set(partId, []);
        }
        dxfPartGroups.get(partId)!.push({
          ...entity,
          isPart: true,
          partIds: entity.partIds ?? [partId],
        });
      });
    });

    dxfPartGroups.forEach((entities, partId) => {
      const part = buildPart(partId, entities, "#4A9EFF");
      if (part) {
        partMap.set(partId, part);
      }
    });

    prtsFiles.forEach((file) => {
      const partId = file.partId || file.id;
      if (partMap.has(partId)) {
        return;
      }
      const rawEntities = entitiesByFile[file.id] || [];
      const entities = rawEntities.map((entity) => ({
        ...entity,
        fileId: file.id,
        isPart: true,
        partIds: entity.partIds ?? [partId],
      }));
      const part = buildPart(partId, entities, "#4A9EFF");
      if (part) {
        partMap.set(partId, part);
      }
    });

    return Array.from(partMap.values());
  }, [files, isNestingMode, layoutEntities]);
}
