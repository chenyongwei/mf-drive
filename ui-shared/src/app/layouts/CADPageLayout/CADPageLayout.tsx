import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEdit } from "../../contexts/EditContext";
import { useCollaboration } from "../../contexts/CollaborationContext";
import { useHistory } from "../../contexts/HistoryContext";
import {
  useNestingFeature,
  useDrawingFeature,
  useCommonFeature,
} from "../../contexts/FeatureFlagContext";
import { useViewport } from "../../contexts/ViewportContext";
import { DrawingFeature, NestingFeature, CommonFeature } from "../../components/Feature";
import { useAuthStore } from "../../store/authStore";
import { useCadEditController } from "./hooks/useCadEditController";
import { useCadSelectionController } from "./hooks/useCadSelectionController";
import { useCadOwnershipController } from "./hooks/useCadOwnershipController";
import { useCadToastController } from "./hooks/useCadToastController";
import { useCadPartMappings } from "./hooks/useCadPartMappings";
import { useCadExplodeAction } from "./hooks/useCadExplodeAction";
import { useCadToolpathActions } from "./hooks/useCadToolpathActions";
import { useCadHistoryAndShortcuts } from "./hooks/useCadHistoryAndShortcuts";
import { useCadFileRepository } from "./hooks/useCadFileRepository";
import { useCadFileNameDialog } from "./hooks/useCadFileNameDialog";
import { useCadNestingPartRuntime } from "./hooks/useCadNestingPartRuntime";
import { useCadEditEntitySync } from "./hooks/useCadEditEntitySync";
import { useCadPageState } from "./hooks/useCadPageState";
import { useCadPageLayoutViewModel } from "./hooks/useCadPageLayoutViewModel";
import { useCadLayoutDerivedData } from "./hooks/useCadLayoutDerivedData";
import { useCadPageControllers } from "./hooks/useCadPageControllers";
import { useCadE2EStateBridge } from "./hooks/useCadE2EStateBridge";
import { CADPageLayoutView } from "./view/CADPageLayoutView";
import { getStyles } from "./CADPageLayout.styles";
import type { NestingLayoutViewMode } from "../../components/CAD/types/NestingTypes";
import { buildRemainingPartSummary } from "./hooks/remainingPartSummary";
import {
  computePanToCenterBoundingBox,
  mergeFocusBoundingBoxes,
  getPlateBoundingBox,
  getPlatesBoundingBox,
  resolveFocusStrategy,
} from "./hooks/nestingViewportFocus";
import { toWorldBoundingBox } from "../../components/CAD/hooks/usePartNesting.placement.bounds";
import {
  areSetsEqual,
  areStringArraysEqualAsSet,
  buildFileToPartIds,
  buildPartToFileId,
  firstSelectedFileId,
  mapFileSelectionToPartIds,
  mapPartSelectionToFileIds,
  toggleListFileSelection,
} from "./hooks/nestingSelectionMapping";

export interface CADPageLayoutProps {
  initialMode?: "drawing" | "nesting";
  disableNesting?: boolean;
  disableDrawing?: boolean;
  allowedFileTypes?: ("DXF" | "PRTS" | "PDF")[];
  showFeatureToggle?: boolean;
}

const MIN_PART_QUANTITY = 1;
const MAX_PART_QUANTITY = 9999;

function clampPartQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_PART_QUANTITY;
  const integer = Math.floor(value);
  if (integer < MIN_PART_QUANTITY) return MIN_PART_QUANTITY;
  if (integer > MAX_PART_QUANTITY) return MAX_PART_QUANTITY;
  return integer;
}

function normalizePartSourceId(value: unknown): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return normalized.replace(/__copy-\d+$/u, "");
}

const CADPageLayout: React.FC<CADPageLayoutProps> = (props) => {
  const {
    initialMode = "drawing",
    disableNesting = false,
    disableDrawing = false,
    allowedFileTypes = ["DXF", "PRTS"],
    showFeatureToggle = true,
  } = props;

  const isNestingModeByFlag = useNestingFeature(NestingFeature.NESTING_MODE);
  const page = useCadPageState({ initialMode, isNestingModeByFlag });
  const selection = useCadSelectionController();
  const editController = useCadEditController();
  const { t, i18n } = useTranslation();
  const fileNameDialogState = useCadFileNameDialog();
  const ownership = useCadOwnershipController(page.selectedFileId);
  const toast = useCadToastController();
  const styles = useMemo(() => getStyles(page.theme), [page.theme]);
  const collaboration = useCollaboration();
  const history = useHistory();
  const edit = useEdit();
  const viewport = useViewport();
  const { user } = useAuthStore();
  const currentUsername = user?.email ? user.email.split("@")[0] : "User";
  const isEditFeatureEnabled = useDrawingFeature(DrawingFeature.EDIT);
  const isOperationHistoryEnabled = useCommonFeature(CommonFeature.OPERATION_HISTORY);
  const pendingListSelectionFocusRef = useRef(false);

  const getTestModeParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const testParams: string[] = [];
    if (params.get("test") === "true") testParams.push("test=true");
    const email = params.get("email");
    if (email) testParams.push(`email=${encodeURIComponent(email)}`);
    return testParams.length > 0 ? `?${testParams.join("&")}` : "";
  }, []);

  const getCanvasContainerSize = useCallback(() => {
    const container = document.querySelector<HTMLElement>('[data-testid="cad-canvas-pane"]');
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { width: rect.width, height: rect.height };
      }
    }
    return { width: Math.max(window.innerWidth, 1), height: Math.max(window.innerHeight, 1) };
  }, []);

  const focusSinglePlate = useCallback((plateId: string | null, forceFit = false) => {
    if (!plateId) return;
    const plate = page.plates.find((candidate) => candidate.id === plateId);
    if (!plate) return;

    const containerSize = getCanvasContainerSize();
    const box = getPlateBoundingBox(plate);
    const strategy = forceFit ? "fit" : resolveFocusStrategy(box, viewport.viewport, containerSize);

    if (strategy === "pan") {
      viewport.setViewport({
        zoom: viewport.viewport.zoom,
        pan: computePanToCenterBoundingBox(box, viewport.viewport, containerSize),
      });
      return;
    }

    viewport.fitToView(box, containerSize);
  }, [getCanvasContainerSize, page.plates, viewport]);

  const focusAllPlates = useCallback((plates = page.plates) => {
    const box = getPlatesBoundingBox(plates);
    if (!box) return;
    viewport.fitToView(box, getCanvasContainerSize());
  }, [getCanvasContainerSize, page.plates, viewport]);

  const handleLayoutViewModeChange = useCallback((mode: NestingLayoutViewMode) => {
    if (mode === page.layoutViewMode) return;

    if (mode === "single") {
      const remembered = page.lastSinglePlateId && page.plates.some((plate) => plate.id === page.lastSinglePlateId)
        ? page.lastSinglePlateId
        : null;
      const nextPlateId = remembered ?? page.selectedPlateIds[0] ?? page.plates[0]?.id ?? null;
      page.setLayoutViewMode("single");
      page.setSelectedPlateIds(nextPlateId ? [nextPlateId] : []);
      page.setLastSinglePlateId(nextPlateId);
      focusSinglePlate(nextPlateId, true);
      return;
    }

    const currentSingleId = page.selectedPlateIds[0] ?? page.lastSinglePlateId ?? null;
    page.setLayoutViewMode("multi");
    page.setLastSinglePlateId(currentSingleId);
    page.setSelectedPlateIds([]);
    focusAllPlates();
  }, [
    focusAllPlates,
    focusSinglePlate,
    page.lastSinglePlateId,
    page.layoutViewMode,
    page.plates,
    page.selectedPlateIds,
    page.setLastSinglePlateId,
    page.setLayoutViewMode,
    page.setSelectedPlateIds,
  ]);

  const handlePlateSelectionChange = useCallback((clickedPlateId: string, nextSelection: string[]) => {
    if (page.layoutViewMode === "single") {
      const nextPlateId = nextSelection[0] ?? clickedPlateId ?? null;
      page.setSelectedPlateIds(nextPlateId ? [nextPlateId] : []);
      page.setLastSinglePlateId(nextPlateId);
      focusSinglePlate(nextPlateId, true);
      return;
    }

    page.setSelectedPlateIds(nextSelection);
    focusSinglePlate(clickedPlateId, false);
  }, [
    focusSinglePlate,
    page.layoutViewMode,
    page.setLastSinglePlateId,
    page.setSelectedPlateIds,
  ]);

  const derived = useCadLayoutDerivedData({
    files: page.files,
    checkedFileIds: page.checkedFileIds,
    entitiesMap: page.entitiesMap,
    selectedFileId: page.selectedFileId,
    preferredLayoutAnchorFileId: page.preferredLayoutAnchorFileId,
    selectedEntityIds: selection.selectedEntityIds,
    hoveredEntityId: selection.hoveredEntityId,
    isNestingMode: page.isNestingMode,
    layoutViewMode: page.layoutViewMode,
    plates: page.plates,
    selectedPlateIds: page.selectedPlateIds,
    nestingParts: page.nestingParts,
    setShouldFitToView: page.setShouldFitToView,
  });

  const remainingPartSummary = useMemo(
    () =>
      buildRemainingPartSummary({
        files: page.files,
        checkedFileIds: page.checkedFileIds,
        nestingParts: page.nestingParts,
        isNestingMode: page.isNestingMode,
        layoutViewMode: page.layoutViewMode,
      }),
    [
      page.checkedFileIds,
      page.files,
      page.isNestingMode,
      page.layoutViewMode,
      page.nestingParts,
    ],
  );

  const fileToPartIds = useMemo(
    () => buildFileToPartIds(page.nestingParts),
    [page.nestingParts],
  );
  const partToFileId = useMemo(
    () => buildPartToFileId(page.nestingParts),
    [page.nestingParts],
  );
  const { partUnplacedCountByPartId, totalUnplacedCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    page.nestingParts.forEach((part) => {
      const sourcePartId = normalizePartSourceId(part.sourcePartId ?? part.id);
      if (!sourcePartId) return;

      const isPlaced = part.status === "placed" && Boolean(part.plateId);
      if (isPlaced) return;

      counts[sourcePartId] = (counts[sourcePartId] ?? 0) + 1;
      total += 1;
    });

    return {
      partUnplacedCountByPartId: counts,
      totalUnplacedCount: total,
    };
  }, [page.nestingParts]);
  const visiblePartsById = useMemo(() => {
    const map = new Map<string, (typeof derived.visibleParts)[number]>();
    derived.visibleParts.forEach((part) => {
      map.set(part.id, part);
    });
    return map;
  }, [derived.visibleParts]);

  const focusSelectedVisibleParts = useCallback((selectedPartIds: string[]) => {
    if (!page.isNestingMode || selectedPartIds.length === 0) return;

    const boxes = selectedPartIds
      .map((partId) => visiblePartsById.get(partId))
      .filter((part): part is (typeof derived.visibleParts)[number] => Boolean(part))
      .map((part) =>
        toWorldBoundingBox(part.boundingBox, part.position, {
          rotation: part.rotation,
          mirroredX: part.mirroredX,
          mirroredY: part.mirroredY,
        }),
      );
    const targetBox = mergeFocusBoundingBoxes(boxes);
    if (!targetBox) return;

    const containerSize = getCanvasContainerSize();
    const strategy = resolveFocusStrategy(targetBox, viewport.viewport, containerSize);
    if (strategy === "pan") {
      viewport.setViewport({
        zoom: viewport.viewport.zoom,
        pan: computePanToCenterBoundingBox(targetBox, viewport.viewport, containerSize),
      });
      return;
    }

    viewport.fitToView(targetBox, containerSize);
  }, [derived.visibleParts, getCanvasContainerSize, page.isNestingMode, viewport, visiblePartsById]);

  const toolpath = useCadToolpathActions({
    nestingParts: page.nestingParts,
    visiblePlates: derived.visiblePlates,
    plates: page.plates,
    partSpacing: page.nestingConfig.partSpacing,
    commonEdgeEnabled: page.nestingConfig.commonEdgeEnabled,
    getTestModeParams,
  });

  const handleAddPlate = useCallback(() => page.setIsPlatesModalOpen(true), [page.setIsPlatesModalOpen]);
  const handleRemovePlate = useCallback((id: string) => {
    const nextPlates = page.plates.filter((plate) => plate.id !== id);
    page.setPlates(nextPlates);
    page.setNestingParts((prev) =>
      prev.map((p) => {
        if (p.plateId === id) {
          return { ...p, status: "unplaced", plateId: null };
        }
        return p;
      }),
    );
    const filteredSelection = page.selectedPlateIds.filter((pid) => pid !== id);

    if (page.layoutViewMode === "single") {
      const fallbackPlateId = filteredSelection[0] ?? nextPlates[0]?.id ?? null;
      page.setSelectedPlateIds(fallbackPlateId ? [fallbackPlateId] : []);
      page.setLastSinglePlateId(fallbackPlateId);
      if (fallbackPlateId) {
        focusSinglePlate(fallbackPlateId, true);
      }
      return;
    }

    page.setSelectedPlateIds(filteredSelection);
    if (page.selectedPlateIds.length > 0) {
      page.setLastSinglePlateId(page.selectedPlateIds[0]);
    }
  }, [
    focusSinglePlate,
    page.layoutViewMode,
    page.plates,
    page.selectedPlateIds,
    page.setLastSinglePlateId,
    page.setNestingParts,
    page.setPlates,
    page.setSelectedPlateIds,
  ]);

  useEffect(() => {
    if (!page.isNestingMode || page.layoutViewMode !== "single") return;
    if (page.selectedPlateIds.length > 0) return;

    const remembered = page.lastSinglePlateId && page.plates.some((plate) => plate.id === page.lastSinglePlateId)
      ? page.lastSinglePlateId
      : null;
    const fallbackPlateId = remembered ?? page.plates[0]?.id ?? null;
    if (!fallbackPlateId) return;

    page.setSelectedPlateIds([fallbackPlateId]);
    page.setLastSinglePlateId(fallbackPlateId);
    focusSinglePlate(fallbackPlateId, true);
  }, [
    focusSinglePlate,
    page.isNestingMode,
    page.lastSinglePlateId,
    page.layoutViewMode,
    page.plates,
    page.selectedPlateIds,
    page.setLastSinglePlateId,
    page.setSelectedPlateIds,
  ]);

  const { collisionEngineRef } = useCadNestingPartRuntime({
    nestingParts: page.nestingParts,
    setNestingParts: page.setNestingParts,
    partsForFilling: derived.partsForFilling,
  });

  useCadEditEntitySync({
    setOnEntitiesUpdated: edit.setOnEntitiesUpdated,
    setEntitiesMap: page.setEntitiesMap,
    setSelectedEntityIds: selection.setSelectedEntityIds,
  });

  const { waitForDxfFileReady, refreshFileEntities, enqueueFileEdit, refreshPrtsFileList } =
    useCadFileRepository({
      files: page.files,
      setFiles: page.setFiles,
      setEntitiesMap: page.setEntitiesMap,
      setCheckedFileIds: page.setCheckedFileIds,
      setSelectedFileId: page.setSelectedFileId,
      setShouldFitToView: page.setShouldFitToView,
      setPreferredLayoutAnchorFileId: page.setPreferredLayoutAnchorFileId,
      shouldPreloadMockPrts: page.shouldPreloadMockPrts,
      selectedFileId: page.selectedFileId,
      getTestModeParams,
    });

  const handleFileCheck = useCallback(
    async (fileId: string | string[], isChecked: boolean) => {
      const ids = Array.isArray(fileId) ? fileId : [fileId];

      if (isChecked) {
        if (!page.selectedFileId && ids.length > 0) {
          page.setSelectedFileId(ids[0]);
        }

        page.setCheckedFileIds((prev) => {
          const newSet = new Set(prev);
          ids.forEach((id) => newSet.add(id));
          return newSet;
        });

        for (const id of ids) {
          if (!page.entitiesMap[id] || page.entitiesMap[id].length === 0) {
            await refreshFileEntities(id);
          }
        }
        page.setShouldFitToView(true);
      } else {
        page.setCheckedFileIds((prev) => {
          const newSet = new Set(prev);
          ids.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }
    },
    [
      page.selectedFileId,
      page.entitiesMap,
      page.setCheckedFileIds,
      page.setSelectedFileId,
      page.setShouldFitToView,
      refreshFileEntities,
    ],
  );

  const handleListFileSelect = useCallback(
    (
      fileId: string,
      ctx?: { additive: boolean; source: "row" | "rename" },
    ) => {
      if (!page.isNestingMode || page.activeTab !== "PRTS") {
        page.setSelectedFileId(fileId);
        page.setSelectedListFileIds(new Set([fileId]));
        return;
      }

      const nextSelectedFileIds = toggleListFileSelection(
        page.selectedListFileIds,
        fileId,
        Boolean(ctx?.additive),
      );
      const nextSelectedPartIds = mapFileSelectionToPartIds(
        nextSelectedFileIds,
        fileToPartIds,
      );
      const nextPrimaryFileId = firstSelectedFileId(nextSelectedFileIds);
      if (ctx?.source === "row") {
        pendingListSelectionFocusRef.current = true;
      }

      if (!areSetsEqual(page.selectedListFileIds, nextSelectedFileIds)) {
        page.setSelectedListFileIds(nextSelectedFileIds);
      }
      if (!areStringArraysEqualAsSet(page.selectedPartIds, nextSelectedPartIds)) {
        page.setSelectedPartIds(nextSelectedPartIds);
      }
      if (page.selectedFileId !== nextPrimaryFileId) {
        page.setSelectedFileId(nextPrimaryFileId);
      }
    },
    [
      fileToPartIds,
      page.activeTab,
      page.isNestingMode,
      page.selectedFileId,
      page.selectedListFileIds,
      page.selectedPartIds,
      page.setSelectedFileId,
      page.setSelectedListFileIds,
      page.setSelectedPartIds,
    ],
  );

  const handleListSelectionClear = useCallback(() => {
    if (!page.isNestingMode || page.activeTab !== "PRTS") return;
    pendingListSelectionFocusRef.current = false;
    page.setSelectedListFileIds(new Set());
    page.setSelectedPartIds([]);
    page.setSelectedFileId(null);
  }, [
    page.activeTab,
    page.isNestingMode,
    page.setSelectedFileId,
    page.setSelectedListFileIds,
    page.setSelectedPartIds,
  ]);

  const handleCadPartSelectionChange = useCallback((nextSelectedPartIds: string[]) => {
    if (!page.isNestingMode || page.activeTab !== "PRTS") return;
    pendingListSelectionFocusRef.current = false;

    const nextSelectedFileIds = mapPartSelectionToFileIds(
      nextSelectedPartIds,
      partToFileId,
    );
    const nextPrimaryFileId = firstSelectedFileId(nextSelectedFileIds);

    if (!areStringArraysEqualAsSet(page.selectedPartIds, nextSelectedPartIds)) {
      page.setSelectedPartIds(nextSelectedPartIds);
    }
    if (!areSetsEqual(page.selectedListFileIds, nextSelectedFileIds)) {
      page.setSelectedListFileIds(nextSelectedFileIds);
    }
    if (page.selectedFileId !== nextPrimaryFileId) {
      page.setSelectedFileId(nextPrimaryFileId);
    }
  }, [
    page.activeTab,
    page.isNestingMode,
    page.selectedFileId,
    page.selectedListFileIds,
    page.selectedPartIds,
    page.setSelectedFileId,
    page.setSelectedListFileIds,
    page.setSelectedPartIds,
    partToFileId,
  ]);

  useEffect(() => {
    if (!page.isNestingMode || page.activeTab !== "PRTS") return;
    const nextSelectedPartIds = mapFileSelectionToPartIds(
      page.selectedListFileIds,
      fileToPartIds,
    );
    if (!areStringArraysEqualAsSet(page.selectedPartIds, nextSelectedPartIds)) {
      page.setSelectedPartIds(nextSelectedPartIds);
    }
  }, [
    fileToPartIds,
    page.activeTab,
    page.isNestingMode,
    page.selectedListFileIds,
    page.selectedPartIds,
    page.setSelectedPartIds,
  ]);

  useEffect(() => {
    if (!pendingListSelectionFocusRef.current) return;
    if (page.selectedPartIds.length === 0) return;
    focusSelectedVisibleParts(page.selectedPartIds);
    pendingListSelectionFocusRef.current = false;
  }, [focusSelectedVisibleParts, page.selectedPartIds]);

  const handlePartQuantityChange = useCallback(
    async (partId: string, nextQuantity: number) => {
      const normalizedPartId = String(partId ?? "").trim();
      if (!normalizedPartId) return;

      let previousQuantity = MIN_PART_QUANTITY;
      let matched = false;
      page.files.forEach((file) => {
        if (file.type !== "PRTS") return;
        const filePartId = file.partId || file.id;
        if (filePartId !== normalizedPartId && file.id !== normalizedPartId) return;
        matched = true;
        previousQuantity = clampPartQuantity(file.quantity ?? MIN_PART_QUANTITY);
      });
      if (!matched) return;

      const normalizedNextQuantity = clampPartQuantity(nextQuantity);
      if (normalizedNextQuantity === previousQuantity) return;

      const applyQuantity = (quantity: number) => {
        page.setFiles((prev) =>
          prev.map((file) => {
            if (file.type !== "PRTS") return file;
            const filePartId = file.partId || file.id;
            if (filePartId !== normalizedPartId && file.id !== normalizedPartId) return file;
            return { ...file, quantity };
          }),
        );
      };

      applyQuantity(normalizedNextQuantity);

      try {
        const response = await fetch(
          `/api/nesting/parts/${encodeURIComponent(normalizedPartId)}/quantity${getTestModeParams()}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: normalizedNextQuantity }),
          },
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const errorMessage =
            typeof payload?.error === "string"
              ? payload.error
              : `更新数量失败（HTTP ${response.status}）`;
          throw new Error(errorMessage);
        }

        const payload = await response.json();
        const persistedQuantity = clampPartQuantity(Number(payload?.quantity));
        applyQuantity(persistedQuantity);
        toast.showPartActionToast(`零件数量已更新为 ${persistedQuantity}`, "success", 1400);
      } catch (error) {
        applyQuantity(previousQuantity);
        const errorMessage =
          error instanceof Error ? error.message : "更新数量失败，请稍后重试";
        toast.showPartActionToast(errorMessage, "error");
      }
    },
    [getTestModeParams, page.files, page.setFiles, toast],
  );

  const { applyRecognizedPartMappings, removeRecognizedPartMappings } =
    useCadPartMappings({ setEntitiesMap: page.setEntitiesMap });

  const { handleUndo, handleRedo, handleDeleteKey } = useCadHistoryAndShortcuts({
    selectedFileId: page.selectedFileId,
    collaboration,
    setNestingParts: page.setNestingParts as React.Dispatch<React.SetStateAction<any[]>>,
    refreshFileEntities,
    history,
    currentUsername,
    selectedEntityIds: selection.selectedEntityIds,
    layoutEntities: derived.layout.entities,
    showPartActionToast: toast.showPartActionToast,
    executeDelete: edit.executeDelete,
    setSelectedEntityIds: selection.setSelectedEntityIds,
    isNestingMode: page.isNestingMode,
    isEditMode: page.isEditMode,
    activeTool: editController.activeTool,
    pendingTrimExtend: editController.pendingTrimExtend,
    pendingCadAction: editController.pendingCadAction,
    setPendingTrimExtend: editController.setPendingTrimExtend,
    setPendingCadAction: editController.setPendingCadAction,
    setActiveTool: editController.setActiveTool,
  });

  const handleExplode = useCadExplodeAction({
    selectedEntityIds: selection.selectedEntityIds,
    layoutEntities: derived.layout.entities,
    fileLayouts: derived.layout.fileLayouts,
    entitiesMap: page.entitiesMap,
    executeExplode: edit.executeExplode,
    setSelectedEntityIds: selection.setSelectedEntityIds,
    setExplodeAnimationPoints: page.setExplodeAnimationPoints,
    showPartActionToast: toast.showPartActionToast,
  });

  const controllers = useCadPageControllers({
    ...page,
    ...selection,
    ...editController,
    ...ownership,
    ...fileNameDialogState,
    ...toolpath,
    allowedFileTypes,
    getTestModeParams,
    viewport,
    waitForDxfFileReady,
    refreshFileEntities,
    enqueueFileEdit,
    edit,
    history,
    layout: derived.layout,
    showPartActionToast: toast.showPartActionToast,
    handleExplode,
    t,
    refreshPrtsFileList,
    applyRecognizedPartMappings,
    removeRecognizedPartMappings,
    handleDeleteKey,
  });

  const viewModel = useCadPageLayoutViewModel({
    styles,
    showFeatureToggle,
    allowedFileTypes,
    i18n,
    page,
    selection,
    toolpath,
    ownership,
    fileNameDialogState,
    derived,
    controllers,
    editController,
    shortcuts: { handleUndo, handleRedo },
    toast,
    handleFileCheck,
    history,
    viewport,
    collisionEngineRef,
    isEditFeatureEnabled,
    isOperationHistoryEnabled,
    handleAddPlate,
    handleRemovePlate,
    handleListFileSelect,
    handleListSelectionClear,
    handleCadPartSelectionChange,
    partUnplacedCountByPartId,
    totalUnplacedCount,
    handlePartQuantityChange,
    onLayoutViewModeChange: handleLayoutViewModeChange,
    onPlateSelectionChange: handlePlateSelectionChange,
    remainingPartSummary,
    collaboration,
    currentUsername,
    user,
  });

  useCadE2EStateBridge({
    entities: derived.layout.entities,
    files: page.files,
    selectedEntityIds: selection.selectedEntityIds,
    hoveredEntityId: selection.hoveredEntityId,
    selectedPartIds: page.selectedPartIds,
    selectedListFileIds: Array.from(page.selectedListFileIds),
    activeTool: editController.activeTool,
    selectedFileId: page.selectedFileId,
    viewport: viewport.viewport,
    isNestingMode: page.isNestingMode,
  });

  return <CADPageLayoutView {...viewModel} />;
};

export default CADPageLayout;
