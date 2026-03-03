import React from 'react';
import { Group, Line, Circle, RegularPolygon, Text } from 'react-konva';
import type { Layout, PlacedPart, ScrapLine } from '@dxf-fix/shared';
import { EntityRenderer } from './EntityRenderer';

interface NestingLayoutRendererProps {
  layout: Layout | null;
  materialWidth: number;
  materialHeight: number;
  selectedPartId: string | null;
  onPartClick?: (partId: string) => void;
}

const NestingLayoutRenderer: React.FC<NestingLayoutRendererProps> = ({
  layout,
  materialWidth,
  materialHeight,
  selectedPartId,
  onPartClick,
}) => {
  if (!layout) {
    return null;
  }

  return (
    <Group>
      {/* Material bounds */}
      <Group>
        <Line
          points={[
            0, 0,
            materialWidth, 0,
            materialWidth, materialHeight,
            0, materialHeight,
            0, 0,
          ]}
          stroke="#4b5563"
          strokeWidth={2}
          dash={[10, 5]}
        />
        {/* Material label */}
        <Text
          x={10}
          y={10}
          text={`材料: ${materialWidth}×${materialHeight}mm`}
          fontSize={12}
          fill="#9ca3af"
        />
      </Group>

      {/* Placed parts */}
      {layout.parts.map((part, index) => (
        <PlacedPartRenderer
          key={`${part.partId}_${index}`}
          part={part}
          isSelected={selectedPartId === part.partId}
          onClick={() => onPartClick?.(part.partId)}
        />
      ))}

      {/* Scrap lines */}
      {layout.scrapLines?.map((line) => (
        <ScrapLineRenderer key={line.id} line={line} />
      ))}

      {/* Utilization label */}
      <Text
        x={materialWidth - 10}
        y={materialHeight - 30}
        text={`利用率: ${(layout.utilization * 100).toFixed(1)}%`}
        fontSize={14}
        fill="#10b981"
        align="right"
        fontStyle="bold"
      />
    </Group>
  );
};

interface PlacedPartRendererProps {
  part: PlacedPart;
  isSelected: boolean;
  onClick: () => void;
}

const PlacedPartRenderer: React.FC<PlacedPartRendererProps> = ({
  part,
  isSelected,
  onClick,
}) => {
  const width = part.bbox.maxX - part.bbox.minX;
  const height = part.bbox.maxY - part.bbox.minY;

  return (
    <Group
      x={part.position.x}
      y={part.position.y}
      rotation={part.rotation}
      onClick={onClick}
      onTap={onClick}
    >
      {/* Part entities - render actual geometry */}
      {part.entities && part.entities.length > 0 ? (
        part.entities.map((entity) => (
          <EntityRenderer
            key={entity.id}
            entity={entity}
            viewZoom={1} // Fixed zoom for nesting view
            useLayerMapping={false} // Use original colors for nesting
          />
        ))
      ) : (
        /* Fallback: simplified rect outline if no entities */
        <Line
          points={[
            0, 0,
            width, 0,
            width, height,
            0, height,
            0, 0,
          ]}
          stroke={isSelected ? '#8b5cf6' : '#3b82f6'}
          strokeWidth={isSelected ? 3 : 2}
          fill={isSelected ? '#8b5cf6' : 'rgba(59, 130, 246, 0.1)'}
        />
      )}

      {/* Selection outline (only when selected) */}
      {isSelected && (
        <Line
          points={[
            0, 0,
            width, 0,
            width, height,
            0, height,
            0, 0,
          ]}
          stroke="#8b5cf6"
          strokeWidth={2}
          dash={[4, 4]}
        />
      )}

      {/* Part label */}
      <Text
        x={width / 2}
        y={height / 2}
        text={part.partName}
        fontSize={10}
        fill={isSelected ? '#8b5cf6' : '#6b7280'}
        align="center"
        verticalAlign="middle"
        offsetX={part.partName.length * 3}
        offsetY={5}
        strokeWidth={1}
      />
    </Group>
  );
};

interface ScrapLineRendererProps {
  line: ScrapLine;
}

const ScrapLineRenderer: React.FC<ScrapLineRendererProps> = ({ line }) => {
  switch (line.type) {
    case 'LINE':
      return <LineRenderer line={line} />;
    case 'TRIANGLE':
      return <TriangleRenderer line={line} />;
    case 'TRAPEZOID':
      return <TrapezoidRenderer line={line} />;
    case 'CIRCLE':
      return <CircleRenderer line={line} />;
    case 'PART_OUTER':
      return <ContourRenderer line={line} />;
    default:
      return null;
  }
};

const LineRenderer: React.FC<{ line: ScrapLine }> = ({ line }) => {
  if (line.points.length < 2) return null;
  const points = line.points.flatMap(p => [p.x, p.y]);
  return (
    <Line
      points={points}
      stroke="#f59e0b"
      strokeWidth={2}
      dash={[5, 5]}
    />
  );
};

const TriangleRenderer: React.FC<{ line: ScrapLine }> = ({ line }) => {
  if (line.points.length < 3) return null;
  const points = line.points.flatMap(p => [p.x, p.y]);
  return (
    <Line
      points={points}
      stroke="#f59e0b"
      strokeWidth={2}
      fill="rgba(245, 158, 11, 0.1)"
      dash={[5, 5]}
    />
  );
};

const TrapezoidRenderer: React.FC<{ line: ScrapLine }> = ({ line }) => {
  if (line.points.length < 4) return null;
  const points = line.points.flatMap(p => [p.x, p.y]);
  return (
    <Line
      points={points}
      stroke="#f59e0b"
      strokeWidth={2}
      fill="rgba(245, 158, 11, 0.1)"
      dash={[5, 5]}
    />
  );
};

const CircleRenderer: React.FC<{ line: ScrapLine }> = ({ line }) => {
  if (!line.center || !line.radius) return null;
  return (
    <Group x={line.center.x} y={line.center.y}>
      <Circle
        radius={line.radius}
        stroke="#f59e0b"
        strokeWidth={2}
        fill="rgba(245, 158, 11, 0.1)"
        dash={[5, 5]}
      />
      {/* Center point */}
      <Circle radius={3} fill="#f59e0b" />
    </Group>
  );
};

const ContourRenderer: React.FC<{ line: ScrapLine }> = ({ line }) => {
  if (line.points.length < 2) return null;
  const points = line.points.flatMap(p => [p.x, p.y]);
  return (
    <Line
      points={points}
      stroke="#10b981"
      strokeWidth={2}
      fill="rgba(16, 185, 129, 0.1)"
      dash={[3, 3]}
    />
  );
};

export default NestingLayoutRenderer;
