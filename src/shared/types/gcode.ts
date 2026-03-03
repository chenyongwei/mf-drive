// ==================== G代码配置类型 ====================

export type GCodeDeviceType = "LASER" | "FLAME" | "PLASMA";

export type GCodeControlSystem =
  | "NC_STANDARD"
  | "FANUC"
  | "SIEMENS"
  | "HEIDENHAIN"
  | "HYPERTHERM"
  | "EAGLE"
  | "CYPRESS"
  | "CUSTOM";

export type LeadType = "NONE" | "LINEAR" | "TANGENT" | "ARC" | "SPIRAL";

export type MicroJointType = "NONE" | "POINT" | "OVERCUT" | "TAB";

export interface LeadConfig {
  enabled: boolean;
  type: LeadType;
  length: number;
  angle: number;
  arcRadius?: number;
  spiralTurns?: number;
}

export interface MicroJointConfig {
  enabled: boolean;
  type: MicroJointType;
  width: number;
  depth: number;
  count: number;
  distribution: "EVEN" | "MANUAL";
  positions?: number[];
}

export interface GCodeConfig {
  id: string;
  name: string;
  description?: string;
  deviceType: GCodeDeviceType;
  controlSystem: GCodeControlSystem;
  unit: "mm" | "inch";
  feedRate: number;
  rapidRate: number;
  moveCommand: "G0" | "G00";
  linearCommand: "G1" | "G01";
  arcCW: "G2" | "G02";
  arcCCW: "G3" | "G03";
  leadIn: LeadConfig;
  leadOut: LeadConfig;
  microJoint: MicroJointConfig;
  arcSegmentAngle: number;
  useIJK: boolean;
  headerTemplate: string;
  footerTemplate: string;
  origin: "ABSOLUTE" | "RELATIVE" | "CUSTOM";
  customOrigin?: { x: number; y: number };
  isPreset?: boolean;
}

export interface GCodeExportOptions {
  configId: string;
  partIds: string[];
  fileName?: string;
}
