import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { NestingPart, Plate, Point } from "../types/NestingTypes";
import type { DragPreview } from "./usePartNesting.types";
import type { DragValidationDeps } from "./usePartNesting.drag.validation-shared";

export interface DragEndArgs extends DragValidationDeps {
  draggingPartId: string | null;
  dragPreview: DragPreview | null;
  parts: NestingPart[];
  partSpacing: number;
  clampPositionToPlateBounds: (
    part: NestingPart,
    position: Point,
    plate: Plate,
    zone: "outer" | "inner",
  ) => Point;
  resolveNearestValidPosition: (
    partId: string,
    part: NestingPart,
    startPosition: Point,
    rotation: number,
  ) => Point | null;
  findPlateForPart: (part: NestingPart, position: Point) => Plate | null;
  stickToEdge: boolean;
  updateParts: (updatedParts: NestingPart[]) => void;
  lastValidDragPositionRef: MutableRefObject<Point | null>;
  originalPositionRef: MutableRefObject<Point>;
  setDraggingPartId: Dispatch<SetStateAction<string | null>>;
  setDragStartPosition: Dispatch<SetStateAction<Point | null>>;
  setDragOffset: Dispatch<SetStateAction<Point>>;
  setCurrentSnap: Dispatch<SetStateAction<any>>;
  setDragPreview: Dispatch<SetStateAction<DragPreview | null>>;
}
