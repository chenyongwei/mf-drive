import { useCallback, useMemo } from "react";
import type {
  EntityClickContext,
} from "../../../components/CAD/types/CADCanvasTypes";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import {
  isNonPartGraphicEntityCandidate,
  isTextCadEntity,
  type Point2D,
} from "../CADPageLayout.file-utils";
import {
  isTrimExtendEditableEntity as isTrimExtendEditableEntityUtil,
  resolveClickPoint as resolveClickPointUtil,
} from "../CADPageLayout.trim-extend-utils";

interface FileLayoutLike {
  fileId: string;
  offsetX: number;
  offsetY: number;
}

interface UseCadSelectionModelsOptions {
  layoutEntities: Entity[];
  fileLayouts: FileLayoutLike[];
  selectedEntityIds: string[];
}

export function useCadSelectionModels({
  layoutEntities,
  fileLayouts,
  selectedEntityIds,
}: UseCadSelectionModelsOptions) {
  const resolveClickPoint = useCallback(
    (entity: Entity, clickContext?: EntityClickContext): Point2D =>
      resolveClickPointUtil(fileLayouts, entity, clickContext),
    [fileLayouts],
  );

  const isTrimExtendEditableEntity = useCallback(
    (entity: Entity) => isTrimExtendEditableEntityUtil(entity),
    [],
  );

  const nonPartGraphicEntities = useMemo(
    () =>
      layoutEntities.filter((entity) => isNonPartGraphicEntityCandidate(entity)),
    [layoutEntities],
  );

  const selectedNonPartGraphicEntities = useMemo(
    () =>
      selectedEntityIds
        .map((entityId) =>
          layoutEntities.find((candidate) => candidate.id === entityId),
        )
        .filter((candidate): candidate is Entity => Boolean(candidate))
        .filter((candidate) => isNonPartGraphicEntityCandidate(candidate)),
    [selectedEntityIds, layoutEntities],
  );

  const selectedTrimExtendEntity = useMemo(
    () =>
      selectedNonPartGraphicEntities.find((entity) =>
        isTrimExtendEditableEntity(entity),
      ) ?? null,
    [selectedNonPartGraphicEntities, isTrimExtendEditableEntity],
  );

  const selectedTextEntity = useMemo(() => {
    if (selectedEntityIds.length !== 1) {
      return null;
    }
    const candidate = layoutEntities.find(
      (entity) => entity.id === selectedEntityIds[0],
    );
    if (!candidate || !isTextCadEntity(candidate)) {
      return null;
    }
    return candidate;
  }, [selectedEntityIds, layoutEntities]);

  return {
    resolveClickPoint,
    isTrimExtendEditableEntity,
    nonPartGraphicEntities,
    selectedNonPartGraphicEntities,
    selectedTrimExtendEntity,
    selectedTextEntity,
    hasEditableGraphicEntities: nonPartGraphicEntities.length > 0,
  };
}
