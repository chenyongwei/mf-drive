import { useEffect, useRef } from "react";
import { calculateAlignmentGuides, type AlignmentGuide } from "../components/AlignmentGuides";
import type { NestingPart } from "../types/NestingTypes";

interface UseCADViewAlignmentGuidesOptions {
  isNestingMode: boolean;
  draggingPartId: string | null;
  effectiveParts: NestingPart[];
  visibleEffectiveParts: NestingPart[];
  targetPlateId?: string | null;
  hasCollision: boolean;
  showDistanceGuides: boolean;
  distanceGuideMaxDistance: number;
  onGuidesChange: (guides: AlignmentGuide[]) => void;
}

export function getAlignmentGuideCandidates(
  draggedPart: NestingPart,
  visibleEffectiveParts: NestingPart[],
  targetPlateId?: string | null,
): NestingPart[] {
  const candidates = visibleEffectiveParts.some((part) => part.id === draggedPart.id)
    ? visibleEffectiveParts
    : [draggedPart, ...visibleEffectiveParts];

  if (targetPlateId === undefined) {
    return candidates;
  }

  const normalizedTargetPlateId = targetPlateId ?? null;
  return candidates.filter(
    (part) =>
      part.id === draggedPart.id || (part.plateId ?? null) === normalizedTargetPlateId,
  );
}

export function useCADViewAlignmentGuides({
  isNestingMode,
  draggingPartId,
  effectiveParts,
  visibleEffectiveParts,
  targetPlateId,
  hasCollision,
  showDistanceGuides,
  distanceGuideMaxDistance,
  onGuidesChange,
}: UseCADViewAlignmentGuidesOptions) {
  const stickyDistanceGuideTargetRef = useRef<string | null>(null);
  const stickyTargetPlateIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isNestingMode || !draggingPartId) {
      onGuidesChange([]);
      stickyDistanceGuideTargetRef.current = null;
      stickyTargetPlateIdRef.current = undefined;
      return;
    }

    const draggedPart = effectiveParts.find((part) => part.id === draggingPartId);
    if (!draggedPart) {
      onGuidesChange([]);
      stickyDistanceGuideTargetRef.current = null;
      return;
    }

    if (stickyTargetPlateIdRef.current !== targetPlateId) {
      stickyDistanceGuideTargetRef.current = null;
      stickyTargetPlateIdRef.current = targetPlateId;
    }

    const hideDistanceGuides = Boolean(hasCollision);
    const normalizedDistanceGuideMaxDistance = Number.isFinite(distanceGuideMaxDistance)
      ? Math.max(0, distanceGuideMaxDistance)
      : 40;

    const guideCandidates = getAlignmentGuideCandidates(
      draggedPart,
      visibleEffectiveParts,
      targetPlateId,
    );

    const guides = calculateAlignmentGuides(draggedPart, guideCandidates, 10, {
      showDistance: showDistanceGuides && !hideDistanceGuides,
      maxDistance: normalizedDistanceGuideMaxDistance,
      stickyTargetPartId: stickyDistanceGuideTargetRef.current,
      stickyDistanceMargin: 0.9,
    });

    const distanceGuide = guides.find((guide) => guide.type === "distance");
    stickyDistanceGuideTargetRef.current =
      !hideDistanceGuides && distanceGuide?.targetPartId
        ? distanceGuide.targetPartId
        : null;

    onGuidesChange(guides);
  }, [
    isNestingMode,
    draggingPartId,
    effectiveParts,
    visibleEffectiveParts,
    targetPlateId,
    hasCollision,
    showDistanceGuides,
    distanceGuideMaxDistance,
    onGuidesChange,
  ]);
}
