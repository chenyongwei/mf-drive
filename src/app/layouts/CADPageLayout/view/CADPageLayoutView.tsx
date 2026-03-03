import React from "react";
import { CADPageDialogs } from "./CADPageDialogs";
import { CADPageMainContent } from "./CADPageMainContent";
import { CADPageTopControls } from "./CADPageTopControls";

interface CADPageLayoutViewProps {
  containerStyle: React.CSSProperties;
  topControlsProps: React.ComponentProps<typeof CADPageTopControls>;
  mainContentProps: React.ComponentProps<typeof CADPageMainContent>;
  dialogProps: React.ComponentProps<typeof CADPageDialogs>;
}

export const CADPageLayoutView: React.FC<CADPageLayoutViewProps> = ({
  containerStyle,
  topControlsProps,
  mainContentProps,
  dialogProps,
}) => {
  return (
    <div style={containerStyle} data-testid="main-container">
      <CADPageTopControls {...topControlsProps} />
      <CADPageMainContent {...mainContentProps} />
      <CADPageDialogs {...dialogProps} />
    </div>
  );
};

