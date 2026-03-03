import type { SortingModeId } from "../../components/CAD/components/RibbonDropdowns";
import type { Point2D } from "./CADPageLayout.file-utils";

export type ToolpathMode = "AUTO" | "MANUAL";
export type ToolpathSortMode = SortingModeId;

export type ToolpathEntryLead = {
  enabled: boolean;
  length: number;
  angleDeg: number;
};

export type ToolpathOverrideState = {
  startPointOverrides: Array<{
    contourId: string;
    startPointParam: number;
    direction?: "CW" | "CCW";
  }>;
  leadOverrides: Array<{
    contourId: string;
    leadIn?: ToolpathEntryLead;
    leadOut?: ToolpathEntryLead;
  }>;
  sequenceOverrides: Array<{
    contourId: string;
    order: number;
  }>;
  parkingPoint?: Point2D;
  plateParkingPoints?: Array<{
    plateId: string;
    contourId: string;
    x: number;
    y: number;
  }>;
};

export type ToolpathOverlaySegment = {
  segmentId: string;
  kind: "CUT" | "RAPID" | "LEAD_IN" | "LEAD_OUT";
  partId?: string;
  from: Point2D;
  to: Point2D;
  contourId?: string;
  preserve?: boolean;
};

export type ToolpathPlanLite = {
  planId: string;
  mode: ToolpathMode;
  status: "ready" | "warning" | "invalid";
  entries: Array<{
    partId: string;
    contourId: string;
    startPointParam: number;
    direction: "CW" | "CCW";
    leadIn: ToolpathEntryLead;
    leadOut: ToolpathEntryLead;
  }>;
  metrics: {
    cutLength: number;
    rapidLength: number;
    pierceCount: number;
    estimatedTimeSec: number;
    thermalPenalty: number;
  };
  check: {
    valid: boolean;
    violations: Array<{
      code: string;
      message: string;
      severity: "error" | "warning";
    }>;
    warnings: string[];
  };
  warnings: string[];
  segments: ToolpathOverlaySegment[];
};
