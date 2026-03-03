import { Part, RulerSize } from './CADCanvas.types';

export const calculateTickInterval = (zoom: number): { major: number; minor: number } => {
  const targetPixelInterval = 100;
  const worldInterval = targetPixelInterval / zoom;
  const magnitude = Math.pow(10, Math.floor(Math.log10(worldInterval)));
  const baseValue = worldInterval / magnitude;

  if (baseValue <= 2) {
    return { major: 1 * magnitude, minor: 0.2 * magnitude };
  }
  if (baseValue <= 5) {
    return { major: 2 * magnitude, minor: 0.5 * magnitude };
  }
  return { major: 5 * magnitude, minor: 1 * magnitude };
};

export const worldToScreen = (
  x: number,
  y: number,
  zoom: number,
  pan: { x: number; y: number },
  rulerSize: RulerSize,
) => ({
  x: x * zoom + pan.x + rulerSize.left,
  y: y * zoom + pan.y + rulerSize.top,
});

export const screenToWorld = (
  x: number,
  y: number,
  zoom: number,
  pan: { x: number; y: number },
  rulerSize: RulerSize,
) => ({
  x: (x - pan.x - rulerSize.left) / zoom,
  y: (y - pan.y - rulerSize.top) / zoom,
});

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  showGrid: boolean,
  zoom: number,
  pan: { x: number; y: number },
  rulerSize: RulerSize,
) => {
  if (!showGrid) return;

  const gridSize = 50 * zoom;
  const offsetX = (pan.x + rulerSize.left) % gridSize;
  const offsetY = (pan.y + rulerSize.top) % gridSize;

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 0.5;

  for (let x = rulerSize.left + offsetX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, rulerSize.top);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = rulerSize.top + offsetY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(rulerSize.left, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

export const drawHorizontalRuler = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  zoom: number,
  pan: { x: number; y: number },
  rulerSize: RulerSize,
) => {
  const rulerHeight = rulerSize.top;
  const rulerStartX = rulerSize.left;
  const rulerWidth = canvasWidth - rulerSize.left;

  ctx.fillStyle = '#4b5563';
  ctx.fillRect(rulerStartX, 0, rulerWidth, rulerHeight);

  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rulerStartX, rulerHeight);
  ctx.lineTo(rulerStartX + rulerWidth, rulerHeight);
  ctx.stroke();

  const { major, minor } = calculateTickInterval(zoom);
  const majorTickInterval = major * zoom;
  const minorTickInterval = minor * zoom;
  const startX = rulerStartX + pan.x;
  const endX = rulerStartX + rulerWidth;

  ctx.lineWidth = 1;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';

  for (let x = startX; x <= endX; x += minorTickInterval) {
    const isMajor = Math.abs((x - startX) % majorTickInterval) < 0.1;

    ctx.strokeStyle = isMajor ? '#d1d5db' : '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(x, rulerHeight);
    ctx.lineTo(x, rulerHeight - (isMajor ? 5 : 2.5));
    ctx.stroke();

    if (isMajor) {
      const worldX = Math.round((x - startX) / zoom);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(worldX.toString(), x, rulerHeight - 8);
    }
  }
};

export const drawVerticalRuler = (
  ctx: CanvasRenderingContext2D,
  canvasHeight: number,
  zoom: number,
  pan: { x: number; y: number },
  rulerSize: RulerSize,
) => {
  const rulerWidth = rulerSize.left;
  const rulerStartY = rulerSize.top;
  const rulerHeight = canvasHeight - rulerSize.top;

  ctx.fillStyle = '#4b5563';
  ctx.fillRect(0, rulerStartY, rulerWidth, rulerHeight);

  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rulerWidth, rulerStartY);
  ctx.lineTo(rulerWidth, rulerStartY + rulerHeight);
  ctx.stroke();

  const { major, minor } = calculateTickInterval(zoom);
  const majorTickInterval = major * zoom;
  const minorTickInterval = minor * zoom;
  const startY = rulerStartY + pan.y;
  const endY = rulerStartY + rulerHeight;

  ctx.lineWidth = 1;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';

  for (let y = startY; y <= endY; y += minorTickInterval) {
    const isMajor = Math.abs((y - startY) % majorTickInterval) < 0.1;

    ctx.strokeStyle = isMajor ? '#d1d5db' : '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(rulerWidth, y);
    ctx.lineTo(rulerWidth - (isMajor ? 5 : 2.5), y);
    ctx.stroke();

    if (isMajor) {
      const worldY = Math.round((y - startY) / zoom);
      ctx.fillStyle = '#e5e7eb';
      ctx.save();
      ctx.translate(rulerWidth - 8, y + 3);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(worldY.toString(), 0, 0);
      ctx.restore();
    }
  }
};

export const drawSheet = (
  ctx: CanvasRenderingContext2D,
  nestingSettings: { sheetWidth: number; sheetHeight: number; margin: number },
  zoom: number,
  pan: { x: number; y: number },
  rulerSize: RulerSize,
  showDimensions: boolean,
) => {
  const sheetWidth = nestingSettings.sheetWidth;
  const sheetHeight = nestingSettings.sheetHeight;
  const { x, y } = worldToScreen(0, 0, zoom, pan, rulerSize);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, sheetWidth * zoom, sheetHeight * zoom);

  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, sheetWidth * zoom, sheetHeight * zoom);

  const margin = nestingSettings.margin * zoom;
  if (margin > 0) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x + margin, y + margin, sheetWidth * zoom - margin * 2, sheetHeight * zoom - margin * 2);
    ctx.setLineDash([]);
  }

  if (showDimensions) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${sheetWidth}mm`, x + sheetWidth * zoom / 2 - 30, y - 8);
    ctx.fillText(`${sheetHeight}mm`, x - 45, y + sheetHeight * zoom / 2);
  }
};

export const drawPart = (
  ctx: CanvasRenderingContext2D,
  part: Part,
  zoom: number,
  pan: { x: number; y: number },
  rulerSize: RulerSize,
  selectedPartIds: Set<string>,
  showDimensions: boolean,
) => {
  const width = part.dimensions.width;
  const height = part.dimensions.height;
  const x = part.position?.x || 0;
  const y = part.position?.y || 0;
  const rotation = part.rotation || 0;

  ctx.save();
  const screenPos = worldToScreen(x, y, zoom, pan, rulerSize);
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate((rotation * Math.PI) / 180);

  const selected = selectedPartIds.has(part.id);
  ctx.fillStyle = selected ? '#818cf8' : '#d1d5db';
  ctx.fillRect(0, 0, width * zoom, height * zoom);
  ctx.strokeStyle = selected ? '#4f46e5' : '#6b7280';
  ctx.lineWidth = selected ? 3 : 1;
  ctx.strokeRect(0, 0, width * zoom, height * zoom);

  if (showDimensions) {
    ctx.fillStyle = '#374151';
    ctx.font = '10px sans-serif';
    ctx.fillText(part.name, 5, 15);
    ctx.fillText(`×${part.quantity}`, 5, height * zoom - 5);
  }

  ctx.restore();
};
