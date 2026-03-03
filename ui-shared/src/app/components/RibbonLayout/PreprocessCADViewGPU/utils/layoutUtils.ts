import { computeIssueViewportFromPositions } from '../../utils/issueViewport';
import type { TiledLayout } from './layoutTypes';

/**
 * Auto-fit viewport to show all tiled layouts
 */
export const calculateAutoFitLayout = (
  tiledLayout: TiledLayout[],
  stageSize: { width: number; height: number },
  rulerSize: { width: number; height: number },
  currentZoom: number,
  currentPan: { x: number; y: number }
): { zoom: number; pan: { x: number; y: number } } | null => {
  if (tiledLayout.length === 0) return null;

  const minX = Math.min(...tiledLayout.map((l) => l.bbox.minX));
  const minY = Math.min(...tiledLayout.map((l) => l.bbox.minY));
  const maxX = Math.max(...tiledLayout.map((l) => l.bbox.maxX));
  const maxY = Math.max(...tiledLayout.map((l) => l.bbox.maxY));

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Only auto-fit if zoom is still at initial value
  if (currentZoom !== 1 || currentPan.x !== 100 || currentPan.y !== 100) {
    return null;
  }

  const padding = 100;
  const availableWidth = stageSize.width - rulerSize.width - padding * 2;
  const availableHeight = stageSize.height - rulerSize.height - padding * 2;
  const zoomX = availableWidth / contentWidth;
  const zoomY = availableHeight / contentHeight;
  const newZoom = Math.min(zoomX, zoomY, 1);

  const newPan = {
    x: rulerSize.width + (availableWidth - contentWidth * newZoom) / 2 - minX * newZoom,
    y: rulerSize.height + (availableHeight - contentHeight * newZoom) / 2 - minY * newZoom,
  };

  return { zoom: newZoom, pan: newPan };
};

/**
 * Fit viewport to show specific issues
 */
export const calculateFitToIssues = (
  issues: Array<{ location: { position: { x: number; y: number } } }>,
  stageSize: { width: number; height: number },
  rulerSize: { width: number; height: number }
): { zoom: number; pan: { x: number; y: number } } | null => {
  return computeIssueViewportFromPositions(issues, stageSize, rulerSize, {
    padding: 50,
    maxZoom: 5,
  });
};
