export interface IssueViewportStageSize {
  width: number;
  height: number;
}

export interface IssueViewportRulerSize {
  width: number;
  height: number;
}

interface IssuePositionLike {
  location: { position: { x: number; y: number } };
}

interface ComputeIssueViewportOptions {
  maxZoom?: number;
  padding?: number;
}

export function computeIssueViewportFromPositions(
  issues: IssuePositionLike[],
  stageSize: IssueViewportStageSize,
  rulerSize: IssueViewportRulerSize,
  options: ComputeIssueViewportOptions = {}
) {
  if (!issues.length) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  issues.forEach((issue) => {
    const { x, y } = issue.location.position;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  const padding = options.padding ?? 50;
  const maxZoom = options.maxZoom ?? 5;
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const availableWidth = stageSize.width - rulerSize.width - padding * 2;
  const availableHeight = stageSize.height - rulerSize.height - padding * 2;
  const zoomX = availableWidth / contentWidth;
  const zoomY = availableHeight / contentHeight;
  const zoom = Math.min(zoomX, zoomY, maxZoom);

  return {
    zoom,
    pan: {
      x: rulerSize.width + padding + (availableWidth - contentWidth * zoom) / 2 - minX * zoom,
      y: rulerSize.height + padding + (availableHeight - contentHeight * zoom) / 2 - minY * zoom,
    },
  };
}
