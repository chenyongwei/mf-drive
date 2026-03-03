import { Line } from 'react-konva';

interface LineEntityProps {
  entity: any;
  isSelected: boolean;
  strokeColor: string;
  clampedStrokeWidth: number;
  strokeDashArray: number[];
  viewZoom?: number;
  onClick: (e: any) => void;
}

export function LineEntity({
  entity,
  isSelected,
  strokeColor,
  clampedStrokeWidth,
  strokeDashArray,
  viewZoom = 1,
  onClick,
}: LineEntityProps) {
  const geo = entity.geometry;
  if (!geo.start || !geo.end) {
    return null;
  }

  return (
    <Line
      key={entity.id}
      points={[
        geo.start.x,
        -geo.start.y, // Flip Y for screen coordinates
        geo.end.x,
        -geo.end.y,
      ]}
      stroke={strokeColor}
      strokeWidth={clampedStrokeWidth * viewZoom}
      lineCap="round"
      lineJoin="round"
      dash={strokeDashArray}
      dashEnabled={strokeDashArray.length > 0}
      onClick={onClick}
    />
  );
}
