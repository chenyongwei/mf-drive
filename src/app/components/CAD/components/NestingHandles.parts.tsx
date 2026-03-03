import React from 'react';

import type { BoundingBox, Point } from '../types/NestingTypes';

const HANDLE_SIZE = 24;
const HANDLE_HIT_SIZE = 32;

export const Handle: React.FC<{
  x: number;
  y: number;
  size?: number;
  children: React.ReactNode;
  onPointerDown: (e: React.PointerEvent) => void;
  cursor?: string;
}> = ({ x, y, size = HANDLE_SIZE, children, onPointerDown, cursor = 'pointer' }) => {
  return (
    <g transform={`translate(${x}, ${y})`} onPointerDown={onPointerDown} style={{ cursor }}>
      <circle r={HANDLE_HIT_SIZE / 2} fill="transparent" />
      {children}
    </g>
  );
};

export const RotationHandle: React.FC<{
  center: Point;
  radius: number;
  onStartRotation: () => void;
}> = ({ center, radius, onStartRotation }) => {
  const handleY = center.y - radius;

  return (
    <Handle
      x={center.x}
      y={handleY}
      onPointerDown={(e) => {
        e.stopPropagation();
        onStartRotation();
      }}
      cursor="grab"
    >
      <g transform={`rotate(-90, ${center.x}, ${handleY})`}>
        <circle
          cx={center.x}
          cy={handleY}
          r={HANDLE_SIZE / 2}
          fill="#8b5cf6"
          stroke="white"
          strokeWidth={2}
          opacity={0.9}
        />
        <path
          d={`M ${center.x - 6} ${handleY + 6}
              Q ${center.x - 6} ${handleY - 6} ${center.x} ${handleY - 6}
              Q ${center.x + 6} ${handleY - 6} ${center.x + 6} ${handleY + 6}`}
          stroke="white"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <polygon
          points={`${center.x + 6},${handleY + 6} ${center.x + 2},${handleY + 2} ${center.x + 10},${handleY + 2}`}
          fill="white"
        />
      </g>
    </Handle>
  );
};

export const FlipHandles: React.FC<{
  position: Point;
  boundingBox: BoundingBox;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
}> = ({ position, boundingBox, onFlipHorizontal, onFlipVertical }) => {
  const centerX = position.x + (boundingBox.minX + boundingBox.maxX) / 2;
  const centerY = position.y + (boundingBox.minY + boundingBox.maxY) / 2;
  const halfWidth = (boundingBox.maxX - boundingBox.minX) / 2;
  const halfHeight = (boundingBox.maxY - boundingBox.minY) / 2;

  return (
    <g>
      <Handle
        x={centerX + halfWidth + 20}
        y={centerY}
        onPointerDown={(e) => {
          e.stopPropagation();
          onFlipHorizontal();
        }}
        cursor="ew-resize"
      >
        <rect
          x={-HANDLE_SIZE / 2}
          y={-HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="#f59e0b"
          stroke="white"
          strokeWidth={2}
          opacity={0.9}
          rx={4}
        />
        <path
          d={`M -6 0 L 0 -4 L 0 4 Z M 6 0 L 0 -4 L 0 4 Z`}
          fill="white"
          transform="translate(0, 0)"
        />
      </Handle>

      <Handle
        x={centerX}
        y={centerY + halfHeight + 20}
        onPointerDown={(e) => {
          e.stopPropagation();
          onFlipVertical();
        }}
        cursor="ns-resize"
      >
        <rect
          x={-HANDLE_SIZE / 2}
          y={-HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="#f59e0b"
          stroke="white"
          strokeWidth={2}
          opacity={0.9}
          rx={4}
        />
        <path d={`M 0 -6 L 4 0 L -4 0 Z M 0 6 L 4 0 L -4 0 Z`} fill="white" />
      </Handle>
    </g>
  );
};

export const Protractor: React.FC<{
  center: Point;
  currentAngle: number;
  startAngle: number;
  radius: number;
  isVisible: boolean;
}> = ({ center, currentAngle, startAngle, radius, isVisible }) => {
  if (!isVisible) return null;

  const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
  const currentAngleRad = ((currentAngle - 90) * Math.PI) / 180;

  return (
    <g opacity={0.7}>
      <path
        d={`M ${center.x + Math.cos(startAngleRad) * radius}
              ${center.y + Math.sin(startAngleRad) * radius}
            A ${radius} ${radius} 0 0 1
              ${center.x + Math.cos(currentAngleRad) * radius}
              ${center.y + Math.sin(currentAngleRad) * radius}`}
        stroke="#8b5cf6"
        strokeWidth={2}
        fill="none"
        strokeDasharray="4,4"
      />

      <text
        x={center.x}
        y={center.y - radius - 10}
        textAnchor="middle"
        fontSize={14}
        fill="#8b5cf6"
        stroke="white"
        strokeWidth={3}
        paintOrder="stroke"
        fontWeight="600"
      >
        {Math.round(currentAngle)}°
      </text>
    </g>
  );
};
