// ==================== 导出类型 ====================

export type ExportFormat = "DXF" | "GCODE" | "PDF";

export interface ExportOptions {
  format: ExportFormat;
  partIds?: string[];
  unit: "mm" | "inch";
  includeLayers: boolean;
}

export interface ExportResult {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
}
