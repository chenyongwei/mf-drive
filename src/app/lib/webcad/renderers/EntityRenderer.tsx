import { useAppStore } from '../../../store';
import { getAutocadColor } from '../../../utils/autocadColors';
import { LineEntity } from './entityTypes/LineEntity';
import { ArcEntity } from './entityTypes/ArcEntity';
import { PolylineEntity } from './entityTypes/PolylineEntity';
import { SplineEntity } from './entityTypes/SplineEntity';
import { TextEntity } from './entityTypes/TextEntity';
import { DimensionEntity } from './entityTypes/DimensionEntity';
import { SolidEntity } from './entityTypes/SolidEntity';

interface EntityRendererProps {
  entity: any;
  viewZoom: number;
  useLayerMapping?: boolean; // Use original colors if false
}

export function EntityRenderer({ entity, viewZoom, useLayerMapping = true }: EntityRendererProps) {
  const { getLayerMapping, selection, setSelection } = useAppStore();

  // Validate geometry exists
  if (!entity.geometry) {
    return null;
  }

  // Get stroke style based on layer mapping or use original colors
  let strokeStyle;
  if (useLayerMapping) {
    const processType = getLayerMapping(entity.layer);
    switch (processType) {
      case 'CUT':
        strokeStyle = { color: '#00ff00', dash: [] }; // Green solid line
        break;
      case 'MARK':
        strokeStyle = { color: '#00ffff', dash: [10, 5] }; // Cyan dashed line
        break;
      case 'NONE':
        strokeStyle = { color: '#ffffff', dash: [] }; // White solid line
        break;
      default:
        // Use original AutoCAD color if no mapping
        const entityColor = getAutocadColor(entity.color || 7);
        strokeStyle = { color: entityColor, dash: [] };
    }
  } else {
    // Always use original AutoCAD color (for nesting view)
    const entityColor = getAutocadColor(entity.color || 7);
    strokeStyle = { color: entityColor, dash: [] };
  }

  const isSelected = selection.entities.includes(entity.id);
  const strokeColor = isSelected ? '#ff0000' : strokeStyle.color;
  const strokeDashArray = strokeStyle.dash;

  // Keep stroke width at 1 regardless of zoom level
  const clampedStrokeWidth = isSelected ? 2 : 1;

  const handleEntityClick = (e: any) => {
    e.cancelBubble = true;
    setSelection({ entities: [entity.id] });
  };

  // Render based on entity type
  switch (entity.type) {
    case 'LINE':
      return (
        <LineEntity
          entity={entity}
          isSelected={isSelected}
          strokeColor={strokeColor}
          clampedStrokeWidth={clampedStrokeWidth}
          strokeDashArray={strokeDashArray}
          viewZoom={viewZoom}
          onClick={handleEntityClick}
        />
      );

    case 'ARC':
    case 'CIRCLE':
      return (
        <ArcEntity
          entity={entity}
          isSelected={isSelected}
          strokeColor={strokeColor}
          clampedStrokeWidth={clampedStrokeWidth}
          viewZoom={viewZoom}
          onClick={handleEntityClick}
        />
      );

    case 'POLYLINE':
      return (
        <PolylineEntity
          entity={entity}
          isSelected={isSelected}
          strokeColor={strokeColor}
          clampedStrokeWidth={clampedStrokeWidth}
          strokeDashArray={strokeDashArray}
          viewZoom={viewZoom}
          onClick={handleEntityClick}
        />
      );

    case 'SPLINE':
      return (
        <SplineEntity
          entity={entity}
          isSelected={isSelected}
          strokeColor={strokeColor}
          clampedStrokeWidth={clampedStrokeWidth}
          strokeDashArray={strokeDashArray}
          viewZoom={viewZoom}
          onClick={handleEntityClick}
        />
      );

    case 'TEXT':
    case 'MTEXT':
      return (
        <TextEntity
          entity={entity}
          isSelected={isSelected}
          strokeColor={strokeColor}
          clampedStrokeWidth={clampedStrokeWidth}
          viewZoom={viewZoom}
          onClick={handleEntityClick}
        />
      );

    case 'DIMENSION':
      return (
        <DimensionEntity
          entity={entity}
          isSelected={isSelected}
          strokeColor={strokeColor}
          clampedStrokeWidth={clampedStrokeWidth}
          strokeDashArray={strokeDashArray}
          viewZoom={viewZoom}
          onClick={handleEntityClick}
        />
      );

    case 'SOLID':
      return (
        <SolidEntity
          entity={entity}
          isSelected={isSelected}
          strokeColor={strokeColor}
          clampedStrokeWidth={clampedStrokeWidth}
          viewZoom={viewZoom}
          onClick={handleEntityClick}
        />
      );

    default:
      return null;
  }
}
