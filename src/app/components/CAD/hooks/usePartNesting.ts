import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NestingPart, Point } from "../types/NestingTypes";
import { useNestingSnapping } from "./useNestingSnapping";
import { handleDragEnd } from "./usePartNesting.drag.end";
import { buildDragEndPreview } from "./usePartNesting.drag.end.preview";
import { handleDragMoveEvent, handleDragStartEvent } from "./usePartNesting.drag.handlers";
import type { DragStartRuntime } from "./usePartNesting.drag.handlers";
import { performDragUpdate } from "./usePartNesting.drag.update";
import { moveSelectedPartsAction, rotateSelectedPartsAction, mirrorSelectedPartsAction, getUtilizationValue } from "./usePartNesting.operations.group";
import {
  mirrorPartAction,
  rotatePartAction,
  rotatePartFreeAction,
} from "./usePartNesting.operations.rotate";
import { createPlacementHelpers } from "./usePartNesting.placement";
import type { DragPreview, UsePartNestingOptions } from "./usePartNesting.types";
import type { SnapResult } from "./useNestingSnapping";

const COPY_SUFFIX_PATTERN = /__copy-\d+$/i;
const DROP_PREVIEW_SETTLE_EPSILON = 1e-6;

interface PlacementPreviewResult {
  finalPosition: Point;
  snapResult: SnapResult | null;
  isValid: boolean;
  hasCollision: boolean;
  hasSpacingInterference: boolean;
  hasBoundaryInterference: boolean;
  hasMarginInterference: boolean;
  boundaryState: DragPreview["boundaryState"];
  boundaryReason: DragPreview["boundaryReason"];
  targetPlateId: string | null;
}

interface PlacementPreviewMeta {
  sourcePartId?: string | null;
  remainingCount?: number;
  isCopyPreview?: boolean;
}

function normalizeSourcePartId(value: string): string {
  return value.trim().replace(COPY_SUFFIX_PATTERN, "");
}

function resolveSourcePartId(part: NestingPart): string {
  const sourcePartId = String(part.sourcePartId ?? part.id ?? "");
  return normalizeSourcePartId(sourcePartId);
}

function isPlacedPart(part: NestingPart): boolean {
  return part.status === "placed" && Boolean(part.plateId);
}

function isPositionSettled(left: Point, right: Point): boolean {
  return (
    Math.abs(left.x - right.x) <= DROP_PREVIEW_SETTLE_EPSILON &&
    Math.abs(left.y - right.y) <= DROP_PREVIEW_SETTLE_EPSILON
  );
}

export const usePartNesting = (options: UsePartNestingOptions) => {
  const {
    parts,
    snappingParts,
    plates,
    onPartsChange,
    collisionEngine,
    partSpacing = 0,
    snappingEnabled = true,
    snapTolerance = 15,
    selectedPartIds = [],
    zoom,
    stickToEdge = false,
    penetrationMode = false,
  } = options;

  const [draggingPartId, setDraggingPartId] = useState<string | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<Point | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);
  const [currentSnap, setCurrentSnap] = useState<SnapResult | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [stickySourcePartId, setStickySourcePartId] = useState<string | null>(null);

  const currentPositionRef = useRef<Point>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<Point | null>(null);
  const originalPositionRef = useRef<Point>({ x: 0, y: 0 });
  const lastValidDragPositionRef = useRef<Point | null>(null);
  const stickyPointerRef = useRef<Point | null>(null);

  const snapping = useNestingSnapping({
    enabled: snappingEnabled && !shiftKeyPressed,
    snapTolerance,
    snapToEdges: true,
    snapToCorners: true,
    snapToCenters: true,
    partSpacing,
    allParts: snappingParts ?? parts,
    snapToSheets: stickToEdge,
    plates,
  });
  const findSnap = snapping.findSnap;

  const updateParts = useCallback(
    (updatedParts: NestingPart[]) => {
      onPartsChange?.(updatedParts);
    },
    [onPartsChange],
  );

  const placement = useMemo(
    () =>
      createPlacementHelpers({
        parts,
        plates,
        collisionEngine,
        partSpacing,
        stickToEdge,
      }),
    [parts, plates, collisionEngine, partSpacing, stickToEdge],
  );

  const clearStickyPlacementState = useCallback(() => {
    setStickySourcePartId(null);
    setDraggingPartId(null);
    setDragStartPosition(null);
    setDragOffset({ x: 0, y: 0 });
    setShiftKeyPressed(false);
    setCurrentSnap(null);
    setDragPreview(null);
    pendingPositionRef.current = null;
    lastValidDragPositionRef.current = null;
  }, []);

  const findNextUnplacedPart = useCallback(
    (sourcePartId: string, sourceParts: NestingPart[] = parts): NestingPart | null => {
      const normalizedSourcePartId = normalizeSourcePartId(String(sourcePartId ?? ""));
      if (!normalizedSourcePartId) return null;
      const part =
        sourceParts.find(
          (candidate) =>
            resolveSourcePartId(candidate) === normalizedSourcePartId &&
            !isPlacedPart(candidate),
        ) ?? null;
      return part;
    },
    [parts],
  );

  const countUnplacedBySource = useCallback(
    (sourcePartId: string, sourceParts: NestingPart[] = parts): number => {
      const normalizedSourcePartId = normalizeSourcePartId(String(sourcePartId ?? ""));
      if (!normalizedSourcePartId) return 0;
      return sourceParts.filter(
        (candidate) =>
          resolveSourcePartId(candidate) === normalizedSourcePartId &&
          !isPlacedPart(candidate),
      ).length;
    },
    [parts],
  );

  const stickyRemainingCount = useMemo(() => {
    if (!stickySourcePartId) return 0;
    return countUnplacedBySource(stickySourcePartId);
  }, [countUnplacedBySource, stickySourcePartId]);

  const evaluatePlacementForPart = useCallback(
    (part: NestingPart, desiredPosition: Point): PlacementPreviewResult => {
      let finalPosition = { ...desiredPosition };
      let snapResult: SnapResult | null = null;
      let isValid = true;
      let hasCollision = false;
      let hasSpacingInterference = false;
      let hasBoundaryInterference = false;
      let hasMarginInterference = false;
      let boundaryClassification = placement.classifyPlacementBoundary(part, finalPosition, 0);

      if (!penetrationMode) {
        const tempPart = { ...part, position: desiredPosition };
        const snapCandidate = findSnap(
          tempPart,
          [part.id],
          boundaryClassification.targetPlate?.id ?? null,
        );

        if (snapCandidate.snapped) {
          const candidates = [snapCandidate, ...(snapCandidate.alternatives ?? [])];
          let acceptedSnap: SnapResult | null = null;
          for (const candidate of candidates) {
            const snapBoundary = placement.classifyPlacementBoundary(
              part,
              candidate.snapPosition,
              0,
            );
            const snapHasBoundaryInterference =
              snapBoundary.state === "inside_forbidden_band" ||
              snapBoundary.state === "cross_boundary";
            const snapHasCollision =
              placement.checkCollision(
                part.id,
                candidate.snapPosition,
                part.rotation,
                false,
              ) || snapHasBoundaryInterference;
            const snapHasSpacingInterference = placement.checkSpacingInterference(
              part.id,
              candidate.snapPosition,
              part.rotation,
            );
            const snapHasMarginInterference = placement.checkMarginInterference(
              part,
              candidate.snapPosition,
              0,
            );
            const snapIsValid =
              !snapHasCollision &&
              !snapHasSpacingInterference &&
              !snapHasBoundaryInterference &&
              !snapHasMarginInterference;
            if (snapIsValid) {
              acceptedSnap = candidate;
              break;
            }
          }

          if (acceptedSnap) {
            snapResult = acceptedSnap;
            finalPosition = acceptedSnap.snapPosition;
          }
        }

        boundaryClassification = placement.classifyPlacementBoundary(part, finalPosition, 0);
        hasBoundaryInterference =
          boundaryClassification.state === "inside_forbidden_band" ||
          boundaryClassification.state === "cross_boundary";
        hasCollision =
          placement.checkFastCollision(part.id, finalPosition, part.rotation) ||
          hasBoundaryInterference;
        hasSpacingInterference = placement.checkSpacingInterference(
          part.id,
          finalPosition,
          part.rotation,
        );
        hasMarginInterference =
          hasBoundaryInterference ||
          placement.checkMarginInterference(part, finalPosition, 0);
        isValid =
          !hasCollision &&
          !hasBoundaryInterference &&
          !hasMarginInterference &&
          !hasSpacingInterference;
      }

      return {
        finalPosition,
        snapResult,
        isValid,
        hasCollision,
        hasSpacingInterference,
        hasBoundaryInterference,
        hasMarginInterference,
        boundaryState: boundaryClassification.state,
        boundaryReason: boundaryClassification.reason,
        targetPlateId: boundaryClassification.targetPlate?.id ?? part.plateId ?? null,
      };
    },
    [findSnap, penetrationMode, placement],
  );

  const applyPlacementPreview = useCallback(
    (
      partId: string,
      preview: PlacementPreviewResult,
      meta: PlacementPreviewMeta = {},
    ) => {
      setDraggingPartId(partId);
      setCurrentSnap(preview.snapResult);
      setDragPreview({
        partId,
        position: preview.finalPosition,
        isValid: preview.isValid,
        hasCollision: preview.hasCollision,
        hasSpacingInterference: preview.hasSpacingInterference,
        hasBoundaryInterference: preview.hasBoundaryInterference,
        hasMarginInterference: preview.hasMarginInterference,
        boundaryState: preview.boundaryState,
        boundaryReason: preview.boundaryReason,
        targetPlateId: preview.targetPlateId,
        snapResult: preview.snapResult,
        sourcePartId: meta.sourcePartId ?? null,
        remainingCount: meta.remainingCount ?? 0,
        isCopyPreview: Boolean(meta.isCopyPreview),
      });
      currentPositionRef.current = preview.finalPosition;
      if (preview.isValid) {
        lastValidDragPositionRef.current = { ...preview.finalPosition };
      }
    },
    [],
  );

  const handleDragStart = useCallback(
    (event: React.MouseEvent, partId: string) => {
      if (stickySourcePartId) {
        clearStickyPlacementState();
      }

      const runtime: DragStartRuntime = {
        parts,
        refs: { rafIdRef, originalPositionRef, lastValidDragPositionRef, currentPositionRef },
        state: { setDraggingPartId, setDragStartPosition, setDragOffset, setDragPreview, setShiftKeyPressed },
        placement: { classifyPlacementBoundary: placement.classifyPlacementBoundary },
      };
      handleDragStartEvent({ event, partId, runtime });
    },
    [clearStickyPlacementState, parts, placement.classifyPlacementBoundary, stickySourcePartId],
  );

  const performDragUpdateCallback = useCallback(
    (newPosition: Point, isPenetrationMode: boolean) => {
      performDragUpdate({
        draggingPartId,
        parts,
        penetrationMode,
        newPosition,
        isPenetrationMode,
        snapping: { findSnap },
        checkFastCollision: placement.checkFastCollision,
        checkCollision: placement.checkCollision,
        checkSpacingInterference: placement.checkSpacingInterference,
        classifyPlacementBoundary: placement.classifyPlacementBoundary,
        checkMarginInterference: placement.checkMarginInterference,
        setCurrentSnap,
        setDragPreview,
        currentPositionRef,
        lastValidDragPositionRef,
      });
    },
    [draggingPartId, parts, penetrationMode, findSnap, placement],
  );

  const handleDragMove = useCallback(
    (event: React.MouseEvent) => {
      handleDragMoveEvent({
        event,
        draggingPartId,
        dragStartPosition,
        dragOffset,
        zoom,
        rafIdRef,
        pendingPositionRef,
        performDragUpdate: performDragUpdateCallback,
      });
    },
    [draggingPartId, dragStartPosition, dragOffset, zoom, performDragUpdateCallback],
  );

  const handleDragEndCallback = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const dragEndPreview = buildDragEndPreview(
      draggingPartId,
      pendingPositionRef.current,
      dragPreview,
    );

    handleDragEnd({
      draggingPartId,
      dragPreview: dragEndPreview,
      parts,
      partSpacing,
      checkCollision: placement.checkCollision,
      checkSpacingInterference: placement.checkSpacingInterference,
      classifyPlacementBoundary: placement.classifyPlacementBoundary,
      clampPositionToPlateBounds: placement.clampPositionToPlateBounds,
      checkMarginInterference: placement.checkMarginInterference,
      resolveNearestValidPosition: placement.resolveNearestValidPosition,
      findPlateForPart: placement.findPlateForPart,
      stickToEdge,
      updateParts,
      lastValidDragPositionRef,
      originalPositionRef,
      setDraggingPartId,
      setDragStartPosition,
      setDragOffset,
      setCurrentSnap,
      setDragPreview,
    });

    pendingPositionRef.current = null;
  }, [
    draggingPartId,
    dragPreview,
    parts,
    partSpacing,
    stickToEdge,
    placement,
    updateParts,
  ]);

  const dropFromList = useCallback(
    (sourcePartId: string, clientPoint: Point, worldPoint: Point): boolean => {
      void clientPoint;
      const normalizedSourcePartId = normalizeSourcePartId(String(sourcePartId ?? ""));
      if (!normalizedSourcePartId) return false;

      stickyPointerRef.current = worldPoint;
      setStickySourcePartId(normalizedSourcePartId);

      const candidatePart = findNextUnplacedPart(normalizedSourcePartId);
      if (!candidatePart) {
        clearStickyPlacementState();
        return false;
      }

      const remainingBeforeDrop = countUnplacedBySource(normalizedSourcePartId);
      const preview = evaluatePlacementForPart(candidatePart, worldPoint);
      applyPlacementPreview(candidatePart.id, preview, {
        sourcePartId: normalizedSourcePartId,
        remainingCount: remainingBeforeDrop,
        isCopyPreview: remainingBeforeDrop >= 2,
      });

      if (!preview.isValid) {
        return false;
      }

      const targetPlate = placement.findPlateForPart(
        { ...candidatePart, position: preview.finalPosition },
        preview.finalPosition,
      );
      if (!targetPlate) {
        return false;
      }

      const nextParts = parts.map((part) => {
        if (part.id !== candidatePart.id) return part;
        return {
          ...part,
          position: preview.finalPosition,
          plateId: targetPlate.id,
          status: "placed" as const,
        };
      });

      updateParts(nextParts);

      if (countUnplacedBySource(normalizedSourcePartId, nextParts) <= 0) {
        clearStickyPlacementState();
      } else {
        setStickySourcePartId(normalizedSourcePartId);
      }

      return true;
    },
    [
      applyPlacementPreview,
      clearStickyPlacementState,
      countUnplacedBySource,
      evaluatePlacementForPart,
      findNextUnplacedPart,
      parts,
      placement,
      updateParts,
    ],
  );

  const updateStickyPointer = useCallback(
    (worldPoint: Point) => {
      stickyPointerRef.current = worldPoint;
      if (!stickySourcePartId) return;

      const candidatePart = findNextUnplacedPart(stickySourcePartId);
      if (!candidatePart) {
        clearStickyPlacementState();
        return;
      }

      const preview = evaluatePlacementForPart(candidatePart, worldPoint);
      const remainingCount = countUnplacedBySource(stickySourcePartId);
      applyPlacementPreview(candidatePart.id, preview, {
        sourcePartId: stickySourcePartId,
        remainingCount,
        isCopyPreview: remainingCount >= 2,
      });
    },
    [
      applyPlacementPreview,
      clearStickyPlacementState,
      countUnplacedBySource,
      evaluatePlacementForPart,
      findNextUnplacedPart,
      stickySourcePartId,
    ],
  );

  const cancelStickyPlacement = useCallback(() => {
    clearStickyPlacementState();
  }, [clearStickyPlacementState]);

  useEffect(() => {
    if (!stickySourcePartId) return;
    const pointer = stickyPointerRef.current;
    if (!pointer) return;

    const candidatePart = findNextUnplacedPart(stickySourcePartId);
    if (!candidatePart) {
      clearStickyPlacementState();
      return;
    }

    const preview = evaluatePlacementForPart(candidatePart, pointer);
    const remainingCount = countUnplacedBySource(stickySourcePartId);
    applyPlacementPreview(candidatePart.id, preview, {
      sourcePartId: stickySourcePartId,
      remainingCount,
      isCopyPreview: remainingCount >= 2,
    });
  }, [stickySourcePartId, parts]);

  useEffect(() => {
    if (draggingPartId || !dragPreview) return;
    const settledPart = parts.find((part) => part.id === dragPreview.partId);
    if (!settledPart) {
      setDragPreview(null);
      return;
    }
    if (isPositionSettled(settledPart.position, dragPreview.position)) {
      setDragPreview(null);
    }
  }, [dragPreview, draggingPartId, parts]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const rotatePart = useCallback(
    (partId: string, angle: number) => {
      rotatePartAction({
        partId,
        angle,
        parts,
        draggingPartId,
        partSpacing,
        checkCollision: placement.checkCollision,
        updateParts,
      });
    },
    [parts, draggingPartId, partSpacing, placement, updateParts],
  );

  const rotatePartFree = useCallback(
    (partId: string, angle: number, snapAngles: number[] = [0, 15, 30, 45, 90, 180]) =>
      rotatePartFreeAction({
        partId,
        angle,
        snapAngles,
        parts,
        draggingPartId,
        partSpacing,
        checkCollision: placement.checkCollision,
        updateParts,
      }),
    [parts, draggingPartId, partSpacing, placement, updateParts],
  );

  const mirrorPart = useCallback(
    (partId: string, direction: "horizontal" | "vertical") => {
      mirrorPartAction({ partId, direction, parts, updateParts });
    },
    [parts, updateParts],
  );

  const moveSelectedParts = useCallback(
    (offsetX: number, offsetY: number) =>
      moveSelectedPartsAction({
        offsetX,
        offsetY,
        parts,
        selectedPartIds,
        checkCollision: placement.checkCollision,
        findPlateForPart: placement.findPlateForPart,
        updateParts,
      }),
    [parts, selectedPartIds, placement, updateParts],
  );

  const rotateSelectedParts = useCallback(
    (angle: number) => {
      rotateSelectedPartsAction({
        angle,
        parts,
        selectedPartIds,
        checkCollision: placement.checkCollision,
        findPlateForPart: placement.findPlateForPart,
        updateParts,
      });
    },
    [parts, selectedPartIds, placement, updateParts],
  );

  const mirrorSelectedParts = useCallback(
    (direction: "horizontal" | "vertical") => {
      mirrorSelectedPartsAction({ direction, parts, selectedPartIds, updateParts });
    },
    [parts, selectedPartIds, updateParts],
  );

  const getUtilization = useCallback(
    () => getUtilizationValue(parts, plates),
    [parts, plates],
  );

  return {
    draggingPartId,
    currentPosition: currentPositionRef.current,
    shiftKeyPressed,
    currentSnap,
    dragPreview,
    stickyRemainingCount,
    lastValidDragPosition: lastValidDragPositionRef.current,
    stickySourcePartId,
    isStickyPlacementActive: stickySourcePartId !== null,
    handleDragStart,
    handleDragMove,
    handleDragEnd: handleDragEndCallback,
    dropFromList,
    updateStickyPointer,
    cancelStickyPlacement,
    rotatePart,
    rotatePartFree,
    mirrorPart,
    moveSelectedParts,
    rotateSelectedParts,
    mirrorSelectedParts,
    getUtilization,
    snappingEnabled,
    snapTolerance,
  };
};
