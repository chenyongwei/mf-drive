import { useState } from "react";
import type { CADToolType } from "../../../components/CAD/CADToolPanel";

export type TrimExtendTool = "trim" | "extend";
export type PendingCadAction = "explode" | "delete";
export type Point2DLike = { x: number; y: number };

export interface PendingTrimExtendState {
  tool: TrimExtendTool;
  fileId: string;
  targetEntityId: string;
  clickPoint: Point2DLike;
  stage: "await-boundary";
}

export function useCadEditController(initialTool: CADToolType = "select") {
  const [activeTool, setActiveTool] = useState<CADToolType>(initialTool);
  const [pendingTrimExtend, setPendingTrimExtend] =
    useState<PendingTrimExtendState | null>(null);
  const [pendingCadAction, setPendingCadAction] =
    useState<PendingCadAction | null>(null);

  return {
    activeTool,
    setActiveTool,
    pendingTrimExtend,
    setPendingTrimExtend,
    pendingCadAction,
    setPendingCadAction,
  };
}
