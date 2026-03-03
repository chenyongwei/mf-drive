import React from "react";
import CADView from "../../../components/CAD/CADView";
import DetectionOverlay from "../../../components/CAD/components/DetectionOverlay";
import FixMenu from "../../../components/CAD/components/FixMenu";
import InspectionLoadingOverlay from "../../../components/CAD/components/InspectionLoadingOverlay";
import RemoteCursorsOverlay from "../../../components/Collaboration/RemoteCursorsOverlay";
import RemoteSelectionOverlay from "../../../components/Collaboration/RemoteSelectionOverlay";
import { CADPageToolpathPanel } from "./CADPageToolpathPanel";

interface ToastState {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface CADPageCanvasPaneProps {
  theme: "dark" | "light";
  styles: { canvas: React.CSSProperties; button: React.CSSProperties };
  isNestingMode: boolean;
  partActionToast: ToastState | null;
  toolpathPanelProps: React.ComponentProps<typeof CADPageToolpathPanel>;
  cadViewProps: React.ComponentProps<typeof CADView>;
  viewportValue: any;
  layoutEntities: any[];
  layoutFileLayouts: Array<{ fileId: string; offsetX: number; offsetY: number }>;
  inspectionResult: any;
  highlightedIssueId: string | null;
  showOnlyLevel: any;
  inspectionCoordinateSpace: "local" | "world";
  handleIssueSelect: (issue: any) => void;
  handleFixAll: () => void;
  isInspecting: boolean;
}

const toastCardStyle = (
  theme: "dark" | "light",
  type: "success" | "error" | "warning" | "info",
): React.CSSProperties => ({
  minWidth: 320,
  maxWidth: "70vw",
  borderRadius: 8,
  padding: "10px 14px",
  border:
    type === "success"
      ? "1px solid rgba(34,197,94,0.45)"
      : type === "error"
        ? "1px solid rgba(239,68,68,0.5)"
        : type === "warning"
          ? "1px solid rgba(245,158,11,0.5)"
          : "1px solid rgba(59,130,246,0.5)",
  background:
    type === "success"
      ? "rgba(22,163,74,0.14)"
      : type === "error"
        ? "rgba(220,38,38,0.14)"
        : type === "warning"
          ? "rgba(217,119,6,0.14)"
          : "rgba(37,99,235,0.14)",
  color: theme === "dark" ? "rgba(248,250,252,0.96)" : "rgba(15,23,42,0.96)",
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.35,
  boxShadow:
    theme === "dark"
      ? "0 8px 20px rgba(0,0,0,0.35)"
      : "0 8px 20px rgba(15,23,42,0.18)",
  textAlign: "center",
});

export const CADPageCanvasPane: React.FC<CADPageCanvasPaneProps> = ({
  theme,
  styles,
  partActionToast,
  toolpathPanelProps,
  cadViewProps,
  viewportValue,
  layoutEntities,
  layoutFileLayouts,
  inspectionResult,
  highlightedIssueId,
  showOnlyLevel,
  inspectionCoordinateSpace,
  handleIssueSelect,
  handleFixAll,
  isInspecting,
}) => {
  return (
    <div style={styles.canvas} data-testid="cad-canvas-pane">
      {partActionToast && (
        <div
          style={{
            position: "absolute",
            top: 42,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1800,
            pointerEvents: "none",
          }}
        >
          <div style={toastCardStyle(theme, partActionToast.type)}>
            {partActionToast.message}
          </div>
        </div>
      )}

      <CADPageToolpathPanel {...toolpathPanelProps} />

      <CADView {...cadViewProps} />

      <RemoteCursorsOverlay />
      <RemoteSelectionOverlay entities={layoutEntities} />

      {inspectionResult && (
        <DetectionOverlay
          issues={inspectionResult.issues}
          viewport={viewportValue}
          highlightedIssueId={highlightedIssueId}
          onIssueClick={handleIssueSelect}
          showOnlyLevel={showOnlyLevel}
          coordinateSpace={inspectionCoordinateSpace}
          fileOffsets={layoutFileLayouts.reduce(
            (acc, fl) => {
              acc[fl.fileId] = { x: fl.offsetX, y: fl.offsetY };
              return acc;
            },
            {} as Record<string, { x: number; y: number }>,
          )}
        />
      )}

      <InspectionLoadingOverlay isVisible={isInspecting} theme={theme} />

      {inspectionResult && (
        <FixMenu
          inspectionResult={inspectionResult}
          onFixAll={handleFixAll}
          theme={theme}
        />
      )}
    </div>
  );
};
