import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { DragPreview } from "./usePartNesting.types";
import type { NestingPart, Point } from "../types/NestingTypes";
import type { PlacementBoundaryClassification } from "./usePartNesting.placement";

interface DragStartRefs {
  rafIdRef: MutableRefObject<number | null>;
  originalPositionRef: MutableRefObject<Point>;
  lastValidDragPositionRef: MutableRefObject<Point | null>;
  currentPositionRef: MutableRefObject<Point>;
}

interface DragStartStateSetters {
  setDraggingPartId: Dispatch<SetStateAction<string | null>>;
  setDragStartPosition: Dispatch<SetStateAction<Point | null>>;
  setDragOffset: Dispatch<SetStateAction<Point>>;
  setDragPreview: Dispatch<SetStateAction<DragPreview | null>>;
  setShiftKeyPressed: Dispatch<SetStateAction<boolean>>;
}

interface DragStartPlacement {
  classifyPlacementBoundary?: (
    part: NestingPart,
    position: Point,
    tolerance?: number,
  ) => PlacementBoundaryClassification;
}

export interface DragStartRuntime {
  parts: NestingPart[];
  refs: DragStartRefs;
  state: DragStartStateSetters;
  placement?: DragStartPlacement;
}

interface DragStartArgs {
  event: React.MouseEvent;
  partId: string;
  runtime: DragStartRuntime;
}

interface DragMoveArgs {
  event: React.MouseEvent;
  draggingPartId: string | null;
  dragStartPosition: Point | null;
  dragOffset: Point;
  zoom: number;
  rafIdRef: MutableRefObject<number | null>;
  pendingPositionRef: MutableRefObject<Point | null>;
  performDragUpdate: (newPosition: Point, isPenetrationMode: boolean) => void;
}

export function handleDragStartEvent({
  event,
  partId,
  runtime,
}: DragStartArgs): void {
  const { parts, refs, state, placement } = runtime;
  const {
    rafIdRef,
    originalPositionRef,
    lastValidDragPositionRef,
    currentPositionRef,
  } = refs;
  const {
    setDraggingPartId,
    setDragStartPosition,
    setDragOffset,
    setDragPreview,
    setShiftKeyPressed,
  } = state;

  if (event.button !== 0) {
    return;
  }

  const part = parts.find((p) => p.id === partId);
  if (!part) {
    return;
  }

  if (rafIdRef.current !== null) {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }

  setDraggingPartId(partId);
  setDragStartPosition({ x: event.clientX, y: event.clientY });
  setDragOffset({ x: part.position.x, y: part.position.y });
  originalPositionRef.current = { ...part.position };
  lastValidDragPositionRef.current = { ...part.position };
  currentPositionRef.current = part.position;

  const boundary =
    placement?.classifyPlacementBoundary?.(part, part.position, 0.01) ?? {
      state: "outside_plate",
      reason: "outside_plate",
      targetPlate: null,
    };
  const hasBoundaryInterference =
    boundary.state === "inside_forbidden_band" || boundary.state === "cross_boundary";

  setDragPreview({
    partId,
    position: part.position,
    isValid: !hasBoundaryInterference,
    hasCollision: hasBoundaryInterference,
    hasSpacingInterference: false,
    hasBoundaryInterference,
    hasMarginInterference: hasBoundaryInterference,
    boundaryState: boundary.state,
    boundaryReason: boundary.reason,
    targetPlateId: boundary.targetPlate?.id ?? part.plateId ?? null,
    snapResult: null,
  });

  setShiftKeyPressed(event.shiftKey);
}

export function handleDragMoveEvent({
  event,
  draggingPartId,
  dragStartPosition,
  dragOffset,
  zoom,
  rafIdRef,
  pendingPositionRef,
  performDragUpdate,
}: DragMoveArgs): void {
  if (!draggingPartId || !dragStartPosition) {
    return;
  }

  const dx = (event.clientX - dragStartPosition.x) / zoom;
  const dy = (event.clientY - dragStartPosition.y) / zoom;

  const newPosition: Point = {
    x: dragOffset.x + dx,
    y: dragOffset.y + dy,
  };

  pendingPositionRef.current = newPosition;
  const isPenetrationMode = event.shiftKey;

  if (rafIdRef.current !== null) {
    return;
  }

  rafIdRef.current = requestAnimationFrame(() => {
    if (pendingPositionRef.current) {
      performDragUpdate(pendingPositionRef.current, isPenetrationMode);
    }
    rafIdRef.current = null;
  });
}
