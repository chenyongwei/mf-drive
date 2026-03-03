import React from 'react';
import RibbonCompact from './RibbonCompact';
import HotkeyConfigDialog from './HotkeyConfigDialog';
import NestingProgressOverlay from './NestingProgressOverlay';
import MaterialGroupDialog from './MaterialGroupDialog';
import NestingResultSelector from './NestingResultSelector';
import MaterialTabsCompact from './MaterialTabsCompact';
import PartListPanel from './PartListPanel';
import NestResultListPanel from './NestResultListPanel';
import CADCanvas from './CADCanvas';
import MultiLayoutView from './MultiLayoutView';
import PreprocessPage from './PreprocessPage';
export const RibbonLayoutV2View: React.FC<any> = ({
  className,
  pageMode,
  handlePreprocessPage,
  handleRotateLeft,
  handleRotateRight,
  handleMirrorHorizontal,
  handleMirrorVertical,
  handleZoomIn,
  handleZoomOut,
  handleFitToView,
  handleEditProperties,
  handleUndo,
  handleRedo,
  handleStartNesting,
  handleManualNesting,
  handleOpenNestingSettings,
  handleStopNesting,
  handleExportDXF,
  handleExportExcel,
  handleExportPDF,
  handleExportAll,
  handleOpenExportSettings,
  setHotkeyConfigOpen,
  isNestingRunning,
  historyIndex,
  history,
  partSpacing,
  setPartSpacing,
  leftPanelWidth,
  isResizingLeft,
  setIsResizingLeft,
  getFilteredParts,
  parts,
  selectedPartIds,
  handlePartSelect,
  handlePartMultiSelect,
  handleSelectAllParts,
  handleDeleteParts,
  handleImportParts,
  handleEditPartProperties,
  handleDuplicateParts,
  displayMode,
  setDisplayMode,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery,
  filterMinArea,
  filterMaxArea,
  filterMinQuantity,
  filterMaxQuantity,
  filterStatus,
  setFilterMinArea,
  setFilterMaxArea,
  setFilterMinQuantity,
  setFilterMaxQuantity,
  setFilterStatus,
  viewMode,
  nestResults,
  selectedResultIds,
  setParts,
  nestingSettings,
  nestingProgress,
  nestingUtilization,
  materialGroups,
  activeMaterialGroupId,
  rightPanelWidth,
  isResizingRight,
  setIsResizingRight,
  handleResultSelect,
  handleResultMultiSelect,
  handleViewResultDetails,
  handleDeleteResults,
  handleDuplicateResult,
  handleLockResult,
  handleUpdateResultStatus,
  materialGroupDialogOpen,
  setMaterialGroupDialogOpen,
  handleMaterialGroupSelect,
  handleGroupClose,
  hotkeyConfigOpen,
  setHotkeys,
  hotkeys,
  handleCreateMaterialGroup,
  nestingResultSelectorOpen,
  nestingResultsToSelect,
  handleSaveNestingResult,
  handleRenest,
  setNestingResultSelectorOpen,
  setNestingResultsToSelect,
}) => {
  return (
    <div className={`h-screen flex flex-col ${className}`}>
      <RibbonCompact
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
        onMirrorHorizontal={handleMirrorHorizontal}
        onMirrorVertical={handleMirrorVertical}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToView={handleFitToView}
        onEditProperties={handleEditProperties}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onStartNesting={handleStartNesting}
        onManualNesting={handleManualNesting}
        onOpenNestingSettings={handleOpenNestingSettings}
        onStopNesting={handleStopNesting}
        onExportDXF={handleExportDXF}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onExportAll={handleExportAll}
        onOpenExportSettings={handleOpenExportSettings}
        onOpenHotkeyConfig={() => setHotkeyConfigOpen(true)}
        onPreprocess={handlePreprocessPage}
        isNestingRunning={isNestingRunning}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        disabled={isNestingRunning}
        partSpacing={partSpacing}
        onPartSpacingChange={setPartSpacing}
      />
      {pageMode === 'preprocess' ? <PreprocessPage /> : (
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`relative border-r border-slate-200 flex flex-col bg-white ${isNestingRunning ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ width: `${leftPanelWidth}px` }}
          >
            <PartListPanel
              parts={getFilteredParts()}
              totalParts={parts.length}
              selectedPartIds={selectedPartIds}
              onPartSelect={handlePartSelect}
              onPartMultiSelect={handlePartMultiSelect}
              onSelectAll={handleSelectAllParts}
              onDelete={handleDeleteParts}
              onImport={handleImportParts}
              onEditProperties={handleEditPartProperties}
              onDuplicate={handleDuplicateParts}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterMinArea={filterMinArea}
              filterMaxArea={filterMaxArea}
              filterMinQuantity={filterMinQuantity}
              filterMaxQuantity={filterMaxQuantity}
              filterStatus={filterStatus}
              onFilterMinAreaChange={setFilterMinArea}
              onFilterMaxAreaChange={setFilterMaxArea}
              onFilterMinQuantityChange={setFilterMinQuantity}
              onFilterMaxQuantityChange={setFilterMaxQuantity}
              onFilterStatusChange={setFilterStatus}
              onClearFilters={() => {
                setSearchQuery('');
                setFilterMinArea(undefined);
                setFilterMaxArea(undefined);
                setFilterMinQuantity(undefined);
                setFilterMaxQuantity(undefined);
                setFilterStatus('all');
              }}
            />
            <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-300 hover:bg-blue-500 cursor-col-resize z-10" style={{ right: '-3px' }} onMouseDown={() => setIsResizingLeft(true)} />
          </div>
          <div className="flex-1 flex flex-col min-w-0 relative">
            {viewMode === 'multi' ? (
              <MultiLayoutView
                layouts={nestResults.map((r) => ({
                  id: r.id,
                  name: r.name,
                  utilization: r.utilization,
                  parts: parts.slice(0, 5).map((p, i) => ({
                    ...p,
                    x: 20 + (i % 2) * 120,
                    y: 20 + Math.floor(i / 2) * 120,
                  })),
                  sheetDimensions: r.sheetDimensions,
                }))}
                selectedLayoutIds={Array.from(selectedResultIds)}
                onPartMove={(partId, fromLayoutId, toLayoutId, x, y) => {}}
              />
            ) : (
              <>
                <CADCanvas
                  parts={getFilteredParts()}
                  nestResults={nestResults}
                  selectedPartIds={selectedPartIds}
                  selectedResultIds={selectedResultIds}
                  onPartClick={handlePartSelect}
                  onResultClick={handleResultSelect}
                  viewMode={viewMode}
                  nestingSettings={nestingSettings}
                  onPartPositionChange={(partId, position) => {
                    setParts((prev) => prev.map((p) => (p.id === partId ? { ...p, position } : p)));
                  }}
                />
                {isNestingRunning && (
                  <NestingProgressOverlay
                    isRunning={isNestingRunning}
                    progress={nestingProgress}
                    utilization={nestingUtilization}
                    placedParts={Math.floor(parts.length * nestingProgress) / 100}
                    totalParts={parts.length}
                    groupName={materialGroups.find((g) => g.id === activeMaterialGroupId)?.material || ''}
                  />
                )}
              </>
            )}
          </div>
          <div
            className={`relative border-l border-slate-200 flex flex-col bg-white ${isNestingRunning ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ width: `${rightPanelWidth}px` }}
          >
            <NestResultListPanel
              results={nestResults}
              selectedResultIds={selectedResultIds}
              onResultSelect={handleResultSelect}
              onResultMultiSelect={handleResultMultiSelect}
              onViewDetails={handleViewResultDetails}
              onDelete={handleDeleteResults}
              onExport={handleExportDXF}
              onDuplicate={handleDuplicateResult}
              onLock={handleLockResult}
              onStatusChange={handleUpdateResultStatus}
            />
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-300 hover:bg-blue-500 cursor-col-resize z-10" style={{ left: '-3px' }} onMouseDown={() => setIsResizingRight(true)} />
          </div>
        </div>
      )}
      {pageMode === 'normal' && (
        <MaterialTabsCompact
          groups={materialGroups}
          activeGroupId={activeMaterialGroupId}
          onGroupSelect={handleMaterialGroupSelect}
          onCreateGroup={() => setMaterialGroupDialogOpen(true)}
          onGroupClose={handleGroupClose}
        />
      )}
      {pageMode === 'normal' && (
        <div className="h-5 bg-slate-800 text-slate-300 flex items-center px-3 text-[10px]">
          <span>就绪</span>
          <span className="mx-2">|</span>
          <span>{parts.length} 个零件</span>
          <span className="mx-2">|</span>
          <span>{nestResults.length} 个排样结果</span>
          <span className="mx-auto" />
          <span>Zoom: 100%</span>
          <span className="mx-2">|</span>
          <span>Ctrl+Z: 撤销 | Ctrl+Y: 重做 | Space: 确定</span>
        </div>
      )}
      <HotkeyConfigDialog
        isOpen={hotkeyConfigOpen}
        onClose={() => setHotkeyConfigOpen(false)}
        onSave={(newHotkeys) => setHotkeys(newHotkeys)}
        currentHotkeys={hotkeys}
      />
      <MaterialGroupDialog
        isOpen={materialGroupDialogOpen}
        onClose={() => setMaterialGroupDialogOpen(false)}
        onSave={handleCreateMaterialGroup}
        existingGroups={materialGroups.map((g) => ({ material: g.material, thickness: g.thickness }))}
      />
      <NestingResultSelector
        isOpen={nestingResultSelectorOpen}
        results={nestingResultsToSelect}
        onSave={handleSaveNestingResult}
        onRenest={handleRenest}
        onClose={() => {
          setNestingResultSelectorOpen(false);
          setNestingResultsToSelect([]);
        }}
      />
    </div>
  );
};
