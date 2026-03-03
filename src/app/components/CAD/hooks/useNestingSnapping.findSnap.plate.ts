import type { NestingPart, Plate } from "../types/NestingTypes";
import { buildSnapKey } from "./useNestingSnapping.math";
import type { SnapPoint, SnapResult } from "./useNestingSnapping.types";
import type { ConsiderCandidate } from "./useNestingSnapping.findSnap.primary";

interface PlateCandidateArgs {
  draggedPart: NestingPart;
  draggedSnapPoints: SnapPoint[];
  plates: Plate[];
  considerCandidate: ConsiderCandidate;
}

export function collectPlateCandidates({
  draggedPart,
  draggedSnapPoints,
  plates,
  considerCandidate,
}: PlateCandidateArgs): void {
  const partCorners = draggedSnapPoints.filter(
    (point) => point.type === "corner" && !Boolean(point.isInnerContour),
  );

  for (const plate of plates) {
    const targets = [
      {
        name: "margin",
        xMin: plate.position.x + plate.margin,
        yMin: plate.position.y + plate.margin,
        xMax: plate.position.x + plate.width - plate.margin,
        yMax: plate.position.y + plate.height - plate.margin,
      },
      {
        name: "edge",
        xMin: plate.position.x,
        yMin: plate.position.y,
        xMax: plate.position.x + plate.width,
        yMax: plate.position.y + plate.height,
      },
    ];

    for (const target of targets) {
      for (const corner of partCorners) {
        const point = corner.position;

        const leftTarget: SnapPoint = {
          type: "edge",
          position: { x: target.xMin, y: point.y },
          partId: `plate:${plate.id}`,
        };
        const leftResult: SnapResult = {
          snapped: true,
          snapPosition: {
            x: draggedPart.position.x + (target.xMin - point.x),
            y: draggedPart.position.y,
          },
          snapPoint: corner,
          targetPoint: leftTarget,
          snapType: `plate-${target.name}-left`,
        };
        considerCandidate(
          leftResult,
          Math.abs(point.x - target.xMin),
          buildSnapKey(
            draggedPart.id,
            corner,
            leftTarget,
            leftResult.snapType || "plate-left",
          ),
        );

        const rightTarget: SnapPoint = {
          type: "edge",
          position: { x: target.xMax, y: point.y },
          partId: `plate:${plate.id}`,
        };
        const rightResult: SnapResult = {
          snapped: true,
          snapPosition: {
            x: draggedPart.position.x + (target.xMax - point.x),
            y: draggedPart.position.y,
          },
          snapPoint: corner,
          targetPoint: rightTarget,
          snapType: `plate-${target.name}-right`,
        };
        considerCandidate(
          rightResult,
          Math.abs(point.x - target.xMax),
          buildSnapKey(
            draggedPart.id,
            corner,
            rightTarget,
            rightResult.snapType || "plate-right",
          ),
        );

        const topTarget: SnapPoint = {
          type: "edge",
          position: { x: point.x, y: target.yMin },
          partId: `plate:${plate.id}`,
        };
        const topResult: SnapResult = {
          snapped: true,
          snapPosition: {
            x: draggedPart.position.x,
            y: draggedPart.position.y + (target.yMin - point.y),
          },
          snapPoint: corner,
          targetPoint: topTarget,
          snapType: `plate-${target.name}-top`,
        };
        considerCandidate(
          topResult,
          Math.abs(point.y - target.yMin),
          buildSnapKey(
            draggedPart.id,
            corner,
            topTarget,
            topResult.snapType || "plate-top",
          ),
        );

        const bottomTarget: SnapPoint = {
          type: "edge",
          position: { x: point.x, y: target.yMax },
          partId: `plate:${plate.id}`,
        };
        const bottomResult: SnapResult = {
          snapped: true,
          snapPosition: {
            x: draggedPart.position.x,
            y: draggedPart.position.y + (target.yMax - point.y),
          },
          snapPoint: corner,
          targetPoint: bottomTarget,
          snapType: `plate-${target.name}-bottom`,
        };
        considerCandidate(
          bottomResult,
          Math.abs(point.y - target.yMax),
          buildSnapKey(
            draggedPart.id,
            corner,
            bottomTarget,
            bottomResult.snapType || "plate-bottom",
          ),
        );
      }
    }
  }
}
