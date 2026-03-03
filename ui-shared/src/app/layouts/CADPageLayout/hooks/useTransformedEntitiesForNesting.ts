import { useMemo } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { BoundingBox } from "../../../components/CAD/types/BoundingBox";
import type { NestingPart } from "../../../components/CAD/types/NestingTypes";
import {
  mirrorEntity,
  rotateEntity,
  translateEntity,
} from "../../../utils/entityTransform";
import { asNonEmptyString, type FileData } from "../CADPageLayout.file-utils";

interface FileLayout {
  fileId: string;
  offsetX: number;
  offsetY: number;
  boundingBox: BoundingBox;
}

interface UseTransformedEntitiesForNestingOptions {
  files: FileData[];
  isNestingMode: boolean;
  layoutEntities: Entity[];
  layoutFileLayouts: FileLayout[];
  nestingPartsCount: number;
  visibleParts: NestingPart[];
}

export function useTransformedEntitiesForNesting({
  files,
  isNestingMode,
  layoutEntities,
  layoutFileLayouts,
  nestingPartsCount,
  visibleParts,
}: UseTransformedEntitiesForNestingOptions) {
  return useMemo(() => {
    if (!isNestingMode) {
      return layoutEntities;
    }

    if (visibleParts.length === 0 && nestingPartsCount > 0) {
      return [];
    }

    const partTransformMap = new Map<
      string,
      {
        position: { x: number; y: number };
        rotation: number;
        mirroredX: boolean;
        mirroredY: boolean;
      }
    >();
    const visibleOwnerIds = new Set<string>();
    const partIdToFileId = new Map<string, string>();
    const fileIdToPartId = new Map<string, string>();

    files.forEach((file) => {
      if (file.type !== "PRTS") return;
      const partId = file.partId || file.id;
      partIdToFileId.set(partId, file.id);
      fileIdToPartId.set(file.id, partId);
    });

    for (const part of visibleParts) {
      const partId = String(part.id);
      visibleOwnerIds.add(partId);
      partTransformMap.set(partId, {
        position: part.position,
        rotation: part.rotation,
        mirroredX: !!part.mirroredX,
        mirroredY: !!part.mirroredY,
      });
      const mappedFileId = partIdToFileId.get(partId);
      if (mappedFileId) {
        visibleOwnerIds.add(mappedFileId);
      }
    }

    const fileLayoutMap = new Map<
      string,
      { offsetX: number; offsetY: number; boundingBox: BoundingBox }
    >();
    for (const fileLayout of layoutFileLayouts) {
      fileLayoutMap.set(fileLayout.fileId, {
        offsetX: fileLayout.offsetX,
        offsetY: fileLayout.offsetY,
        boundingBox: fileLayout.boundingBox,
      });
    }

    const collectEntityOwnerIds = (entity: Entity): string[] => {
      const ids = new Set<string>();
      const add = (value: unknown) => {
        const id = asNonEmptyString(value);
        if (id) ids.add(id);
      };

      add(entity.fileId);
      if (entity.id.includes("-")) {
        add(entity.id.split("-")[0]);
      }
      if (Array.isArray(entity.partIds)) {
        entity.partIds.forEach((partId) => add(partId));
      }

      Array.from(ids).forEach((id) => {
        const mappedPartId = fileIdToPartId.get(id);
        if (mappedPartId) ids.add(mappedPartId);
        const mappedFileId = partIdToFileId.get(id);
        if (mappedFileId) ids.add(mappedFileId);
      });

      return Array.from(ids);
    };

    return layoutEntities
      .filter((entity) => {
        const ownerIds = collectEntityOwnerIds(entity);
        if (ownerIds.length === 0) return true;
        return ownerIds.some((ownerId) => visibleOwnerIds.has(ownerId));
      })
      .map((entity) => {
        const ownerIds = collectEntityOwnerIds(entity);
        const transformPartId =
          ownerIds.find((ownerId) => partTransformMap.has(ownerId)) ||
          ownerIds
            .map((ownerId) => fileIdToPartId.get(ownerId))
            .find(
              (ownerId): ownerId is string =>
                Boolean(ownerId) && partTransformMap.has(ownerId),
            );

        const fileId =
          ownerIds.find((ownerId) => fileLayoutMap.has(ownerId)) ||
          (transformPartId ? partIdToFileId.get(transformPartId) : undefined) ||
          asNonEmptyString(entity.fileId) ||
          (entity.id.includes("-") ? entity.id.split("-")[0] : undefined);

        let result = fileId ? { ...entity, fileId } : { ...entity };

        const transform = transformPartId
          ? partTransformMap.get(transformPartId)
          : undefined;
        const layoutInfo =
          (fileId ? fileLayoutMap.get(fileId) : undefined) ||
          (transformPartId ? fileLayoutMap.get(transformPartId) : undefined);
        if (!transform || !layoutInfo) return result;

        if (
          transform.position.x === 0 &&
          transform.position.y === 0 &&
          transform.rotation === 0
        ) {
          return result;
        }

        const centerX =
          layoutInfo.offsetX +
          (layoutInfo.boundingBox.minX + layoutInfo.boundingBox.maxX) / 2;
        const centerY =
          layoutInfo.offsetY +
          (layoutInfo.boundingBox.minY + layoutInfo.boundingBox.maxY) / 2;

        if (transform.rotation !== 0) {
          result = rotateEntity(result, (transform.rotation * Math.PI) / 180, {
            x: centerX,
            y: centerY,
          });
        }

        if (transform.mirroredX) {
          result = mirrorEntity(
            result,
            { x: centerX, y: centerY - 100 },
            { x: centerX, y: centerY + 100 },
          );
        }
        if (transform.mirroredY) {
          result = mirrorEntity(
            result,
            { x: centerX - 100, y: centerY },
            { x: centerX + 100, y: centerY },
          );
        }

        if (transform.position.x !== 0 || transform.position.y !== 0) {
          result = translateEntity(
            result,
            transform.position.x,
            transform.position.y,
          );
        }
        return result;
      });
  }, [
    files,
    isNestingMode,
    layoutEntities,
    layoutFileLayouts,
    nestingPartsCount,
    visibleParts,
  ]);
}
