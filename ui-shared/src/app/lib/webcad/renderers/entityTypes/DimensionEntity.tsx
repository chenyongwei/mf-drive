import React from 'react';
import { Line, Text as KonvaText } from 'react-konva';

interface DimensionEntityProps {
  entity: any;
  isSelected: boolean;
  strokeColor: string;
  clampedStrokeWidth: number;
  strokeDashArray: number[];
  viewZoom: number;
  onClick: (e: any) => void;
}

export function DimensionEntity({
  entity,
  isSelected,
  strokeColor,
  clampedStrokeWidth,
  strokeDashArray,
  viewZoom,
  onClick,
}: DimensionEntityProps) {
  const geo = entity.geometry;
  const points = (geo.points || []).map((p: any) => [p.x, -p.y]).flat();

  return (
    <React.Fragment key={entity.id}>
      {/* Dimension lines */}
      {points.length >= 4 && (
        <Line
          points={points}
          stroke={strokeColor}
          strokeWidth={clampedStrokeWidth}
          lineCap="round"
          lineJoin="round"
          dash={strokeDashArray}
          dashEnabled={strokeDashArray.length > 0}
          onClick={onClick}
        />
      )}
      {/* Dimension text */}
      {geo.text && geo.textPosition && (
        <KonvaText
          x={geo.textPosition.x}
          y={-geo.textPosition.y}
          text={geo.text}
          fontSize={Math.min(Math.max(12 * viewZoom, 8), 100)}
          fill={strokeColor}
          onClick={onClick}
        />
      )}
    </React.Fragment>
  );
}
