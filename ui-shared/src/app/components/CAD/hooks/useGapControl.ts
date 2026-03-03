/**
 * Gap Control Hook
 *
 * Manages minimum gap enforcement between parts:
 * - Configurable minimum gap (global and per-part)
 * - Visual gap indicators
 * - Gap checking during drag/rotation
 * - "Pack tighter" optimization
 */

import { useCallback, useMemo } from "react";
import { NestingPart, Point } from "../types/NestingTypes";

export interface GapViolation {
  part1Id: string;
  part2Id: string;
  gapDistance: number;
  minimumRequired: number;
  violationAmount: number;
}

interface UseGapControlOptions {
  minimumGap?: number; // Global minimum gap in world units (mm)
  perPartGaps?: Map<string, number>; // Part-specific minimum gaps
  collisionEngine?: any; // CollisionDetectionEngine instance
}

export const useGapControl = (options: UseGapControlOptions) => {
  const {
    minimumGap = 2, // Default 2mm for laser kerf
    perPartGaps = new Map(),
    collisionEngine,
  } = options;

  /**
   * Get minimum gap for a specific part
   */
  const getMinimumGapForPart = useCallback(
    (partId: string): number => {
      return perPartGaps.get(partId) || minimumGap;
    },
    [perPartGaps, minimumGap],
  );

  /**
   * Get minimum gap between two parts (maximum of their individual requirements)
   */
  const getMinimumGapBetween = useCallback(
    (partId1: string, partId2: string): number => {
      const gap1 = getMinimumGapForPart(partId1);
      const gap2 = getMinimumGapForPart(partId2);
      return Math.max(gap1, gap2);
    },
    [getMinimumGapForPart],
  );

  /**
   * Check if two parts violate minimum gap requirement
   */
  const checkGapViolation = useCallback(
    (part1: NestingPart, part2: NestingPart): GapViolation | null => {
      const minimumRequired = getMinimumGapBetween(part1.id, part2.id);

      // Calculate distance between parts
      const bbox1 = part1.boundingBox;
      const bbox2 = part2.boundingBox;

      // Get world-space bounding boxes
      const p1MinX = part1.position.x + bbox1.minX;
      const p1MaxX = part1.position.x + bbox1.maxX;
      const p1MinY = part1.position.y + bbox1.minY;
      const p1MaxY = part1.position.y + bbox1.maxY;

      const p2MinX = part2.position.x + bbox2.minX;
      const p2MaxX = part2.position.x + bbox2.maxX;
      const p2MinY = part2.position.y + bbox2.minY;
      const p2MaxY = part2.position.y + bbox2.maxY;

      // Check if parts overlap (collision)
      if (
        p1MaxX > p2MinX &&
        p1MinX < p2MaxX &&
        p1MaxY > p2MinY &&
        p1MinY < p2MaxY
      ) {
        return {
          part1Id: part1.id,
          part2Id: part2.id,
          gapDistance: 0,
          minimumRequired,
          violationAmount: minimumRequired,
        };
      }

      // Calculate minimum distance between bounding boxes
      const dx = Math.max(0, Math.max(p1MinX - p2MaxX, p2MinX - p1MaxX));
      const dy = Math.max(0, Math.max(p1MinY - p2MaxY, p2MinY - p1MaxY));
      const gapDistance = Math.sqrt(dx * dx + dy * dy);

      if (gapDistance < minimumRequired) {
        return {
          part1Id: part1.id,
          part2Id: part2.id,
          gapDistance,
          minimumRequired,
          violationAmount: minimumRequired - gapDistance,
        };
      }

      return null;
    },
    [getMinimumGapBetween],
  );

  /**
   * Check all gap violations for a set of parts
   */
  const checkAllViolations = useCallback(
    (parts: NestingPart[]): GapViolation[] => {
      const violations: GapViolation[] = [];

      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const part1 = parts[i];
          const part2 = parts[j];

          // Only check parts on the same plate
          if (part1.plateId && part1.plateId === part2.plateId) {
            const violation = checkGapViolation(part1, part2);
            if (violation) {
              violations.push(violation);
            }
          }
        }
      }

      return violations;
    },
    [checkGapViolation],
  );

  /**
   * Enforce minimum gap by snapping parts apart
   */
  const enforceGap = useCallback(
    (parts: NestingPart[], partId: string, newPosition: Point): Point => {
      const part = parts.find((p) => p.id === partId);
      if (!part) return newPosition;

      const tempPart = { ...part, position: newPosition };
      const violations: GapViolation[] = [];

      // Check against all other parts
      for (const other of parts) {
        if (other.id === partId) continue;
        if (other.plateId !== part.plateId) continue;

        const violation = checkGapViolation(tempPart, other);
        if (violation) {
          violations.push(violation);
        }
      }

      if (violations.length === 0) return newPosition;

      // Calculate correction vector (average of all violation vectors)
      let totalDx = 0;
      let totalDy = 0;

      for (const violation of violations) {
        const other = parts.find((p) => p.id === violation.part2Id);
        if (!other) continue;

        // Vector from other part to this part
        const dx = newPosition.x - other.position.x;
        const dy = newPosition.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const correction = violation.minimumRequired - violation.gapDistance;
          totalDx += (dx / distance) * correction;
          totalDy += (dy / distance) * correction;
        }
      }

      // Apply correction
      return {
        x: newPosition.x + totalDx / violations.length,
        y: newPosition.y + totalDy / violations.length,
      };
    },
    [checkGapViolation],
  );

  /**
   * Calculate optimal gap adjustment for a part (move closer to neighbors)
   */
  const calculateTighterPacking = useCallback(
    (part: NestingPart, allParts: NestingPart[]): Point => {
      const otherParts = allParts.filter(
        (p) => p.id !== part.id && p.plateId === part.plateId,
      );

      if (otherParts.length === 0) return part.position;

      let bestPosition = part.position;
      let minGapToNearest = Infinity;

      // Try moving in 8 directions
      const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 1 },
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
      ];

      for (const { dx, dy } of directions) {
        const stepSize = 1; // 1mm steps
        const testPosition = {
          x: part.position.x + dx * stepSize,
          y: part.position.y + dy * stepSize,
        };
        const tempPart = { ...part, position: testPosition };

        // Check against all other parts
        let minGap = Infinity;
        let valid = true;

        for (const other of otherParts) {
          const violation = checkGapViolation(tempPart, other);
          if (violation) {
            if (violation.gapDistance === 0) {
              valid = false;
              break;
            }
            minGap = Math.min(minGap, violation.gapDistance);
          } else {
            // No violation - calculate actual gap
            const bbox1 = part.boundingBox;
            const bbox2 = other.boundingBox;

            const p1MaxX = testPosition.x + bbox1.maxX;
            const p1MinX = testPosition.x + bbox1.minX;
            const p1MaxY = testPosition.y + bbox1.maxY;
            const p1MinY = testPosition.y + bbox1.minY;

            const p2MaxX = other.position.x + bbox2.maxX;
            const p2MinX = other.position.x + bbox2.minX;
            const p2MaxY = other.position.y + bbox2.maxY;
            const p2MinY = other.position.y + bbox2.minY;

            const gapX = Math.max(
              0,
              Math.max(p1MinX - p2MaxX, p2MinX - p1MaxX),
            );
            const gapY = Math.max(
              0,
              Math.max(p1MinY - p2MaxY, p2MinY - p1MaxY),
            );
            const gap = Math.sqrt(gapX * gapX + gapY * gapY);

            minGap = Math.min(minGap, gap);
          }
        }

        if (valid && minGap < minGapToNearest && minGap >= minimumGap) {
          minGapToNearest = minGap;
          bestPosition = testPosition;
        }
      }

      return bestPosition;
    },
    [checkGapViolation, minimumGap],
  );

  return {
    // Configuration
    minimumGap,
    getMinimumGapForPart,
    getMinimumGapBetween,

    // Gap checking
    checkGapViolation,
    checkAllViolations,

    // Gap enforcement
    enforceGap,
    calculateTighterPacking,
  };
};
