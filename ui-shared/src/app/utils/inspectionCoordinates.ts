import { Viewport } from "../contexts/ViewportContext";

export function mapIssuePointToScreenPosition(input: {
  worldX: number;
  worldY: number;
  viewport: Viewport;
  fileId?: string;
  fileOffsets?: Record<string, { x: number; y: number }>;
  coordinateSpace?: "local" | "world";
}) {
  const {
    worldX,
    worldY,
    viewport,
    fileId,
    fileOffsets = {},
    coordinateSpace = "local",
  } = input;

  let finalX = worldX;
  let finalY = worldY;

  if (coordinateSpace === "local" && fileId && fileOffsets[fileId]) {
    finalX += fileOffsets[fileId].x;
    finalY += fileOffsets[fileId].y;
  }

  return {
    x: finalX * viewport.zoom + viewport.pan.x,
    y: finalY * viewport.zoom + viewport.pan.y,
  };
}
