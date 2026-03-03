import { GCodeConfig, LeadType, MicroJointType } from '@dxf-fix/shared';

export interface GCodeConfigEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: GCodeConfig) => void;
  initialConfig?: GCodeConfig;
}

export interface LeadConfigProps {
  leadConfig: {
    enabled: boolean;
    type: LeadType;
    length: number;
    angle: number;
    arcRadius?: number;
    spiralTurns?: number;
  };
  label: string;
  onChange: (field: string, value: any) => void;
}

export interface MicroJointConfigProps {
  config: {
    enabled: boolean;
    type: MicroJointType;
    width: number;
    depth: number;
    count: number;
    distribution: string;
    positions: number[];
  };
  onChange: (field: string, value: any) => void;
  onPositionChange: (positions: number[]) => void;
  contourLength: number;
}
