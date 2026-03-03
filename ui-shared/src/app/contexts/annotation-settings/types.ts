import type { ReactNode } from 'react';

export interface DimensionDisplaySettings {
  drawing: boolean;
  nesting: boolean;
}

export interface AnnotationSettings {
  dimension_display: DimensionDisplaySettings;
}

export interface AnnotationSettingsContextValue {
  showDimensionsDrawing: boolean;
  showDimensionsNesting: boolean;
  setShowDimensionsDrawing: (value: boolean) => void;
  setShowDimensionsNesting: (value: boolean) => void;
  toggleDimensionsDrawing: () => void;
  toggleDimensionsNesting: () => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
}

export interface AnnotationSettingsProviderProps {
  children: ReactNode;
  autoSync?: boolean;
}

export const LOCAL_STORAGE_KEY = 'dimension-display-settings';
export const API_BASE = '/api/user-settings';
export const DEBOUNCE_MS = 500;
export const DEFAULT_SETTINGS: DimensionDisplaySettings = {
  drawing: false,
  nesting: false,
};
