import React from 'react';
import { Rect } from 'react-konva';

interface SolidEntityProps {
  entity: any;
  isSelected: boolean;
  strokeColor: string;
  clampedStrokeWidth: number;
  viewZoom?: number;
  onClick: (e: any) => void;
}

export function SolidEntity({
  entity,
  isSelected,
  strokeColor,
  clampedStrokeWidth,
  viewZoom = 1,
  onClick,
}: SolidEntityProps) {
  const geo = entity.geometry;
  if (!geo.points || !Array.isArray(geo.points) || geo.points.length === 0) {
    return null;
  }

  const points: number[] = [];
  geo.points.forEach((p: any) => {
    points.push(p.x, -p.y);
  });

  return (
    <React.Fragment key={entity.id}>
      {/* Filled polygon */}
      {points.length >= 6 && (
        <Rect
          x={Math.min(...points.filter((_, i) => i % 2 === 0))}
          y={Math.min(...points.filter((_, i) => i % 2 === 1))}
          width={Math.max(...points.filter((_, i) => i % 2 === 0)) - Math.min(...points.filter((_, i) => i % 2 === 0))}
          height={Math.max(...points.filter((_, i) => i % 2 === 1)) - Math.min(...points.filter((_, i) => i % 2 === 1))}
          fill={isSelected ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)'}
          stroke={strokeColor}
          strokeWidth={clampedStrokeWidth * viewZoom}
          onClick={onClick}
        />
      )}
    </React.Fragment>
  );
}
