import React from "react";
import SidePanel from "../../../components/CAD/SidePanel";
import { CADPageCanvasPane } from "./CADPageCanvasPane";
import { CADPageRightPanels } from "./CADPageRightPanels";

interface CADPageMainContentProps {
  styles: {
    mainContent: React.CSSProperties;
    leftPanel: React.CSSProperties;
  };
  sidePanelProps: React.ComponentProps<typeof SidePanel>;
  canvasPaneProps: React.ComponentProps<typeof CADPageCanvasPane>;
  rightPanelsProps: React.ComponentProps<typeof CADPageRightPanels>;
}

export const CADPageMainContent: React.FC<CADPageMainContentProps> = ({
  styles,
  sidePanelProps,
  canvasPaneProps,
  rightPanelsProps,
}) => {
  return (
    <div style={styles.mainContent}>
      <div style={styles.leftPanel}>
        <SidePanel {...sidePanelProps} />
      </div>
      <CADPageCanvasPane {...canvasPaneProps} />
      <CADPageRightPanels {...rightPanelsProps} />
    </div>
  );
};

