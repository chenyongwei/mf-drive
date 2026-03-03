import * as Menus from './RibbonDropdowns';
import type { NestingProcessOperation } from '../types/NestingTypes';

export interface GroupProps {
  theme: 'dark' | 'light';
  showLabels: boolean;
  onAction?: (action: string) => void;
  showDimensions?: boolean;
  showDistanceGuides?: boolean;
  distanceGuideMaxDistance?: number;
  commonEdgeEnabled?: boolean;
  stickToEdgeEnabled?: boolean;
  snappingEnabled?: boolean;
  snapTolerance?: number;
  processAddMenu?: Menus.DropdownItem[];
  processDeleteMenu?: Menus.DropdownItem[];
  processFavoriteActions?: Menus.NestingProcessActionDef[];
  processPrimaryActionByOperation?: Partial<Record<NestingProcessOperation, string>>;
  processPrimaryActionDefByOperation?: Partial<Record<NestingProcessOperation, Menus.NestingProcessActionDef>>;
  onProcessPrimaryClick?: (operation: NestingProcessOperation) => void;
  onProcessPinToggle?: (actionId: string) => void;
  sortingMode?: Menus.SortingModeId;
  partSpacing?: number;
  onPartSpacingChange?: (value: number) => void;
}

export interface SettingsGroupProps extends GroupProps {
  lang: string;
  onThemeToggle: () => void;
  onLanguageChange: () => void;
}
