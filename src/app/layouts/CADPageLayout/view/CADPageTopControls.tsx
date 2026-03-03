import React from "react";
import DrawingRibbon from "../../../components/CAD/DrawingRibbon";
import NestingRibbon from "../../../components/CAD/NestingRibbon";
import { FeatureToggleToolbar } from "../../../components/CAD/components/FeatureToggleToolbar";
import { PlatesSettingsModal } from "../../../components/CAD/components/PlatesSettingsModal";
import {
  resolveFileInputAccept,
  type CadUploadFileType,
} from "./CADPageTopControls.accept";

interface CADPageTopControlsProps {
  showFeatureToggle: boolean;
  theme: "dark" | "light";
  isNestingMode: boolean;
  onToggleNestingMode: () => void;
  allowedFileTypes: CadUploadFileType[];
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRibbonAction: (action: string) => void;
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  currentShowDimensions: boolean;
  nestingConfig: any;
  setNestingConfig: React.Dispatch<React.SetStateAction<any>>;
  toolpathSortMode: string | null;
  nestingProcessMenus: any;
  nestingProcessPrimaryActionDefByOperation: any;
  handleNestingProcessPrimaryClick: (operation: "add" | "delete") => void;
  handleNestingProcessPinToggle: (actionId: string) => void;
  isPlatesModalOpen: boolean;
  onClosePlatesModal: () => void;
  plates: any[];
  onSavePlates: (plates: any[]) => void;
  showDrawingRibbonOnNestingDebugPage: boolean;
}

export const CADPageTopControls: React.FC<CADPageTopControlsProps> = ({
  showFeatureToggle,
  theme,
  isNestingMode,
  onToggleNestingMode,
  allowedFileTypes,
  onFileInputChange,
  handleRibbonAction,
  setTheme,
  currentLanguage,
  onLanguageChange,
  currentShowDimensions,
  nestingConfig,
  setNestingConfig,
  toolpathSortMode,
  nestingProcessMenus,
  nestingProcessPrimaryActionDefByOperation,
  handleNestingProcessPrimaryClick,
  handleNestingProcessPinToggle,
  isPlatesModalOpen,
  onClosePlatesModal,
  plates,
  onSavePlates,
  showDrawingRibbonOnNestingDebugPage,
}) => {
  return (
    <>
      {showFeatureToggle && (
        <FeatureToggleToolbar
          theme={theme}
          isNestingMode={isNestingMode}
          onToggleNestingMode={onToggleNestingMode}
        />
      )}

      <input
        id="file-input"
        type="file"
        multiple
        accept={resolveFileInputAccept(allowedFileTypes)}
        style={{ display: "none" }}
        onChange={onFileInputChange}
      />

      {(!isNestingMode || showDrawingRibbonOnNestingDebugPage) && (
        <DrawingRibbon
          theme={theme}
          onAction={handleRibbonAction}
          onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          currentLanguage={currentLanguage as any}
          onLanguageChange={onLanguageChange}
          showDimensions={currentShowDimensions}
        />
      )}

      {isNestingMode && (
        <NestingRibbon
          theme={theme}
          onAction={handleRibbonAction}
          partSpacing={nestingConfig.partSpacing}
          onPartSpacingChange={(value) =>
            setNestingConfig((prev) => ({ ...prev, partSpacing: value }))
          }
          onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          currentLanguage={currentLanguage as any}
          onLanguageChange={onLanguageChange}
          showDimensions={currentShowDimensions}
          sortingMode={toolpathSortMode ?? undefined}
          showDistanceGuides={nestingConfig.showDistanceGuides}
          distanceGuideMaxDistance={nestingConfig.distanceGuideMaxDistance}
          commonEdgeEnabled={nestingConfig.commonEdgeEnabled}
          stickToEdgeEnabled={nestingConfig.stickToEdge}
          snappingEnabled={nestingConfig.snappingEnabled}
          snapTolerance={nestingConfig.snapTolerance}
          processAddMenu={nestingProcessMenus.addMenu}
          processDeleteMenu={nestingProcessMenus.deleteMenu}
          processFavoriteActions={nestingProcessMenus.favoriteActions}
          processPrimaryActionByOperation={nestingProcessMenus.primaryActionByOperation}
          processPrimaryActionDefByOperation={nestingProcessPrimaryActionDefByOperation}
          onProcessPrimaryClick={handleNestingProcessPrimaryClick}
          onProcessPinToggle={handleNestingProcessPinToggle}
        />
      )}

      <PlatesSettingsModal
        isOpen={isPlatesModalOpen}
        onClose={onClosePlatesModal}
        plates={plates}
        onSave={onSavePlates}
        theme={theme}
      />
    </>
  );
};
