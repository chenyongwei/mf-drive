import type { Point } from "../types/NestingTypes";
import type {
  CandidateBuckets,
  SnapOption,
  SnapResult,
  StickySnapState,
} from "./useNestingSnapping.types";

interface ResolveArgs {
  draggedPartId: string;
  draggedPartPosition: Point;
  buckets: CandidateBuckets;
}

interface ResolveResult {
  result: SnapResult;
  sticky: StickySnapState | null;
}

export function resolveBestSnapOption({
  draggedPartId,
  draggedPartPosition,
  buckets,
}: ResolveArgs): ResolveResult {
  const options: SnapOption[] = [];
  const bestX = buckets.bestXCandidate;
  const bestY = buckets.bestYCandidate;
  const bestBoth = buckets.bestBothCandidate;

  if (bestBoth) {
    options.push({
      result: bestBoth.result,
      score: bestBoth.score,
      axisCount: 2,
      keyBoth: bestBoth.key,
    });
  }
  if (bestX) {
    options.push({
      result: bestX.result,
      score: bestX.score,
      axisCount: 1,
      keyX: bestX.key,
    });
  }
  if (bestY) {
    options.push({
      result: bestY.result,
      score: bestY.score,
      axisCount: 1,
      keyY: bestY.key,
    });
  }

  const canComposeAxisCandidates = Boolean(bestX && bestY);
  if (canComposeAxisCandidates && bestX && bestY) {
    const primaryCandidate = bestX.score <= bestY.score ? bestX : bestY;
    const secondaryCandidate = primaryCandidate === bestX ? bestY : bestX;
    const primaryType = primaryCandidate.result.snapType ?? "";
    const secondaryType = secondaryCandidate.result.snapType ?? "";
    const isCenterCross =
      (primaryType === "horizontal-center" && secondaryType === "vertical-center") ||
      (primaryType === "vertical-center" && secondaryType === "horizontal-center");

    options.push({
      result: {
        snapped: true,
        snapPosition: {
          x: bestX.result.snapPosition.x,
          y: bestY.result.snapPosition.y,
        },
        snapPoint:
          primaryCandidate.result.snapPoint ?? secondaryCandidate.result.snapPoint,
        targetPoint:
          primaryCandidate.result.targetPoint ?? secondaryCandidate.result.targetPoint,
        snapType: isCenterCross
          ? "center-to-center"
          : primaryType || secondaryType || null,
      },
      score: Math.max(0, Math.min(bestX.score, bestY.score) - 0.25),
      axisCount: 2,
      keyX: bestX.key,
      keyY: bestY.key,
    });
  }

  const sortedOptions = [...options].sort((a, b) => {
    const scoreDiff = a.score - b.score;
    if (Math.abs(scoreDiff) > 1e-6) {
      return scoreDiff;
    }
    return b.axisCount - a.axisCount;
  });

  let bestOption: SnapOption | null = null;
  for (const option of sortedOptions) {
    if (!bestOption) {
      bestOption = option;
      continue;
    }
    const scoreDiff = option.score - bestOption.score;
    if (scoreDiff < -1e-6) {
      bestOption = option;
      continue;
    }
    if (Math.abs(scoreDiff) <= 1e-6 && option.axisCount > bestOption.axisCount) {
      bestOption = option;
    }
  }

  if (bestOption) {
    const alternatives = sortedOptions
      .filter((option) => option !== bestOption)
      .map((option) => option.result);
    return {
      result: {
        ...bestOption.result,
        alternatives,
      },
      sticky: {
        draggedPartId,
        keyX: bestOption.keyX,
        keyY: bestOption.keyY,
        keyBoth: bestOption.keyBoth,
      },
    };
  }

  return {
    result: {
      snapped: false,
      snapPosition: draggedPartPosition,
      snapPoint: null,
      targetPoint: null,
      snapType: null,
    },
    sticky: null,
  };
}
