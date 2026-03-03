import { useCallback } from "react";
import { isPointInPart } from "../../../utils/geometryUtils";
import type { NestingPart } from "../types/NestingTypes";
import { toPartLocalPoint } from "../utils/cadViewUtils";

interface UseCADViewPartHitTestOptions {
  effectiveParts: NestingPart[];
  selectedPartIds: string[];
}

export function useCADViewPartHitTest({
  effectiveParts,
  selectedPartIds,
}: UseCADViewPartHitTestOptions) {
  return useCallback(
    (x: number, y: number) => {
      const hitCandidates: Array<{
        partId: string;
        area: number;
        centerDistance: number;
        zIndex: number;
      }> = [];
      const selectedSet = new Set(selectedPartIds);

      for (let i = 0; i < effectiveParts.length; i += 1) {
        const part = effectiveParts[i];
        const { x: localX, y: localY } = toPartLocalPoint(part, x, y);

        const inBBox =
          localX >= part.boundingBox.minX &&
          localX <= part.boundingBox.maxX &&
          localY >= part.boundingBox.minY &&
          localY <= part.boundingBox.maxY;

        if (!inBBox) {
          continue;
        }

        if (!isPointInPart(localX, localY, part.entities)) {
          continue;
        }

        const width = Math.abs(part.boundingBox.maxX - part.boundingBox.minX);
        const height = Math.abs(part.boundingBox.maxY - part.boundingBox.minY);
        const area = width * height;
        const centerX = part.position.x + (part.boundingBox.minX + part.boundingBox.maxX) / 2;
        const centerY = part.position.y + (part.boundingBox.minY + part.boundingBox.maxY) / 2;
        const centerDistance = Math.hypot(x - centerX, y - centerY);

        hitCandidates.push({
          partId: part.id,
          area,
          centerDistance,
          zIndex: i,
        });
      }

      if (hitCandidates.length === 0) {
        return null;
      }

      const prioritizedCandidates = hitCandidates.filter((candidate) =>
        selectedSet.has(candidate.partId),
      );
      const pool = prioritizedCandidates.length > 0 ? prioritizedCandidates : hitCandidates;

      pool.sort((left, right) => {
        if (Math.abs(left.area - right.area) > 1e-6) {
          return left.area - right.area;
        }
        if (Math.abs(left.centerDistance - right.centerDistance) > 1e-6) {
          return left.centerDistance - right.centerDistance;
        }
        return right.zIndex - left.zIndex;
      });

      return pool[0].partId;
    },
    [effectiveParts, selectedPartIds],
  );
}
