import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { CADToolType } from "../CADToolPanel";

export interface Point2D {
  x: number;
  y: number;
}

export interface UseCADDrawingProps {
  activeTool: CADToolType;
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
  onEntityCreate: (entity: Entity) => void;
  selectedFileId?: string | null;
  isNestingMode?: boolean;
}

export interface TextToolOptions {
  fontId: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  rotation: number;
  alignH: "left" | "center" | "right";
  alignV: "top" | "middle" | "baseline" | "bottom";
  lineMode: "single" | "double";
  tolerance: number;
}

export interface TextDraftState {
  position: Point2D;
  content: string;
}

export interface DrawingStateSetters {
  setIsDrawing: (value: boolean) => void;
  setStartPoint: (value: Point2D | null) => void;
  setCurrentPoint: (value: Point2D | null) => void;
  setPreviewEntity: (value: Entity | null) => void;
  setPolyPoints: (value: Point2D[]) => void;
  setDrawingStep: (value: number) => void;
  setTextDraft: (value: TextDraftState | null) => void;
}

export const DEFAULT_TEXT_OPTIONS: TextToolOptions = {
  fontId: "system-noto-sans-cjk-sc",
  fontFamily: "Noto Sans CJK SC",
  fontSize: 24,
  lineHeight: 1.2,
  rotation: 0,
  alignH: "left",
  alignV: "baseline",
  lineMode: "double",
  tolerance: 0.35,
};
