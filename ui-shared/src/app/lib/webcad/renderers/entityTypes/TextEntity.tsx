import { Text } from 'react-konva';

interface TextEntityProps {
  entity: any;
  isSelected: boolean;
  strokeColor: string;
  clampedStrokeWidth: number;
  viewZoom: number;
  onClick: (e: any) => void;
}

export function TextEntity({
  entity,
  isSelected,
  strokeColor,
  clampedStrokeWidth,
  viewZoom,
  onClick,
}: TextEntityProps) {
  const geo = entity.geometry;
  if (!geo.position || !geo.text) {
    return null;
  }

  // Base font size from DXF (in drawing units)
  const baseFontSize = geo.height || 12;
  // Calculate font size to keep text readable at all zoom levels
  const scaledFontSize = baseFontSize / viewZoom;
  const clampedFontSize = Math.min(Math.max(scaledFontSize, 8), 100);

  return (
    <Text
      key={entity.id}
      x={geo.position.x}
      y={-geo.position.y}
      text={geo.text}
      fontSize={clampedFontSize}
      fill={strokeColor}
      rotation={(geo.rotation || 0) * (180 / Math.PI)} // Convert radians to degrees
      fontStyle={geo.style || 'normal'}
      listening={true}
      onClick={onClick}
    />
  );
}
