import { useCallback } from "react";
import { useAnnotationSettings } from "../../../contexts/AnnotationSettingsContext";
import type { CADToolType } from "../../../components/CAD/CADToolPanel";
import { executeEditCommand } from "../../../services/api";
import { useCadDragHandlers } from "./useCadDragHandlers";
import { useCadFileUploadActions } from "./useCadFileUploadActions";
import { useCadInspectionActions } from "./useCadInspectionActions";
import { useCadOwnershipActions } from "./useCadOwnershipActions";
import { useCadSelectionModels } from "./useCadSelectionModels";
import { useCadTextUpdateAction } from "./useCadTextUpdateAction";
import { useCadTransformActions } from "./useCadTransformActions";
import { useCadTrimExtendActions } from "./useCadTrimExtendActions";
import { useNestingProcessRibbonActions } from "./useNestingProcessRibbonActions";
import { usePartRecognitionActions } from "./usePartRecognitionActions";
import { useCadViewFileUiHandlers } from "./useCadViewFileUiHandlers";

export const useCadPageControllers = (options: any) => {
  const handleIssueSelect = useCallback((issue: any) => {
    options.setHighlightedIssueId(issue.id);
    if (issue.location.radius) {
      options.viewport.setViewport({
        zoom: 2,
        pan: {
          x: -issue.location.position.x * 2 + window.innerWidth / 2,
          y: -issue.location.position.y * 2 + window.innerHeight / 2,
        },
      });
    }
  }, [options]);

  const handleHighlightEntities = useCallback(
    (entityIds: string[]) => options.setSelectedEntityIds(entityIds),
    [options],
  );

  const handleInspectionComplete = useCallback((result: any) => {
    options.setInspectionResult(result);
    options.setInspectionCoordinateSpace("local");
  }, [options]);

  const { handleFileUpload } = useCadFileUploadActions({
    allowedFileTypes: options.allowedFileTypes,
    getTestModeParams: options.getTestModeParams,
    waitForDxfFileReady: options.waitForDxfFileReady,
    refreshFileEntities: options.refreshFileEntities,
    setFiles: options.setFiles,
    setCheckedFileIds: options.setCheckedFileIds,
    setEntitiesMap: options.setEntitiesMap,
    setSelectedFileId: options.setSelectedFileId,
    setPreferredLayoutAnchorFileId: options.setPreferredLayoutAnchorFileId,
  });

  const ownership = useCadOwnershipActions({
    fileLayouts: options.layout.fileLayouts,
    files: options.files,
    ownershipDialog: options.ownershipDialog,
    closeOwnershipDialog: options.closeOwnershipDialog,
    openOwnershipDialog: options.openOwnershipDialog,
    requestFileName: options.requestFileName,
    enqueueFileEdit: options.enqueueFileEdit,
    executeCreate: options.edit.executeCreate,
    refreshFileEntities: options.refreshFileEntities,
    fetchHistoryState: options.history.fetchHistoryState,
    showPartActionToast: options.showPartActionToast,
    setFiles: options.setFiles,
    setCheckedFileIds: options.setCheckedFileIds,
    setSelectedFileId: options.setSelectedFileId,
    setPreferredLayoutAnchorFileId: options.setPreferredLayoutAnchorFileId,
    setActiveTab: options.setActiveTab,
    setEntitiesMap: options.setEntitiesMap,
    setShouldFitToView: options.setShouldFitToView,
  });

  const selection = useCadSelectionModels({
    layoutEntities: options.layout.entities,
    fileLayouts: options.layout.fileLayouts,
    selectedEntityIds: options.selectedEntityIds,
  });

  const handleApplyTextUpdate = useCadTextUpdateAction({
    selectedTextEntity: selection.selectedTextEntity,
    enqueueFileEdit: options.enqueueFileEdit,
    executeEditCommand,
    refreshFileEntities: options.refreshFileEntities,
    fetchHistoryState: options.history.fetchHistoryState,
    setSelectedEntityIds: options.setSelectedEntityIds,
  });

  const trimExtend = useCadTrimExtendActions({
    layoutEntities: options.layout.entities,
    activeTool: options.activeTool,
    pendingTrimExtend: options.pendingTrimExtend,
    setPendingTrimExtend: options.setPendingTrimExtend,
    setPendingCadAction: options.setPendingCadAction,
    setActiveTool: options.setActiveTool,
    setSelectedEntityIds: options.setSelectedEntityIds,
    selectedNonPartGraphicEntities: selection.selectedNonPartGraphicEntities,
    selectedTrimExtendEntity: selection.selectedTrimExtendEntity,
    hasEditableGraphicEntities: selection.hasEditableGraphicEntities,
    resolveClickPoint: selection.resolveClickPoint,
    isTrimExtendEditableEntity: selection.isTrimExtendEditableEntity,
    executeTrim: options.edit.executeTrim,
    executeExtend: options.edit.executeExtend,
    refreshFileEntities: options.refreshFileEntities,
    fetchHistoryState: options.history.fetchHistoryState,
    showPartActionToast: options.showPartActionToast,
    handleDeleteKey: options.handleDeleteKey,
    handleExplode: options.handleExplode,
  });

  const fileUi = useCadViewFileUiHandlers({
    setHoveredEntityId: options.setHoveredEntityId,
    setSelectedFileId: options.setSelectedFileId,
    setFiles: options.setFiles,
    checkedFileIds: options.checkedFileIds,
    fileLayouts: options.layout.fileLayouts,
    viewport: options.viewport,
    shouldFitToView: options.shouldFitToView,
    setShouldFitToView: options.setShouldFitToView,
    setActiveTab: options.setActiveTab,
    setSelectedEntityIds: options.setSelectedEntityIds,
    handleFileUpload,
  });

  const transform = useCadTransformActions({
    viewport: options.viewport,
    selectedEntityIds: options.selectedEntityIds,
    layoutEntities: options.layout.entities,
    setSelectedEntityIds: options.setSelectedEntityIds,
    setEntitiesMap: options.setEntitiesMap,
    isScaleMode: options.isScaleMode,
    setIsScaleMode: options.setIsScaleMode,
    t: options.t,
  });

  const inspection = useCadInspectionActions({
    files: options.files,
    checkedFileIds: options.checkedFileIds,
    selectedEntityIds: options.selectedEntityIds,
    getTestModeParams: options.getTestModeParams,
    setIsInspecting: options.setIsInspecting,
    setEntitiesMap: options.setEntitiesMap,
    setInspectionResult: options.setInspectionResult,
    setInspectionCoordinateSpace: options.setInspectionCoordinateSpace,
  });

  const partRecognition = usePartRecognitionActions({
    files: options.files,
    selectedFileId: options.selectedFileId,
    checkedFileIds: options.checkedFileIds,
    selectedEntityIds: options.selectedEntityIds,
    layoutEntities: options.layout.entities,
    getTestModeParams: options.getTestModeParams,
    showPartActionToast: options.showPartActionToast,
    refreshPrtsFileList: options.refreshPrtsFileList,
    refreshFileEntities: options.refreshFileEntities,
    applyRecognizedPartMappings: options.applyRecognizedPartMappings,
    removeRecognizedPartMappings: options.removeRecognizedPartMappings,
    setSelectedEntityIds: options.setSelectedEntityIds,
    setInspectionResult: options.setInspectionResult,
    setInspectionCoordinateSpace: options.setInspectionCoordinateSpace,
  });

  const annotation = useAnnotationSettings();
  const handleToggleShowDimensions = useCallback(() => {
    if (options.isNestingMode) annotation.setShowDimensionsNesting(!annotation.showDimensionsNesting);
    else annotation.setShowDimensionsDrawing(!annotation.showDimensionsDrawing);
  }, [options.isNestingMode, annotation]);

  const ribbon = useNestingProcessRibbonActions({
    isNestingMode: options.isNestingMode,
    nestingProcessToolbarPrefs: options.nestingProcessToolbarPrefs,
    dispatchContext: {
      setNestingProcessToolbarPrefs: options.setNestingProcessToolbarPrefs,
      showPartActionToast: options.showPartActionToast,
      handleDimensionAction: transform.handleDimensionAction,
      handleTransformAction: transform.handleTransformAction,
      handleSelectAction: transform.handleSelectAction,
      handleTrimToolAction: trimExtend.handleTrimToolAction,
      handleExtendToolAction: trimExtend.handleExtendToolAction,
      handleOptimizeAction: transform.handleOptimizeAction,
      handleFixAll: inspection.handleFixAll,
      handleTriggerInspection: inspection.handleTriggerInspection,
      handleIdentifyPart: partRecognition.handleIdentifyPart,
      handleForceSetPart: partRecognition.handleForceSetPart,
      handleCancelPart: partRecognition.handleCancelPart,
      setActiveTool: options.setActiveTool,
      setPendingCadAction: options.setPendingCadAction,
      setPendingTrimExtend: options.setPendingTrimExtend,
      setActivePanel: options.setActivePanel,
      showDimensionsDrawing: annotation.showDimensionsDrawing,
      showDimensionsNesting: annotation.showDimensionsNesting,
      setShowDimensionsDrawing: annotation.setShowDimensionsDrawing,
      setShowDimensionsNesting: annotation.setShowDimensionsNesting,
      handleToggleShowDimensions,
      setNestingConfig: options.setNestingConfig,
      requestToolpathPlan: options.requestToolpathPlan,
      requestToolpathCheck: options.requestToolpathCheck,
      setToolpathOverrides: options.setToolpathOverrides,
      setToolpathPlan: options.setToolpathPlan,
      setShowToolpathOverlay: options.setShowToolpathOverlay,
      applyStartPointOverride: options.applyStartPointOverride,
      applyLeadOverride: options.applyLeadOverride,
      applySequenceOverride: options.applySequenceOverride,
      exportToolpathByPlan: options.exportToolpathByPlan,
    },
  });

  const handleCadToolSelect = useCallback((tool: CADToolType) => {
    options.setActiveTool(tool);
    if (options.pendingCadAction) options.setPendingCadAction(null);
    if (tool === "trim" || tool === "extend") {
      options.setPendingTrimExtend(null);
      options.showPartActionToast(tool === "trim" ? "修剪：请选择目标对象" : "延伸：请选择目标对象", "info");
      return;
    }
    if (tool === "delete" || tool === "explode") {
      options.setPendingTrimExtend(null);
      options.showPartActionToast(tool === "delete" ? "删除：请选择目标对象" : "炸开：请选择目标对象", "info");
      return;
    }
    if (tool === "draw-text") {
      options.setPendingTrimExtend(null);
      if (!options.isNestingMode) options.setActivePanel("text");
      options.showPartActionToast("文字工具：点击画布放置后输入文字", "info");
      return;
    }
    if (options.pendingTrimExtend) options.setPendingTrimExtend(null);
  }, [options]);

  const drag = useCadDragHandlers({
    isScaleMode: options.isScaleMode,
    isNestingMode: options.isNestingMode,
    draggedEntityInfo: options.draggedEntityInfo,
    setDraggedEntityInfo: options.setDraggedEntityInfo,
    zoom: options.viewport.viewport.zoom,
    layoutEntities: options.layout.entities,
    fileLayouts: options.layout.fileLayouts,
    buildDefaultDrawingFileName: ownership.buildDefaultDrawingFileName,
    requestFileName: options.requestFileName,
    enqueueFileEdit: options.enqueueFileEdit,
    refreshFileEntities: options.refreshFileEntities,
    history: options.history,
    showPartActionToast: options.showPartActionToast,
    executeEditCommand,
    setEntitiesMap: options.setEntitiesMap,
    setFiles: options.setFiles,
    setCheckedFileIds: options.setCheckedFileIds,
    setSelectedFileId: options.setSelectedFileId,
    setShouldFitToView: options.setShouldFitToView,
  });

  return {
    handleIssueSelect,
    handleHighlightEntities,
    handleInspectionComplete,
    handleApplyTextUpdate,
    handleCadToolSelect,
    currentShowDimensions: options.isNestingMode ? annotation.showDimensionsNesting : annotation.showDimensionsDrawing,
    handleToggleShowDimensions,
    selectedTextEntity: selection.selectedTextEntity,
    hasEditableGraphicEntities: selection.hasEditableGraphicEntities,
    selectionBBox: transform.selectionBBox,
    handleScale: transform.handleScale,
    handleFixAll: inspection.handleFixAll,
    handleTriggerInspection: inspection.handleTriggerInspection,
    handleIdentifyPart: partRecognition.handleIdentifyPart,
    handleForceSetPart: partRecognition.handleForceSetPart,
    handleCancelPart: partRecognition.handleCancelPart,
    nestingProcessMenus: ribbon.nestingProcessMenus,
    nestingProcessPrimaryActionDefByOperation: ribbon.nestingProcessPrimaryActionDefByOperation,
    handleNestingProcessPinToggle: ribbon.handleNestingProcessPinToggle,
    handleRibbonAction: ribbon.handleRibbonAction,
    handleNestingProcessPrimaryClick: ribbon.handleNestingProcessPrimaryClick,
    handleEntityCreate: ownership.handleEntityCreate,
    confirmOwnershipDialog: ownership.confirmOwnershipDialog,
    onOwnershipDialogKeyDownCapture: ownership.onOwnershipDialogKeyDownCapture,
    handleSelectionChange: trimExtend.handleSelectionChange,
    handleEntitySelect: trimExtend.handleEntitySelect,
    handleTrimToolAction: trimExtend.handleTrimToolAction,
    handleExtendToolAction: trimExtend.handleExtendToolAction,
    handleDeleteToolAction: trimExtend.handleDeleteToolAction,
    handleExplodeToolAction: trimExtend.handleExplodeToolAction,
    handleEntityHover: fileUi.handleEntityHover,
    handleFileSelect: fileUi.handleFileSelect,
    handleFileRename: fileUi.handleFileRename,
    handleZoomToSelection: fileUi.handleZoomToSelection,
    handleTabChange: fileUi.handleTabChange,
    handleFileInput: fileUi.handleFileInput,
    ...drag,
  };
};
