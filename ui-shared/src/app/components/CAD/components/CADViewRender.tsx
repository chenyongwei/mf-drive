import React from "react";
import type { CADToolType } from "../CADToolPanel";
import type { BoundingBox } from "../types/BoundingBox";
import { CADViewCanvasLayer } from "./CADViewCanvasLayer";
import { CADViewOverlayUI } from "./CADViewOverlayUI";

interface CADViewRenderProps {
  canvasLayerProps: React.ComponentProps<typeof CADViewCanvasLayer>;
  overlayProps: React.ComponentProps<typeof CADViewOverlayUI>;
}

export function CADViewRender({
  canvasLayerProps,
  overlayProps,
}: CADViewRenderProps) {
  return (
    <>
      <CADViewCanvasLayer {...canvasLayerProps} />
      <CADViewOverlayUI {...overlayProps} />
    </>
  );
}
