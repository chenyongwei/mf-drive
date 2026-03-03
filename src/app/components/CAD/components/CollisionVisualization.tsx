/**
 * Collision Visualization Component
 *
 * Enhanced visual feedback for collisions and violations:
 * - Red highlights for colliding parts
 * - Hatched patterns for overlap areas
 * - Arrow indicators pointing to collision source
 * - Gap violation warnings
 */

import React from 'react';
import { NestingPart, BoundingBox } from '../types/NestingTypes';
import { GapViolation } from '../hooks/useGapControl';
import { PenetrationModeBadge } from './PenetrationModeBadge';

interface CollisionVisualizationProps {
  collidingParts: string[];
  gapViolations: GapViolation[];
  parts: NestingPart[];
  visible?: boolean;
  scale?: number;
}

/**
 * Hatched pattern for overlap areas
 */
const HatchedPattern: React.FC<{
  id: string;
}> = ({ id }) => (
  <pattern
    id={id}
    width="8"
    height="8"
    patternUnits="userSpaceOnUse"
    patternTransform="rotate(45)"
  >
    <rect
      width="8"
      height="8"
      fill="#ef4444"
      opacity={0.3}
    />
    <line
      x1="0"
      y1="0"
      x2="0"
      y2="8"
      stroke="#dc2626"
      strokeWidth={2}
    />
  </pattern>
);

/**
 * Collision highlight overlay for a single part
 */
const PartCollisionOverlay: React.FC<{
  part: NestingPart;
  isColliding: boolean;
  gapViolations: number;
  scale: number;
}> = ({ part, isColliding, gapViolations, scale }) => {
  const bbox = part.boundingBox;
  const x = part.position.x;
  const y = part.position.y;

  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;

  // Determine color based on violation type
  let color = '#ef4444'; // Red for collision
  let label = 'COLLISION';

  if (!isColliding && gapViolations > 0) {
    color = '#f59e0b'; // Orange for gap violation
    label = 'GAP VIOLATION';
  }

  return (
    <g className="part-collision-overlay">
      {/* Highlight border */}
      <rect
        x={x + bbox.minX - 2}
        y={y + bbox.minY - 2}
        width={width + 4}
        height={height + 4}
        fill="none"
        stroke={color}
        strokeWidth={3}
        opacity={0.9}
        rx={4}
      >
        {isColliding && (
          <animate
            attributeName="opacity"
            values="0.9;0.4;0.9"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Hatched fill for collision */}
      {isColliding && (
        <rect
          x={x + bbox.minX}
          y={y + bbox.minY}
          width={width}
          height={height}
          fill={`url(#collision-hatch-${part.id})`}
          opacity={0.5}
        />
      )}

      {/* Warning icon */}
      <g transform={`translate(${x + bbox.maxX + 10}, ${y + bbox.minY})`}>
        <circle
          r={12 * scale}
          fill={color}
          opacity={0.9}
        />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14 * scale}
          fill="white"
          fontWeight="bold"
        >
          !
        </text>
      </g>

      {/* Label */}
      <text
        x={x + (bbox.minX + bbox.maxX) / 2}
        y={y + bbox.minY - 8}
        textAnchor="middle"
        fontSize={12 * scale}
        fill={color}
        stroke="white"
        strokeWidth={3}
        paintOrder="stroke"
        fontWeight="600"
      >
        {label} ({isColliding ? 1 : gapViolations})
      </text>
    </g>
  );
};

/**
 * Gap indicator line between parts
 */
const GapIndicator: React.FC<{
  part1: NestingPart;
  part2: NestingPart;
  gapDistance: number;
  minimumRequired: number;
  scale: number;
}> = ({ part1, part2, gapDistance, minimumRequired, scale }) => {
  const bbox1 = part1.boundingBox;
  const bbox2 = part2.boundingBox;

  // Calculate centers
  const c1x = part1.position.x + (bbox1.minX + bbox1.maxX) / 2;
  const c1y = part1.position.y + (bbox1.minY + bbox1.maxY) / 2;
  const c2x = part2.position.x + (bbox2.minX + bbox2.maxX) / 2;
  const c2y = part2.position.y + (bbox2.minY + bbox2.maxY) / 2;

  const isViolation = gapDistance < minimumRequired;

  return (
    <g className="gap-indicator" opacity={0.8}>
      {/* Line connecting parts */}
      <line
        x1={c1x}
        y1={c1y}
        x2={c2x}
        y2={c2y}
        stroke={isViolation ? '#ef4444' : '#22c55e'}
        strokeWidth={2}
        strokeDasharray="4,4"
      />

      {/* Gap label */}
      <text
        x={(c1x + c2x) / 2}
        y={(c1y + c2y) / 2 - 10}
        textAnchor="middle"
        fontSize={11 * scale}
        fill={isViolation ? '#ef4444' : '#22c55e'}
        stroke="white"
        strokeWidth={3}
        paintOrder="stroke"
        fontWeight="600"
      >
        {gapDistance.toFixed(1)}mm / {minimumRequired}mm
      </text>
    </g>
  );
};

export { PenetrationModeBadge } from './PenetrationModeBadge';

/**
 * Main collision visualization component
 */
export const CollisionVisualization: React.FC<CollisionVisualizationProps> = ({
  collidingParts,
  gapViolations,
  parts,
  visible = true,
  scale = 1,
}) => {
  if (!visible) return null;

  const collidingPartsSet = new Set(collidingParts);
  const gapViolationMap = new Map<string, number>();

  // Count violations per part
  for (const violation of gapViolations) {
    gapViolationMap.set(violation.part1Id, (gapViolationMap.get(violation.part1Id) || 0) + 1);
    gapViolationMap.set(violation.part2Id, (gapViolationMap.get(violation.part2Id) || 0) + 1);
  }

  return (
    <g className="collision-visualization">
      {/* Hatched pattern definition */}
      <defs>
        {collidingParts.map(id => (
          <HatchedPattern key={id} id={`collision-hatch-${id}`} />
        ))}
      </defs>

      {/* Part overlays */}
      {parts.map(part => {
        const isColliding = collidingPartsSet.has(part.id);
        const violations = gapViolationMap.get(part.id) || 0;

        if (!isColliding && violations === 0) return null;

        return (
          <PartCollisionOverlay
            key={part.id}
            part={part}
            isColliding={isColliding}
            gapViolations={violations}
            scale={scale}
          />
        );
      })}

      {/* Gap indicators */}
      {gapViolations.map((violation, index) => {
        const part1 = parts.find(p => p.id === violation.part1Id);
        const part2 = parts.find(p => p.id === violation.part2Id);

        if (!part1 || !part2) return null;

        return (
          <GapIndicator
            key={`gap-${index}`}
            part1={part1}
            part2={part2}
            gapDistance={violation.gapDistance}
            minimumRequired={violation.minimumRequired}
            scale={scale}
          />
        );
      })}
    </g>
  );
};

export default CollisionVisualization;
