/**
 * WebGPURuler - Ruler component for WebGPU CAD view
 *
 * Displays horizontal and vertical rulers with zoom-adaptive ticks
 * Canvas 2D overlay on top of WebGPU renderer
 */

import React, { useRef, useEffect } from 'react';

interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}

interface WebGPURulerProps {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  rulerSize: { width: number; height: number };
  theme?: 'dark' | 'light';
}

const WebGPURuler: React.FC<WebGPURulerProps> = ({
  width,
  height,
  zoom,
  pan,
  rulerSize,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed screen pixel intervals (independent of zoom)
    const minorTickPixelInterval = 10; // Small ticks are always 10px apart
    const majorTickPixelInterval = 100; // Major ticks are always 100px apart (10 small intervals)

    // Calculate world intervals based on current zoom
    // Theme-based colors
    const colors = {
      background: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
      border: theme === 'dark' ? '#3a3a3a' : '#cccccc',
      majorTick: theme === 'dark' ? '#ffffff' : '#333333',
      minorTick: theme === 'dark' ? '#9ca3af' : '#999999',
      text: theme === 'dark' ? '#ffffff' : '#333333',
      originTick: theme === 'dark' ? '#ffffff' : '#000000',
    };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Use consistent ruler size for both horizontal and vertical rulers
    const rulerSizeUniform = rulerSize.height; // Use height for both dimensions

    // Fill top-left corner gap first
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, rulerSizeUniform, rulerSizeUniform);

    // Draw horizontal ruler (top)
    const rulerHeight = rulerSizeUniform;
    const rulerStartX = rulerSizeUniform;
    const rulerWidth = width - rulerSizeUniform;

    ctx.fillStyle = colors.background;
    ctx.fillRect(rulerStartX, 0, rulerWidth, rulerHeight);

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerStartX, rulerHeight);
    ctx.lineTo(rulerStartX + rulerWidth, rulerHeight);
    ctx.stroke();

    // Draw ticks across the entire visible ruler area
    const tickStartX = rulerStartX;
    const tickEndX = rulerStartX + rulerWidth;

    // Calculate tick positions aligned to world origin (worldX = 0 at screenX = rulerStartX)
    // Start from worldX=0 and extend in both directions
    const originScreenX = rulerStartX; // World origin (0,0) is at this screen position

    // Find the first tick to the left of the visible area
    const firstTickX = Math.floor((tickStartX - originScreenX) / minorTickPixelInterval) * minorTickPixelInterval + originScreenX;
    const lastTickX = Math.ceil((tickEndX - originScreenX) / minorTickPixelInterval) * minorTickPixelInterval + originScreenX;
    const numTicksX = Math.round((lastTickX - firstTickX) / minorTickPixelInterval) + 1;

    ctx.lineWidth = 1;
    // Calculate font size based on ruler height - make it fill the space
    const fontSizeH = Math.floor(rulerHeight * 0.8);
    ctx.font = `${fontSizeH}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow for better visibility (only in dark mode, light mode text is clear without shadow)
    if (theme === 'dark') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    for (let i = 0; i < numTicksX; i++) {
      const x = firstTickX + i * minorTickPixelInterval;
      if (x < tickStartX || x > tickEndX) continue;

      // Calculate world coordinate from screen coordinate
      const worldX = (x - rulerStartX) / zoom;

      // Check if this is a major tick (screen coordinate is multiple of 100px)
      const screenRemainder = (x - originScreenX) % majorTickPixelInterval;
      const isMajor = screenRemainder < minorTickPixelInterval * 0.5 ||
        screenRemainder > majorTickPixelInterval - minorTickPixelInterval * 0.5;

      if (isMajor) {
        const worldXInt = Math.round(worldX);
        const isOrigin = worldXInt === 0;

        ctx.strokeStyle = isOrigin ? colors.originTick : colors.majorTick;
        ctx.lineWidth = isOrigin ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight);
        ctx.lineTo(x, rulerHeight - (isOrigin ? 12 : 8));
        ctx.stroke();

        // Always draw text for origin, for others draw if not close to 0
        if (isOrigin || Math.abs(worldXInt) >= 1) {
          ctx.fillStyle = colors.text;
          ctx.fillText(worldXInt.toString(), x, rulerHeight / 2);
        }
      } else {
        ctx.strokeStyle = colors.minorTick;
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight);
        ctx.lineTo(x, rulerHeight - 4);
        ctx.stroke();
      }
    }

    // Reset shadow for non-text elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw vertical ruler (left)
    const rulerVWidth = rulerSizeUniform;
    const rulerStartY = rulerSizeUniform;
    const rulerVHeight = height - rulerSizeUniform;

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, rulerStartY, rulerVWidth, rulerVHeight);

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerVWidth, rulerStartY);
    ctx.lineTo(rulerVWidth, rulerStartY + rulerVHeight);
    ctx.stroke();

    // Draw ticks across the entire visible ruler area
    const tickStartY = rulerStartY;
    const tickEndY = rulerStartY + rulerVHeight;

    // Calculate tick positions aligned to world origin (worldY = 0 at screenY = rulerStartY)
    // Start from worldY=0 and extend in both directions
    const originScreenY = rulerStartY; // World origin (0,0) is at this screen position

    // Find the first tick to the left of the visible area
    const firstTickY = Math.floor((tickStartY - originScreenY) / minorTickPixelInterval) * minorTickPixelInterval + originScreenY;
    const lastTickY = Math.ceil((tickEndY - originScreenY) / minorTickPixelInterval) * minorTickPixelInterval + originScreenY;
    const numTicksY = Math.round((lastTickY - firstTickY) / minorTickPixelInterval) + 1;

    ctx.lineWidth = 1;
    // Calculate font size based on ruler width - make it fill the space
    const fontSizeV = Math.floor(rulerVWidth * 0.8);
    ctx.font = `${fontSizeV}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow for better visibility (only in dark mode, light mode text is clear without shadow)
    if (theme === 'dark') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    for (let i = 0; i < numTicksY; i++) {
      const y = firstTickY + i * minorTickPixelInterval;
      if (y < tickStartY || y > tickEndY) continue;

      // Calculate world coordinate from screen coordinate
      const worldY = (y - rulerStartY) / zoom;

      // Check if this is a major tick (screen coordinate is multiple of 100px)
      const screenRemainder = (y - originScreenY) % majorTickPixelInterval;
      const isMajor = screenRemainder < minorTickPixelInterval * 0.5 ||
        screenRemainder > majorTickPixelInterval - minorTickPixelInterval * 0.5;

      if (isMajor) {
        const worldYInt = Math.round(worldY);
        const isOrigin = worldYInt === 0;

        ctx.strokeStyle = isOrigin ? colors.originTick : colors.majorTick;
        ctx.lineWidth = isOrigin ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(rulerVWidth, y);
        ctx.lineTo(rulerVWidth - (isOrigin ? 12 : 8), y);
        ctx.stroke();

        // Always draw text for origin, for others draw if not close to 0
        if (isOrigin || Math.abs(worldYInt) >= 1) {
          ctx.fillStyle = colors.text;
          ctx.save();
          // Center text in the middle of the ruler width
          // Rotate -90 degrees so text reads horizontally
          ctx.translate(rulerVWidth / 2, y);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(worldYInt.toString(), 0, 0);
          ctx.restore();
        }
      } else {
        ctx.strokeStyle = colors.minorTick;
        ctx.beginPath();
        ctx.moveTo(rulerVWidth, y);
        ctx.lineTo(rulerVWidth - 4, y);
        ctx.stroke();
      }
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, [width, height, zoom, pan.x, pan.y, rulerSize, theme]);

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

export default WebGPURuler;
