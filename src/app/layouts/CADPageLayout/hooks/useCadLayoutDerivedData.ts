import { useCallback, useMemo } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { useSimpleTilingLayout } from "../../../components/CAD/hooks/useSimpleTilingLayout";
import { useNestingVisibility } from "./useNestingVisibility";
import { useTransformedEntitiesForNesting } from "./useTransformedEntitiesForNesting";
import { usePartsForFilling } from "./usePartsForFilling";
import type { FileData } from "../CADPageLayout.file-utils";
import type { NestingLayoutViewMode } from "../../../components/CAD/types/NestingTypes";

interface UseCadLayoutDerivedDataOptions {
  files: FileData[];
  checkedFileIds: Set<string>;
  entitiesMap: Record<string, Entity[]>;
  selectedFileId: string | null;
  preferredLayoutAnchorFileId: string | null;
  selectedEntityIds: string[];
  hoveredEntityId: string | null;
  isNestingMode: boolean;
  layoutViewMode: NestingLayoutViewMode;
  plates: any[];
  selectedPlateIds: string[];
  nestingParts: any[];
  setShouldFitToView: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useCadLayoutDerivedData = ({
  files,
  checkedFileIds,
  entitiesMap,
  selectedFileId,
  preferredLayoutAnchorFileId,
  selectedEntityIds,
  hoveredEntityId,
  isNestingMode,
  layoutViewMode,
  plates,
  selectedPlateIds,
  nestingParts,
  setShouldFitToView,
}: UseCadLayoutDerivedDataOptions) => {
  const requestFitView = useCallback(() => {
    setShouldFitToView(true);
  }, [setShouldFitToView]);

  const filteredEntitiesMap = useMemo(() => {
    const filtered: Record<string, Entity[]> = {};
    checkedFileIds.forEach((fileId) => {
      if (entitiesMap[fileId]) filtered[fileId] = entitiesMap[fileId];
    });
    return filtered;
  }, [entitiesMap, checkedFileIds]);

  const checkedFiles = useMemo(
    () => files.filter((file) => checkedFileIds.has(file.id)),
    [files, checkedFileIds],
  );

  const layout = useSimpleTilingLayout({
    entitiesMap: filteredEntitiesMap,
    files: checkedFiles,
    selectedFileId,
    preferredAnchorFileId: preferredLayoutAnchorFileId,
    selectedEntityIds,
    hoveredEntityId,
  });

  const { visiblePlates, visibleParts, visibleContentBox } = useNestingVisibility({
    isNestingMode,
    layoutViewMode,
    layoutContentBox: layout.contentBox,
    plates,
    selectedPlateIds,
    nestingParts,
    onRequestFitView: requestFitView,
  });

  const transformedEntitiesForNesting = useTransformedEntitiesForNesting({
    files,
    isNestingMode,
    layoutEntities: layout.entities,
    layoutFileLayouts: layout.fileLayouts,
    nestingPartsCount: nestingParts.length,
    visibleParts,
  });

  const partsForFilling = usePartsForFilling({
    files,
    isNestingMode,
    layoutEntities: layout.entities,
  });

  return { layout, visiblePlates, visibleParts, visibleContentBox, transformedEntitiesForNesting, partsForFilling };
};
