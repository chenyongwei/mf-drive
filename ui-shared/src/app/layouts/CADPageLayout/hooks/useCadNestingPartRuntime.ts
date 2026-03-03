import { useEffect, useRef } from "react";
import type { NestingPart } from "../../../components/CAD/types/NestingTypes";
import {
  CollisionDetectionEngine,
  Part as EnginePart,
} from "../../../lib/webgpu/CollisionDetectionEngine";
import { buildCollisionContours } from "../CADPageLayout.collision";

interface UseCadNestingPartRuntimeOptions {
  nestingParts: NestingPart[];
  setNestingParts: React.Dispatch<React.SetStateAction<NestingPart[]>>;
  partsForFilling: NestingPart[];
}

export const useCadNestingPartRuntime = ({
  nestingParts,
  setNestingParts,
  partsForFilling,
}: UseCadNestingPartRuntimeOptions) => {
  const collisionEngineRef = useRef<CollisionDetectionEngine>(new CollisionDetectionEngine());
  const syncedCollisionPartIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const engine = collisionEngineRef.current;
    const nextIds = new Set<string>();
    nestingParts.forEach((part) => {
      const partId = String(part.id);
      nextIds.add(partId);
      const contourData = buildCollisionContours(
        Array.isArray(part.entities) ? part.entities : [],
        part.boundingBox,
        part.simplifiedContour,
      );
      const enginePart: EnginePart = {
        id: partId,
        outerContour: { points: contourData.outer },
        innerContours:
          contourData.inners.length > 0
            ? contourData.inners.map((points) => ({ points }))
            : undefined,
        simplifiedContour: { points: contourData.outer },
        boundingBox: part.boundingBox,
        position: part.position,
        rotation: (part.rotation * Math.PI) / 180,
        mirroredX: part.mirroredX,
        mirroredY: part.mirroredY,
      };
      engine.removePart(partId);
      engine.addPart(enginePart);
      engine.updatePartTransform(
        partId,
        part.position,
        (part.rotation * Math.PI) / 180,
        part.mirroredX,
        part.mirroredY,
      );
    });
    syncedCollisionPartIdsRef.current.forEach((partId) => {
      if (!nextIds.has(partId)) engine.removePart(partId);
    });
    syncedCollisionPartIdsRef.current = nextIds;
  }, [nestingParts]);

  useEffect(() => {
    setNestingParts((prev) => {
      const prevMap = new Map(prev.map((p) => [String(p.id), p]));
      const currentIds = new Set(partsForFilling.map((p) => String(p.id)));
      const prevIds = new Set(prev.map((p) => String(p.id)));
      let needsUpdate = currentIds.size !== prevIds.size;
      if (!needsUpdate) {
        for (const id of currentIds) {
          if (!prevIds.has(id)) {
            needsUpdate = true;
            break;
          }
        }
      }
      if (!needsUpdate) return prev;
      return partsForFilling.map((part) => {
        const existing = prevMap.get(String(part.id));
        if (existing) return existing;
        return {
          ...part,
          status: "unplaced",
          plateId: null,
          mirroredX: false,
          mirroredY: false,
        } as NestingPart;
      });
    });
  }, [partsForFilling, setNestingParts]);

  return { collisionEngineRef };
};
