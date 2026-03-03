/**
 * Text Overlay Component
 *
 * Renders text labels on a synchronized canvas overlay
 */

import React, { useRef, useEffect } from 'react';

interface TextLabel {
  x: number; // World X coordinate
  y: number; // World Y coordinate (text baseline)
  text: string;
  height: number; // Text height in mm
  color: string; // Text color
}

interface TextOverlayProps {
  width: number;
  height: number;
  labels: TextLabel[];
  zoom: number;
  pan: { x: number; y: number };
  rulerSize: { width: number; height: number };
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  width,
  height,
  labels,
  zoom,
  pan,
  rulerSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw each label
    for (const label of labels) {
      // Convert world coordinates to screen coordinates
      const screenX = label.x * zoom + pan.x + rulerSize.width;
      const screenY = label.y * zoom + pan.y + rulerSize.height;

      // Calculate font size (mm to pixels, scaled by zoom)
      const fontSize = Math.max(12, label.height * zoom);

      // Configure font
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = label.color;
      ctx.textBaseline = 'bottom'; // Y coordinate is text baseline
      ctx.textAlign = 'left';

      // Add shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Draw text
      ctx.fillText(label.text, screenX, screenY);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, [width, height, labels, zoom, pan, rulerSize]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width, height }}
    />
  );
};
