import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  usePartManipulation,
  useNestingOperations,
  usePartList,
  useNestResults,
  useUndoRedo,
} from './RibbonLayoutV2_hooks';
import {
  MaterialGroup,
  PageMode,
  ViewMode,
  DisplayMode,
  RibbonLayoutProps,
} from './RibbonLayoutV2_types';
import { calculateViewMode } from './RibbonLayoutV2_utils/helpers';
import { RibbonLayoutV2View } from './RibbonLayoutV2_view';
import { useRibbonLayoutV2Handlers } from './RibbonLayoutV2_handlers';
const RibbonLayoutV2: React.FC<RibbonLayoutProps> = ({ className = '' }) => {
  const [pageMode, setPageMode] = useState<PageMode>('normal');
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([
    { id: 'steel-3mm', material: 'Steel', thickness: 3, partCount: 0, totalQuantity: 0, nestedCount: 0, nestResultCount: 0, hasUnsavedChanges: false },
    { id: 'stainless-2mm', material: 'Stainless', thickness: 2, partCount: 0, totalQuantity: 0, nestedCount: 0, nestResultCount: 0, hasUnsavedChanges: false },
    { id: 'aluminum-1mm', material: 'Aluminum', thickness: 1, partCount: 0, totalQuantity: 0, nestedCount: 0, nestResultCount: 0, hasUnsavedChanges: false },
  ]);
  const [activeMaterialGroupId, setActiveMaterialGroupId] = useState<string>();
  const [hotkeys, setHotkeys] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('empty');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [leftPanelWidth, setLeftPanelWidth] = useState(288);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [hotkeyConfigOpen, setHotkeyConfigOpen] = useState(false);
  const [materialGroupDialogOpen, setMaterialGroupDialogOpen] = useState(false);
  const [nestingResultSelectorOpen, setNestingResultSelectorOpen] = useState(false);
  const [nestingResultsToSelect, setNestingResultsToSelect] = useState<any[]>([]);
  const [partSpacing, setPartSpacing] = useLocalStorage<number>('dxf-fix-part-spacing', 5);
  const [nestingSettings, setNestingSettings] = useState({ sheetWidth: 2000, sheetHeight: 1000, partSpacing: 5, margin: 20 });
  useEffect(() => {
    setNestingSettings((prev) => ({ ...prev, partSpacing }));
  }, [partSpacing]);
  const { history, historyIndex, addToHistory, handleUndo, handleRedo } = useUndoRedo();
  const partList = usePartList(activeMaterialGroupId, materialGroups, setMaterialGroups);
  const { parts, setParts, selectedPartIds, setSelectedPartIds, getFilteredParts } = partList;
  const { sortBy, setSortBy, sortOrder, setSortOrder } = partList.sorting;
  const { handleImportParts, handleDeleteParts, handleDuplicateParts } = partList.actions;
  const {
    nestResults,
    setNestResults,
    selectedResultIds,
    setSelectedResultIds,
    handleDeleteResults,
    handleDuplicateResult,
    handleLockResult,
    handleUpdateResultStatus,
  } = useNestResults(activeMaterialGroupId, setMaterialGroups);
  const {
    isNestingRunning,
    nestingProgress,
    nestingUtilization,
    handleStartNesting,
    handleStopNesting,
    handleOpenNestingSettings,
    handleManualNesting,
  } = useNestingOperations(
    parts,
    selectedPartIds,
    activeMaterialGroupId,
    nestingSettings,
    setMaterialGroups,
    setNestResults,
  );
  const {
    handleRotateLeft,
    handleRotateRight,
    handleMirrorHorizontal,
    handleMirrorVertical,
    handleZoomIn,
    handleZoomOut,
    handleFitToView,
    handleEditProperties,
  } = usePartManipulation(selectedPartIds, setParts, addToHistory);
  useEffect(() => {
    if (materialGroups.length > 0 && !activeMaterialGroupId) {
      setActiveMaterialGroupId(materialGroups[0].id);
    }
  }, [materialGroups, activeMaterialGroupId]);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        setLeftPanelWidth(Math.max(100, Math.min(e.clientX, window.innerWidth / 2)));
      }
      if (isResizingRight) {
        setRightPanelWidth(Math.max(100, Math.min(window.innerWidth - e.clientX, window.innerWidth / 2)));
      }
    };
    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);
  useEffect(() => {
    setViewMode(calculateViewMode(selectedResultIds, selectedPartIds));
  }, [selectedPartIds, selectedResultIds]);
  const handlePreprocessPage = useCallback(
    () => setPageMode((prev) => (prev === 'preprocess' ? 'normal' : 'preprocess')),
    []
  );
  const handleMaterialGroupSelect = useCallback((groupId: string) => {
    setActiveMaterialGroupId(groupId); setSelectedPartIds(new Set()); setSelectedResultIds(new Set());
  }, [setSelectedPartIds, setSelectedResultIds]);
  const handleCreateMaterialGroup = useCallback((material: string, thickness: number) => {
    const newGroup: MaterialGroup = {
      id: `material-${Date.now()}`,
      material,
      thickness,
      partCount: 0,
      totalQuantity: 0,
      nestedCount: 0,
      nestResultCount: 0,
      hasUnsavedChanges: true,
    };
    setMaterialGroups((prev) => [...prev, newGroup]);
    setActiveMaterialGroupId(newGroup.id);
  }, []);
  const handleGroupClose = useCallback((groupId: string) => {
    setMaterialGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeMaterialGroupId === groupId && materialGroups.length > 1) setActiveMaterialGroupId(materialGroups[0].id);
  }, [activeMaterialGroupId, materialGroups]);
  const handlers = useRibbonLayoutV2Handlers({
    getFilteredParts,
    setSelectedPartIds,
    setSelectedResultIds,
    nestingResultsToSelect,
    setNestResults,
    setNestingResultSelectorOpen,
    setNestingResultsToSelect,
    activeMaterialGroupId,
    setMaterialGroups,
    handleStartNesting,
    handleRotateLeft,
    handleRotateRight,
    handleMirrorHorizontal,
    handleMirrorVertical,
    handleZoomIn,
    handleZoomOut,
    handleFitToView,
    handleUndo,
    handleRedo,
    isNestingRunning,
    hotkeyConfigOpen,
    materialGroupDialogOpen,
    nestingResultSelectorOpen,
    setHotkeyConfigOpen,
    setMaterialGroupDialogOpen,
    materialGroups,
  });
  return (
    <RibbonLayoutV2View
      className={className}
      pageMode={pageMode}
      handlePreprocessPage={handlePreprocessPage}
      handleRotateLeft={handleRotateLeft}
      handleRotateRight={handleRotateRight}
      handleMirrorHorizontal={handleMirrorHorizontal}
      handleMirrorVertical={handleMirrorVertical}
      handleZoomIn={handleZoomIn}
      handleZoomOut={handleZoomOut}
      handleFitToView={handleFitToView}
      handleEditProperties={handleEditProperties}
      handleUndo={handleUndo}
      handleRedo={handleRedo}
      handleStartNesting={handleStartNesting}
      handleManualNesting={handleManualNesting}
      handleOpenNestingSettings={handleOpenNestingSettings}
      handleStopNesting={handleStopNesting}
      handleExportDXF={handlers.handleExportDXF}
      handleExportExcel={handlers.handleExportExcel}
      handleExportPDF={handlers.handleExportPDF}
      handleExportAll={handlers.handleExportAll}
      handleOpenExportSettings={handlers.handleOpenExportSettings}
      setHotkeyConfigOpen={setHotkeyConfigOpen}
      isNestingRunning={isNestingRunning}
      historyIndex={historyIndex}
      history={history}
      partSpacing={partSpacing}
      setPartSpacing={setPartSpacing}
      leftPanelWidth={leftPanelWidth}
      isResizingLeft={isResizingLeft}
      setIsResizingLeft={setIsResizingLeft}
      getFilteredParts={getFilteredParts}
      parts={parts}
      selectedPartIds={selectedPartIds}
      handlePartSelect={handlers.handlePartSelect}
      handlePartMultiSelect={handlers.handlePartMultiSelect}
      handleSelectAllParts={handlers.handleSelectAllParts}
      handleDeleteParts={handleDeleteParts}
      handleImportParts={handleImportParts}
      handleEditPartProperties={handlers.handleEditPartProperties}
      handleDuplicateParts={handleDuplicateParts}
      displayMode={displayMode}
      setDisplayMode={setDisplayMode}
      sortBy={sortBy}
      setSortBy={setSortBy}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      searchQuery={partList.filters.searchQuery}
      setSearchQuery={partList.filters.setSearchQuery}
      filterMinArea={partList.filters.filterMinArea}
      filterMaxArea={partList.filters.filterMaxArea}
      filterMinQuantity={partList.filters.filterMinQuantity}
      filterMaxQuantity={partList.filters.filterMaxQuantity}
      filterStatus={partList.filters.filterStatus}
      setFilterMinArea={partList.filters.setFilterMinArea}
      setFilterMaxArea={partList.filters.setFilterMaxArea}
      setFilterMinQuantity={partList.filters.setFilterMinQuantity}
      setFilterMaxQuantity={partList.filters.setFilterMaxQuantity}
      setFilterStatus={partList.filters.setFilterStatus}
      viewMode={viewMode}
      nestResults={nestResults}
      selectedResultIds={selectedResultIds}
      setParts={setParts}
      nestingSettings={nestingSettings}
      nestingProgress={nestingProgress}
      nestingUtilization={nestingUtilization}
      materialGroups={materialGroups}
      activeMaterialGroupId={activeMaterialGroupId}
      rightPanelWidth={rightPanelWidth}
      isResizingRight={isResizingRight}
      setIsResizingRight={setIsResizingRight}
      handleResultSelect={handlers.handleResultSelect}
      handleResultMultiSelect={handlers.handleResultMultiSelect}
      handleViewResultDetails={handlers.handleViewResultDetails}
      handleDeleteResults={handleDeleteResults}
      handleDuplicateResult={handleDuplicateResult}
      handleLockResult={handleLockResult}
      handleUpdateResultStatus={handleUpdateResultStatus}
      materialGroupDialogOpen={materialGroupDialogOpen}
      setMaterialGroupDialogOpen={setMaterialGroupDialogOpen}
      handleMaterialGroupSelect={handleMaterialGroupSelect}
      handleGroupClose={handleGroupClose}
      hotkeyConfigOpen={hotkeyConfigOpen}
      setHotkeys={setHotkeys}
      hotkeys={hotkeys}
      handleCreateMaterialGroup={handleCreateMaterialGroup}
      nestingResultSelectorOpen={nestingResultSelectorOpen}
      nestingResultsToSelect={nestingResultsToSelect}
      handleSaveNestingResult={handlers.handleSaveNestingResult}
      handleRenest={handlers.handleRenest}
      setNestingResultSelectorOpen={setNestingResultSelectorOpen}
      setNestingResultsToSelect={setNestingResultsToSelect}
    />
  );
};
export default RibbonLayoutV2;
