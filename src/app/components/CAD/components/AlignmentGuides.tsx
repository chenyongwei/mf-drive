/**
 * Alignment Guides Component
 *
 * Renders visual alignment guides during part drag:
 * - Horizontal/vertical point-to-point alignment connectors (dashed)
 * - Distance indicators showing gap between parts
 * - Smart extension lines that show alignment relationships
 */

import React from 'react';
import type { Point } from '../types/NestingTypes';
import type { AlignmentGuide } from './AlignmentGuides.types';

export { calculateAlignmentGuides } from './alignmentGuides.calc';
export type { AlignmentGuide, AlignmentGuideOptions } from './AlignmentGuides.types';

interface AlignmentGuidesProps {
  guides: AlignmentGuide[];
  visible?: boolean;
  scale?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  zoom?: number;
  pan?: Point;
  theme?: 'dark' | 'light';
}

/**
 * Single alignment line (horizontal or vertical)
 */
const AlignmentLine: React.FC<{
  guide: AlignmentGuide;
  scale: number;
  theme: 'dark' | 'light';
}> = ({ guide, scale, theme }) => {
  const isHorizontal = guide.type === 'horizontal';
  const isStrong = guide.strength === 'strong';

  const strongColor = theme === 'light' ? '#16a34a' : '#22c55e'; // Darker green for light mode
  const weakColor = theme === 'light' ? '#ca8a04' : '#eab308'; // Darker yellow/orange for light mode
  const color = isStrong ? strongColor : weakColor;
  const strokeWidth = isStrong ? 2 : 1.5;
  const strokeDasharray = isStrong ? '5,5' : '4,4';
  const dx = guide.endPoint.x - guide.startPoint.x;
  const dy = guide.endPoint.y - guide.startPoint.y;
  const lineLength = Math.hypot(dx, dy);
  if (lineLength <= 0.5) return null;
  const endpointRadius = Math.max(2.5, 3 * scale);

  return (
    <g className={isHorizontal ? 'alignment-horizontal-link' : 'alignment-vertical-link'}>
      <line
        x1={guide.startPoint.x}
        y1={guide.startPoint.y}
        x2={guide.endPoint.x}
        y2={guide.endPoint.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        opacity={0.75}
      />
      <circle
        cx={guide.startPoint.x}
        cy={guide.startPoint.y}
        r={endpointRadius}
        fill={color}
        stroke="white"
        strokeWidth={1.5}
        opacity={0.95}
      />
      <circle
        cx={guide.endPoint.x}
        cy={guide.endPoint.y}
        r={endpointRadius}
        fill={color}
        stroke="white"
        strokeWidth={1.5}
        opacity={0.95}
      />
    </g>
  );
};

/**
 * Distance indicator showing gap between parts
 */
const DistanceIndicator: React.FC<{
  guide: AlignmentGuide;
  scale: number;
}> = ({ guide, scale }) => {
  if (guide.distance === undefined) return null;

  const dx = guide.endPoint.x - guide.startPoint.x;
  const dy = guide.endPoint.y - guide.startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= 1e-4) return null;

  // Calculate midpoint for label
  const midX = (guide.startPoint.x + guide.endPoint.x) / 2;
  const midY = (guide.startPoint.y + guide.endPoint.y) / 2;
  const ux = dx / distance;
  const uy = dy / distance;
  const nx = -uy;
  const ny = ux;

  // Draw dimension line with arrows
  const arrowLength = 8 * scale;
  const arrowWidth = 5 * scale;
  const offset = 10 * scale; // Offset from the part

  const lineStart = {
    x: guide.startPoint.x + nx * offset,
    y: guide.startPoint.y + ny * offset,
  };
  const lineEnd = {
    x: guide.endPoint.x + nx * offset,
    y: guide.endPoint.y + ny * offset,
  };
  const labelPoint = {
    x: midX + nx * (offset + 8 * scale),
    y: midY + ny * (offset + 8 * scale),
  };

  // Format distance (in mm)
  const distanceText = `${guide.distance.toFixed(1)}mm`;
  const createArrow = (tip: Point, direction: Point) => {
    const baseCenter = {
      x: tip.x + direction.x * arrowLength,
      y: tip.y + direction.y * arrowLength,
    };
    const perp = {
      x: -direction.y,
      y: direction.x,
    };
    const left = {
      x: baseCenter.x + perp.x * (arrowWidth / 2),
      y: baseCenter.y + perp.y * (arrowWidth / 2),
    };
    const right = {
      x: baseCenter.x - perp.x * (arrowWidth / 2),
      y: baseCenter.y - perp.y * (arrowWidth / 2),
    };
    return `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`;
  };

  return (
    <g className="distance-indicator">
      {/* Extension lines from parts */}
      <line
        x1={guide.startPoint.x}
        y1={guide.startPoint.y}
        x2={lineStart.x}
        y2={lineStart.y}
        stroke="#3b82f6"
        strokeWidth={1}
        opacity={0.5}
      />
      <line
        x1={guide.endPoint.x}
        y1={guide.endPoint.y}
        x2={lineEnd.x}
        y2={lineEnd.y}
        stroke="#3b82f6"
        strokeWidth={1}
        opacity={0.5}
      />

      {/* Dimension line */}
      <line
        x1={lineStart.x}
        y1={lineStart.y}
        x2={lineEnd.x}
        y2={lineEnd.y}
        stroke="#3b82f6"
        strokeWidth={1.5}
      />

      {/* Arrowheads */}
      <polygon
        points={createArrow(lineStart, { x: ux, y: uy })}
        fill="#3b82f6"
      />
      <polygon
        points={createArrow(lineEnd, { x: -ux, y: -uy })}
        fill="#3b82f6"
      />

      {/* Distance label */}
      <text
        x={labelPoint.x}
        y={labelPoint.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fill="#3b82f6"
        stroke="white"
        strokeWidth={3}
        paintOrder="stroke"
        fontWeight="600"
      >
        {distanceText}
      </text>
    </g>
  );
};

/**
 * Main alignment guides component
 */
export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({
  guides,
  visible = true,
  scale = 1,
  canvasWidth = 2000,
  canvasHeight = 1500,
  zoom = 1,
  pan = { x: 0, y: 0 },
  theme = 'dark',
}) => {
  if (!visible || guides.length === 0) return null;

  const screenGuides = React.useMemo(() => {
    const safeZoom = Number.isFinite(zoom) && Math.abs(zoom) > 1e-6 ? zoom : 1;
    const toScreenPoint = (point: Point): Point => ({
      x: point.x * safeZoom + pan.x,
      y: point.y * safeZoom + pan.y,
    });

    return guides.map((guide) => ({
      ...guide,
      position: guide.position * safeZoom + (guide.type === 'horizontal' ? pan.y : pan.x),
      startPoint: toScreenPoint(guide.startPoint),
      endPoint: toScreenPoint(guide.endPoint),
    }));
  }, [guides, zoom, pan.x, pan.y]);

  return (
    <g className="alignment-guides">
      {screenGuides.map((guide, index) => {
        if (guide.type === 'distance') {
          return (
            <DistanceIndicator
              key={`distance-${index}`}
              guide={guide}
              scale={scale}
            />
          );
        } else {
          return (
            <AlignmentLine
              key={`alignment-${index}`}
              guide={guide}
              scale={scale}
              theme={theme}
            />
          );
        }
      })}
    </g>
  );
};
