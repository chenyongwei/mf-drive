import type { Entity } from '../../../lib/webgpu/EntityToVertices';

export interface TextUpdatePayload {
  content: string;
  fontId: string;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  rotation: number;
  alignH: 'left' | 'center' | 'right';
  alignV: 'top' | 'middle' | 'baseline' | 'bottom';
  lineMode: 'single' | 'double';
  tolerance: number;
}

export interface TextPropertiesPanelProps {
  theme?: 'dark' | 'light';
  selectedEntity: Entity | null;
  currentUserId?: string | number | null;
  isAuthenticated?: boolean;
  onApply: (payload: TextUpdatePayload) => Promise<void> | void;
  onToast?: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
  ) => void;
}

export const DEFAULT_PAYLOAD: TextUpdatePayload = {
  content: '',
  fontId: 'system-noto-sans-cjk-sc',
  fontFamily: 'Noto Sans CJK SC',
  fontSize: 24,
  lineHeight: 1.2,
  rotation: 0,
  alignH: 'left',
  alignV: 'baseline',
  lineMode: 'double',
  tolerance: 0.35,
};
