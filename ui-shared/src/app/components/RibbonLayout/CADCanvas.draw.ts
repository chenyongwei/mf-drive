import { NestResult, Part, RulerSize } from './CADCanvas.types';
import {
  drawGrid,
  drawHorizontalRuler,
  drawPart,
  drawSheet,
  drawVerticalRuler,
  worldToScreen,
} from './CADCanvas.primitives';

export const drawCanvasScene = ({
  ctx,
  width,
  height,
  viewMode,
  zoom,
  pan,
  rulerSize,
  showRuler,
  showGrid,
  showDimensions,
  mousePosition,
  parts,
  nestResults,
  selectedPartIds,
  selectedResultIds,
  nestingSettings,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  viewMode: 'parts' | 'nesting' | 'multi' | 'empty';
  zoom: number;
  pan: { x: number; y: number };
  rulerSize: RulerSize;
  showRuler: boolean;
  showGrid: boolean;
  showDimensions: boolean;
  mousePosition: { x: number; y: number } | null;
  parts: Part[];
  nestResults: NestResult[];
  selectedPartIds: Set<string>;
  selectedResultIds: Set<string>;
  nestingSettings: { sheetWidth: number; sheetHeight: number; margin: number };
}) => {
  ctx.clearRect(0, 0, width, height);

  if (showRuler) {
    drawHorizontalRuler(ctx, width, zoom, pan, rulerSize);
    drawVerticalRuler(ctx, height, zoom, pan, rulerSize);
  }

  ctx.fillStyle = '#1f2937';
  ctx.fillRect(rulerSize.left, rulerSize.top, width - rulerSize.left, height - rulerSize.top);

  drawGrid(ctx, width, height, showGrid, zoom, pan, rulerSize);

  if (viewMode === 'empty') {
    const canvasWidth = width - rulerSize.left;
    const canvasHeight = height - rulerSize.top;
    const centerX = rulerSize.left + canvasWidth / 2;
    const centerY = rulerSize.top + canvasHeight / 2;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('请选择零件或排版结果', centerX, centerY - 20);
    ctx.font = '16px sans-serif';
    ctx.fillText('从左侧选择零件 或 从右侧选择排版', centerX, centerY + 20);
    ctx.textAlign = 'left';
  } else if (viewMode === 'nesting' && selectedResultIds.size > 0) {
    drawSheet(ctx, nestingSettings, zoom, pan, rulerSize, showDimensions);
    const result = nestResults.find(item => selectedResultIds.has(item.id));
    if (result) {
      const origin = worldToScreen(0, 0, zoom, pan, rulerSize);
      ctx.fillStyle = '#374151';
      ctx.font = '14px sans-serif';
      ctx.fillText(`${result.name} - 利用率: ${(result.utilization * 100).toFixed(1)}%`, origin.x + 10, origin.y - 10);
    }
  } else if (viewMode === 'parts' && selectedPartIds.size > 0) {
    drawSheet(ctx, nestingSettings, zoom, pan, rulerSize, showDimensions);
    parts.filter(part => selectedPartIds.has(part.id)).forEach((part) => {
      drawPart(ctx, part, zoom, pan, rulerSize, selectedPartIds, showDimensions);
    });
  }

  if (mousePosition) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(20, height - 40, 160, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(`X: ${mousePosition.x} Y: ${mousePosition.y}`, 25, height - 25);
  }
};
