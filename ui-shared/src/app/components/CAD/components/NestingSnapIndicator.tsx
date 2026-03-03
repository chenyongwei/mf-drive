/**
 * Nesting Snap Indicator Component
 *
 * Renders visual feedback for snapping:
 * - Snap point highlights (circles, squares, diamonds)
 * - Magnetic effect when snapped
 * - Snap type indicators
 * - Connection lines between snapped points
 */

import React from 'react';
import { SnapPoint, SnapType } from '../hooks/useNestingSnapping';
import { Point } from '../types/NestingTypes';

interface NestingSnapIndicatorProps {
  snapPoint: SnapPoint;
  targetPoint: SnapPoint;
  snapType: string;
  visible?: boolean;
  scale?: number; // For scaling with zoom
}

/**
 * Render a single snap point marker
 */
const SnapPointMarker: React.FC<{
  point: Point;
  type: SnapType;
  isTarget?: boolean;
  size?: number;
  color?: string;
}> = ({ point, type, isTarget = false, size = 12, color }) => {
  const defaultColor = isTarget ? '#22c55e' : '#3b82f6'; // Green for target, blue for source
  const markerColor = color || defaultColor;

  // Different shapes for different snap types
  const renderMarker = () => {
    switch (type) {
      case 'corner':
        // Diamond shape for corners
        return (
          <rect
            x={point.x - size / 2}
            y={point.y - size / 2}
            width={size}
            height={size}
            fill={markerColor}
            stroke="white"
            strokeWidth={2}
            transform={`rotate(45, ${point.x}, ${point.y})`}
            opacity={0.9}
          />
        );

      case 'center':
        // Circle for centers
        return (
          <circle
            cx={point.x}
            cy={point.y}
            r={size / 2}
            fill={markerColor}
            stroke="white"
            strokeWidth={2}
            opacity={0.9}
          />
        );

      case 'edge':
        // Square for edge points
        return (
          <rect
            x={point.x - size / 3}
            y={point.y - size / 3}
            width={size / 1.5}
            height={size / 1.5}
            fill={markerColor}
            stroke="white"
            strokeWidth={2}
            opacity={0.9}
          />
        );

      default:
        return null;
    }
  };

  return <>{renderMarker()}</>;
};

/**
 * Snap indicator showing connection between snapped points
 */
export const NestingSnapIndicator: React.FC<NestingSnapIndicatorProps> = ({
  snapPoint,
  targetPoint,
  snapType,
  visible = true,
  scale = 1,
}) => {
  if (!visible) return null;

  const size = 12 * scale;

  // Determine color based on snap type
  const getSnapColor = () => {
    switch (snapType) {
      case 'corner-to-corner':
        return '#22c55e'; // Green
      case 'center-to-center':
      case 'horizontal-center':
      case 'vertical-center':
        return '#8b5cf6'; // Purple
      case 'edge-to-edge-parallel':
        return '#f59e0b'; // Orange
      case 'edge-to-edge':
        return '#06b6d4'; // Cyan
      case 'point-to-edge':
        return '#ec4899'; // Pink
      default:
        return '#3b82f6'; // Blue
    }
  };

  const snapColor = getSnapColor();

  // Render connection line between snap points
  const renderConnectionLine = () => {
    const dx = targetPoint.position.x - snapPoint.position.x;
    const dy = targetPoint.position.y - snapPoint.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only show line if points are far enough apart
    if (distance < 20) return null;

    return (
      <line
        x1={snapPoint.position.x}
        y1={snapPoint.position.y}
        x2={targetPoint.position.x}
        y2={targetPoint.position.y}
        stroke={snapColor}
        strokeWidth={2}
        strokeDasharray="5,5"
        opacity={0.6}
      />
    );
  };

  // Render snap type label
  const renderSnapLabel = () => {
    // Calculate midpoint for label
    const midX = (snapPoint.position.x + targetPoint.position.x) / 2;
    const midY = (snapPoint.position.y + targetPoint.position.y) / 2;

    // Format snap type for display
    const label = snapType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
      <text
        x={midX}
        y={midY - 15}
        textAnchor="middle"
        fontSize={12 * scale}
        fill={snapColor}
        stroke="white"
        strokeWidth={3}
        paintOrder="stroke"
        fontWeight="600"
        opacity={0.95}
      >
        {label}
      </text>
    );
  };

  return (
    <g className="nesting-snap-indicator">
      {/* Connection line */}
      {renderConnectionLine()}

      {/* Source snap point */}
      <SnapPointMarker
        point={snapPoint.position}
        type={snapPoint.type}
        isTarget={false}
        size={size}
        color={snapColor}
      />

      {/* Target snap point */}
      <SnapPointMarker
        point={targetPoint.position}
        type={targetPoint.type}
        isTarget={true}
        size={size}
        color={snapColor}
      />

      {/* Snap type label */}
      {renderSnapLabel()}
    </g>
  );
};

/**
 * Magnetic snap effect (pulsing circle when snapped)
 */
export const MagneticSnapEffect: React.FC<{
  position: Point;
  active?: boolean;
  scale?: number;
}> = ({ position, active = true, scale = 1 }) => {
  if (!active) return null;

  return (
    <g className="magnetic-snap-effect">
      {/* Pulsing outer circle */}
      <circle
        cx={position.x}
        cy={position.y}
        r={20 * scale}
        fill="none"
        stroke="#22c55e"
        strokeWidth={2}
        opacity={0.5}
      >
        <animate
          attributeName="r"
          values={`${15 * scale};${25 * scale};${15 * scale}`}
          dur="1s"
          repeatCount="1"
        />
        <animate
          attributeName="opacity"
          values="0.8;0.2;0.8"
          dur="1s"
          repeatCount="1"
        />
      </circle>

      {/* Inner solid circle */}
      <circle
        cx={position.x}
        cy={position.y}
        r={8 * scale}
        fill="#22c55e"
        opacity={0.8}
      />
    </g>
  );
};

/**
 * Snap tolerance indicator (shows snap radius around cursor)
 */
export const SnapToleranceIndicator: React.FC<{
  position: Point;
  tolerance: number;
  scale?: number;
}> = ({ position, tolerance, scale = 1 }) => {
  const radius = tolerance * scale;

  return (
    <circle
      cx={position.x}
      cy={position.y}
      r={radius}
      fill="none"
      stroke="#3b82f6"
      strokeWidth={1}
      strokeDasharray="3,3"
      opacity={0.3}
    />
  );
};
