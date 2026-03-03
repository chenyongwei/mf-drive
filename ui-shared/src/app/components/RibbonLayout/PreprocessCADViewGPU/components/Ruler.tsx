import React, { useRef, useEffect } from 'react';

interface RulerProps {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  rulerSize: { width: number; height: number };
}

/**
 * Ruler component - displays horizontal and vertical rulers with tick marks
 */
export const Ruler: React.FC<RulerProps> = ({ width, height, zoom, pan, rulerSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate tick interval based on zoom
    const calculateTickInterval = (currentZoom: number) => {
      const targetPixelInterval = 100;
      const worldInterval = targetPixelInterval / currentZoom;
      const magnitude = Math.pow(10, Math.floor(Math.log10(worldInterval)));
      const baseValue = worldInterval / magnitude;

      let majorInterval: number;
      let minorInterval: number;

      if (baseValue <= 2) {
        majorInterval = 1 * magnitude;
        minorInterval = 0.2 * magnitude;
      } else if (baseValue <= 5) {
        majorInterval = 2 * magnitude;
        minorInterval = 0.5 * magnitude;
      } else {
        majorInterval = 5 * magnitude;
        minorInterval = 1 * magnitude;
      }

      return { major: majorInterval, minor: minorInterval };
    };

    const { major, minor } = calculateTickInterval(zoom);
    const majorTickInterval = major * zoom;
    const minorTickInterval = minor * zoom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw horizontal ruler (top)
    const rulerHeight = rulerSize.height;
    const rulerStartX = rulerSize.width;
    const rulerWidth = width - rulerSize.width;

    ctx.fillStyle = '#4b5563';
    ctx.fillRect(rulerStartX, 0, rulerWidth, rulerHeight);

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerStartX, rulerHeight);
    ctx.lineTo(rulerStartX + rulerWidth, rulerHeight);
    ctx.stroke();

    const startX = rulerStartX + pan.x;
    const endX = rulerStartX + rulerWidth;

    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    for (let x = startX; x <= endX; x += minorTickInterval) {
      const isMajor = Math.abs((x - startX) % majorTickInterval) < 0.1;

      if (isMajor) {
        ctx.strokeStyle = '#d1d5db';
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight);
        ctx.lineTo(x, rulerHeight - 5);
        ctx.stroke();

        const worldX = Math.round((x - startX) / zoom);
        ctx.fillStyle = '#e5e7eb';
        ctx.fillText(worldX.toString(), x, rulerHeight - 8);
      } else {
        ctx.strokeStyle = '#9ca3af';
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight);
        ctx.lineTo(x, rulerHeight - 2);
        ctx.stroke();
      }
    }

    // Draw vertical ruler (left)
    const rulerVWidth = rulerSize.width;
    const rulerStartY = rulerSize.height;
    const rulerVHeight = height - rulerSize.height;

    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, rulerStartY, rulerVWidth, rulerVHeight);

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerVWidth, rulerStartY);
    ctx.lineTo(rulerVWidth, rulerStartY + rulerVHeight);
    ctx.stroke();

    const startY = rulerStartY + pan.y;
    const endY = rulerStartY + rulerVHeight;

    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';

    for (let y = startY; y <= endY; y += minorTickInterval) {
      const isMajor = Math.abs((y - startY) % majorTickInterval) < 0.1;

      if (isMajor) {
        ctx.strokeStyle = '#d1d5db';
        ctx.beginPath();
        ctx.moveTo(rulerVWidth, y);
        ctx.lineTo(rulerVWidth - 5, y);
        ctx.stroke();

        const worldY = Math.round((y - startY) / zoom);
        ctx.fillStyle = '#e5e7eb';
        ctx.save();
        ctx.translate(rulerVWidth - 8, y + 3);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(worldY.toString(), 0, 0);
        ctx.restore();
      } else {
        ctx.strokeStyle = '#9ca3af';
        ctx.beginPath();
        ctx.moveTo(rulerVWidth, y);
        ctx.lineTo(rulerVWidth - 2, y);
        ctx.stroke();
      }
    }
  }, [width, height, zoom, pan, rulerSize]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};
