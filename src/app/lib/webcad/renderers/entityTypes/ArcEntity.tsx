import { Circle } from 'react-konva';

interface ArcEntityProps {
  entity: any;
  isSelected: boolean;
  strokeColor: string;
  clampedStrokeWidth: number;
  viewZoom?: number;
  onClick: (e: any) => void;
}

export function ArcEntity({
  entity,
  isSelected,
  strokeColor,
  clampedStrokeWidth,
  viewZoom = 1,
  onClick,
}: ArcEntityProps) {
  const geo = entity.geometry;
  if (!geo.center || typeof geo.radius !== 'number') {
    return null;
  }

  const r = geo.radius;
  return (
    <Circle
      key={entity.id}
      x={geo.center.x}
      y={-geo.center.y}
      radius={r}
      stroke={strokeColor}
      strokeWidth={clampedStrokeWidth * viewZoom}
      onClick={onClick}
    />
  );
}
