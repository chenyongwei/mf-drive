import { useCallback } from 'react';
import { useKeyboardShortcuts } from './RibbonLayoutV2_hooks';
import { NestResult, MaterialGroup } from './RibbonLayoutV2_types';

type HandlersArgs = {
  getFilteredParts: () => any[];
  setSelectedPartIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedResultIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  nestingResultsToSelect: any[];
  setNestResults: React.Dispatch<React.SetStateAction<NestResult[]>>;
  setNestingResultSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNestingResultsToSelect: React.Dispatch<React.SetStateAction<any[]>>;
  activeMaterialGroupId?: string;
  setMaterialGroups: React.Dispatch<React.SetStateAction<MaterialGroup[]>>;
  handleStartNesting: () => void;
  handleRotateLeft: () => void;
  handleRotateRight: () => void;
  handleMirrorHorizontal: () => void;
  handleMirrorVertical: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitToView: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  isNestingRunning: boolean;
  hotkeyConfigOpen: boolean;
  materialGroupDialogOpen: boolean;
  nestingResultSelectorOpen: boolean;
  setHotkeyConfigOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMaterialGroupDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  materialGroups: MaterialGroup[];
};

export function useRibbonLayoutV2Handlers(args: HandlersArgs) {
  const handlePartSelect = useCallback((partId: string) => {
    args.setSelectedPartIds(new Set([partId]));
  }, [args.setSelectedPartIds]);

  const handlePartMultiSelect = useCallback((partIds: string[]) => {
    args.setSelectedPartIds(new Set(partIds));
  }, [args.setSelectedPartIds]);

  const handleSelectAllParts = useCallback(() => {
    const currentGroupParts = args.getFilteredParts();
    args.setSelectedPartIds(new Set(currentGroupParts.map((p) => p.id)));
  }, [args.getFilteredParts, args.setSelectedPartIds]);

  const handleResultSelect = useCallback((resultId: string) => {
    args.setSelectedResultIds(new Set([resultId]));
  }, [args.setSelectedResultIds]);

  const handleResultMultiSelect = useCallback((resultIds: string[]) => {
    args.setSelectedResultIds(new Set(resultIds));
  }, [args.setSelectedResultIds]);

  const handleViewResultDetails = useCallback((resultId: string) => {
  }, []);

  const handleSaveNestingResult = useCallback(
    (resultId: string, name: string) => {
      const result = args.nestingResultsToSelect.find((r) => r.id === resultId);
      if (!result) return;

      const newResult: NestResult = {
        ...result,
        id: result.id,
        name,
        timestamp: new Date().toISOString(),
        status: 'draft',
      };

      args.setNestResults((prev) => [newResult, ...prev]);
      args.setNestingResultSelectorOpen(false);
      args.setNestingResultsToSelect([]);

      if (args.activeMaterialGroupId) {
        args.setMaterialGroups((prev) =>
          prev.map((g) => (g.id === args.activeMaterialGroupId ? { ...g, nestResultCount: g.nestResultCount + 1 } : g)),
        );
      }
    },
    [args.nestingResultsToSelect, args.activeMaterialGroupId, args.setMaterialGroups, args.setNestResults, args.setNestingResultSelectorOpen, args.setNestingResultsToSelect],
  );

  const handleRenest = useCallback(() => {
    args.setNestingResultSelectorOpen(false);
    args.handleStartNesting();
  }, [args.handleStartNesting, args.setNestingResultSelectorOpen]);

  const handleExportDXF = useCallback(() => {
  }, []);

  const handleExportExcel = useCallback(() => {
  }, []);

  const handleExportPDF = useCallback(() => {
  }, []);

  const handleExportAll = useCallback(() => {
  }, []);

  const handleOpenExportSettings = useCallback(() => {
  }, []);

  const handleEditPartProperties = useCallback((partId: string) => {
  }, []);

  useKeyboardShortcuts(
    {
      onRotateLeft: args.handleRotateLeft,
      onRotateRight: args.handleRotateRight,
      onMirrorHorizontal: args.handleMirrorHorizontal,
      onMirrorVertical: args.handleMirrorVertical,
      onZoomIn: args.handleZoomIn,
      onZoomOut: args.handleZoomOut,
      onFitToView: args.handleFitToView,
      onUndo: args.handleUndo,
      onRedo: args.handleRedo,
      onSelectAllParts: handleSelectAllParts,
      onExportDXF: handleExportDXF,
      onStartNesting: args.handleStartNesting,
      onConfirm: () => {
        if (args.nestingResultSelectorOpen) {
          handleSaveNestingResult(args.nestingResultsToSelect[0]?.id, '');
        } else if (args.hotkeyConfigOpen) {
          args.setHotkeyConfigOpen(false);
        } else if (args.materialGroupDialogOpen) {
          args.setMaterialGroupDialogOpen(false);
        }
      },
      onCancel: () => {
        args.setHotkeyConfigOpen(false);
        args.setMaterialGroupDialogOpen(false);
        args.setNestingResultSelectorOpen(false);
      },
    },
    {
      isNestingRunning: args.isNestingRunning,
      hotkeyConfigOpen: args.hotkeyConfigOpen,
      materialGroupDialogOpen: args.materialGroupDialogOpen,
      nestingResultSelectorOpen: args.nestingResultSelectorOpen,
    },
    [
      args.handleRotateLeft,
      args.handleRotateRight,
      args.handleMirrorHorizontal,
      args.handleMirrorVertical,
      args.handleZoomIn,
      args.handleZoomOut,
      args.handleFitToView,
      args.handleUndo,
      args.handleRedo,
      handleSelectAllParts,
      args.handleStartNesting,
      handleExportDXF,
      args.isNestingRunning,
      args.hotkeyConfigOpen,
      args.materialGroupDialogOpen,
      args.nestingResultSelectorOpen,
      args.nestingResultsToSelect,
      handleSaveNestingResult,
    ],
  );

  return {
    handlePartSelect,
    handlePartMultiSelect,
    handleSelectAllParts,
    handleResultSelect,
    handleResultMultiSelect,
    handleViewResultDetails,
    handleSaveNestingResult,
    handleRenest,
    handleExportDXF,
    handleExportExcel,
    handleExportPDF,
    handleExportAll,
    handleOpenExportSettings,
    handleEditPartProperties,
  };
}
