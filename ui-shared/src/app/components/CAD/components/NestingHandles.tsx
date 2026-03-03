/**
 * Nesting Handles Component
 *
 * On-canvas manipulation controls for nesting parts:
 * - Rotation handle (circular arrow)
 * - Flip handles (horizontal/vertical arrows)
 * - Anchor point selector
 */

import React, { useCallback } from 'react';
import { Point } from '../types/NestingTypes';
import { BoundingBox } from '../types/NestingTypes';
import {
  FlipHandles,
  Handle,
  Protractor,
  RotationHandle,
} from './NestingHandles.parts';

interface NestingHandlesProps {
  partId: string;
  position: Point;
  rotation: number;
  boundingBox: BoundingBox;
  viewport: { zoom: number; pan: { x: number; y: number } };
  theme: 'light' | 'dark';
  onRotate?: (angle: number) => void;
  onMirror?: (direction: 'horizontal' | 'vertical') => void;
  onAnchorChange?: (anchor: Point) => void;
  visible?: boolean;
  scale?: number;
}

/**
 * Main nesting handles component
 */
export const NestingHandles: React.FC<NestingHandlesProps> = ({
  partId,
  position,
  rotation,
  boundingBox,
  viewport,
  theme,
  onRotate,
  onMirror,
  onAnchorChange,
  visible = true,
  scale = 1,
}) => {
  if (!visible) return null;

  // Calculate center point
  const centerX = position.x + (boundingBox.minX + boundingBox.maxX) / 2;
  const centerY = position.y + (boundingBox.minY + boundingBox.maxY) / 2;
  const center: Point = { x: centerX, y: centerY };

  const halfWidth = (boundingBox.maxX - boundingBox.minX) / 2;
  const halfHeight = (boundingBox.maxY - boundingBox.minY) / 2;
  const maxDimension = Math.max(halfWidth, halfHeight);
  const radius = maxDimension + 40;

  const handleFlipHorizontal = useCallback(() => {
    onMirror?.('horizontal');
  }, [onMirror]);

  const handleFlipVertical = useCallback(() => {
    onMirror?.('vertical');
  }, [onMirror]);

  const handleStartRotation = useCallback(() => {
    // Rotation will be handled by parent component
    // This just signals intent to rotate
    console.log('Start rotation for part:', partId);
  }, [partId]);

  return (
    <g className="nesting-handles" pointerEvents="all">
      {/* Protractor (shows during rotation) */}
      <Protractor
        center={center}
        currentAngle={rotation}
        startAngle={0}
        radius={radius}
        isVisible={false} // Only visible during drag
      />

      {/* Rotation handle */}
      <RotationHandle
        center={center}
        radius={radius}
        onStartRotation={handleStartRotation}
      />

      {/* Flip handles */}
      {onMirror && (
        <FlipHandles
          position={position}
          boundingBox={boundingBox}
          onFlipHorizontal={handleFlipHorizontal}
          onFlipVertical={handleFlipVertical}
        />
      )}

      {/* Center anchor point */}
      <Handle
        x={centerX}
        y={centerY}
        onPointerDown={(e) => {
          e.stopPropagation();
          onAnchorChange?.(center);
        }}
        cursor="move"
      >
        <circle
          r={8}
          fill="#ec4899"
          stroke="white"
          strokeWidth={2}
          opacity={0.9}
        />
        <circle
          r={4}
          fill="white"
        />
      </Handle>
    </g>
  );
};

export default NestingHandles;
