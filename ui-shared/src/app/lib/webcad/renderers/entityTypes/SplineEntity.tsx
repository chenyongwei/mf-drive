import { Line } from 'react-konva';
import { toKonvaPoints } from './entityLineHelpers';

interface SplineEntityProps {
  entity: any;
  isSelected: boolean;
  strokeColor: string;
  clampedStrokeWidth: number;
  strokeDashArray: number[];
  viewZoom?: number;
  onClick: (e: any) => void;
}

export function SplineEntity({
  entity,
  isSelected,
  strokeColor,
  clampedStrokeWidth,
  strokeDashArray,
  viewZoom = 1,
  onClick,
}: SplineEntityProps) {
  const geo = entity.geometry;
  // Try controlPoints first, fall back to points
  const splinePoints = geo.controlPoints || geo.points || [];
  if (!Array.isArray(splinePoints) || splinePoints.length === 0) {
    return null;
  }

  const points = toKonvaPoints(splinePoints);

  return (
    <Line
      key={entity.id}
      points={points}
      stroke={strokeColor}
      strokeWidth={clampedStrokeWidth * viewZoom}
      lineCap="round"
      lineJoin="round"
      closed={geo.closed}
      tension={0.5} // Smooth curve
      dash={strokeDashArray}
      dashEnabled={strokeDashArray.length > 0}
      onClick={onClick}
    />
  );
}
