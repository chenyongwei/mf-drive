import { Line } from 'react-konva';
import { toKonvaPoints } from './entityLineHelpers';

interface PolylineEntityProps {
  entity: any;
  isSelected: boolean;
  strokeColor: string;
  clampedStrokeWidth: number;
  strokeDashArray: number[];
  viewZoom?: number;
  onClick: (e: any) => void;
}

export function PolylineEntity({
  entity,
  isSelected,
  strokeColor,
  clampedStrokeWidth,
  strokeDashArray,
  viewZoom = 1,
  onClick,
}: PolylineEntityProps) {
  const geo = entity.geometry;
  if (!geo.points || !Array.isArray(geo.points) || geo.points.length === 0) {
    return null;
  }

  const points = toKonvaPoints(geo.points);

  return (
    <Line
      key={entity.id}
      points={points}
      stroke={strokeColor}
      strokeWidth={clampedStrokeWidth * viewZoom}
      lineCap="round"
      lineJoin="round"
      closed={geo.closed}
      dash={strokeDashArray}
      dashEnabled={strokeDashArray.length > 0}
      onClick={onClick}
    />
  );
}
