import React from "react";
import HistoryPanel from "../../../components/CAD/HistoryPanel";
import TextPropertiesPanel from "../../../components/CAD/components/TextPropertiesPanel";
import { CollapsibleSidebar } from "../../../components/CAD/components/CollapsibleSidebar";
import { NestingLayoutsPanel } from "../../../components/CAD/components/NestingLayoutsPanel";
import type { NestingLayoutViewMode } from "../../../components/CAD/types/NestingTypes";
import {
  SidebarRail,
  SidebarTrigger,
} from "../../../components/CAD/components/SidebarRail";

type ActivePanel = "history" | "layouts" | "text" | null;

interface CADPageRightPanelsProps {
  isNestingMode: boolean;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  layoutsPanelWidth: number;
  setLayoutsPanelWidth: (value: number) => void;
  historyPanelWidth: number;
  setHistoryPanelWidth: (value: number) => void;
  textPanelWidth: number;
  setTextPanelWidth: (value: number) => void;
  theme: "dark" | "light";
  isOperationHistoryEnabled: boolean;
  plates: any[];
  nestingParts: any[];
  layoutViewMode: NestingLayoutViewMode;
  selectedPlateIds: string[];
  onLayoutViewModeChange: (mode: NestingLayoutViewMode) => void;
  onPlateSelectionChange: (clickedPlateId: string, value: string[]) => void;
  handleAddPlate: () => void;
  handleRemovePlate: (id: string) => void;
  selectedFileId: string | null;
  currentUserId: string;
  currentUsername: string;
  handleUndo: () => void;
  handleRedo: () => void;
  selectedTextEntity: any;
  onApplyTextUpdate: (payload: any) => Promise<void>;
  onToast: (message: string, type?: any, durationMs?: number) => void;
  isAuthenticated: boolean;
}

export const CADPageRightPanels: React.FC<CADPageRightPanelsProps> = ({
  isNestingMode,
  activePanel,
  setActivePanel,
  layoutsPanelWidth,
  setLayoutsPanelWidth,
  historyPanelWidth,
  setHistoryPanelWidth,
  textPanelWidth,
  setTextPanelWidth,
  theme,
  isOperationHistoryEnabled,
  plates,
  nestingParts,
  layoutViewMode,
  selectedPlateIds,
  onLayoutViewModeChange,
  onPlateSelectionChange,
  handleAddPlate,
  handleRemovePlate,
  selectedFileId,
  currentUserId,
  currentUsername,
  handleUndo,
  handleRedo,
  selectedTextEntity,
  onApplyTextUpdate,
  onToast,
  isAuthenticated,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        {isNestingMode && (
          <CollapsibleSidebar
            isOpen={activePanel === "layouts"}
            onToggle={() => setActivePanel(activePanel === "layouts" ? null : "layouts")}
            width={layoutsPanelWidth}
            onResize={setLayoutsPanelWidth}
            theme={theme}
            title="排版"
            icon={<span>📑</span>}
            collapsedLabel="排版"
            hideCollapsedHandle={true}
          >
            <NestingLayoutsPanel
              plates={plates}
              parts={nestingParts}
              layoutViewMode={layoutViewMode}
              selectedPlateIds={selectedPlateIds}
              onLayoutViewModeChange={onLayoutViewModeChange}
              onPlateSelectionChange={onPlateSelectionChange}
              onAddPlate={handleAddPlate}
              onDeletePlate={handleRemovePlate}
              theme={theme}
            />
          </CollapsibleSidebar>
        )}

        {isOperationHistoryEnabled && (
          <CollapsibleSidebar
            isOpen={activePanel === "history"}
            onToggle={() => setActivePanel(activePanel === "history" ? null : "history")}
            width={historyPanelWidth}
            onResize={setHistoryPanelWidth}
            theme={theme}
            title="History"
            icon={<span>📜</span>}
            collapsedLabel="HISTORY"
            hideCollapsedHandle={true}
          >
            <HistoryPanel
              fileId={selectedFileId || ""}
              userId={currentUserId}
              username={currentUsername}
              onUndo={handleUndo}
              onRedo={handleRedo}
              theme={theme}
            />
          </CollapsibleSidebar>
        )}

        {!isNestingMode && (
          <CollapsibleSidebar
            isOpen={activePanel === "text"}
            onToggle={() => setActivePanel(activePanel === "text" ? null : "text")}
            width={textPanelWidth}
            onResize={setTextPanelWidth}
            theme={theme}
            title="Text"
            icon={<span style={{ fontWeight: 700 }}>T</span>}
            collapsedLabel="TEXT"
            hideCollapsedHandle={true}
          >
            <TextPropertiesPanel
              theme={theme}
              selectedEntity={selectedTextEntity}
              currentUserId={currentUserId || undefined}
              isAuthenticated={isAuthenticated}
              onApply={onApplyTextUpdate}
              onToast={onToast}
            />
          </CollapsibleSidebar>
        )}
      </div>

      <SidebarRail theme={theme} isVisible={true}>
        {isNestingMode && (
          <SidebarTrigger
            onClick={() => setActivePanel(activePanel === "layouts" ? null : "layouts")}
            icon={<span>📑</span>}
            label="排版"
            theme={theme}
            title="排版"
            isActive={activePanel === "layouts"}
          />
        )}

        {isOperationHistoryEnabled && (
          <SidebarTrigger
            onClick={() => setActivePanel(activePanel === "history" ? null : "history")}
            icon={<span>📜</span>}
            label="HISTORY"
            theme={theme}
            title="History"
            isActive={activePanel === "history"}
          />
        )}

        {!isNestingMode && (
          <SidebarTrigger
            onClick={() => setActivePanel(activePanel === "text" ? null : "text")}
            icon={<span style={{ fontWeight: 700 }}>T</span>}
            label="TEXT"
            theme={theme}
            title="Text"
            isActive={activePanel === "text"}
          />
        )}
      </SidebarRail>
    </div>
  );
};
