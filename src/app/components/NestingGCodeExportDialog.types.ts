import type { GCodeConfig, Layout } from '@dxf-fix/shared';

export interface NestingGCodeExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  layout: Layout | null;
  gcodeConfigs: GCodeConfig[];
}
