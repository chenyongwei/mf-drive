export interface Entity {
  id: string;
  type: string;
  geometry?: any;
  attributes?: Record<string, unknown>;
  versionToken?: string;
  color?: number;
  strokeColor?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  isPart?: boolean;
  partIds?: string[];
  partColor?: string;
  processCode?: "NO_PROCESS" | "CUT_NORMAL" | "CUT_SLOW" | "MARK";
  linetype?: 'continuous' | 'dashed' | 'dotted';
  isInnerContour?: boolean;
  layer?: string;
  fileId?: string;
}

export interface VertexConversionOptions {
  detailScale?: number;
}
