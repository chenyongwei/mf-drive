import type { BoundingBox } from './base';
import type { EditOperation } from './edit';

// ==================== 视图状态类型 ====================

export interface ViewState {
  zoom: number;
  pan: { x: number; y: number };
  viewport: BoundingBox;
}

export interface SelectionItem {
  id: string;
  fileId: string;
}

export interface SelectionState {
  parts: SelectionItem[];
  entities: SelectionItem[];
}

export interface EditingState {
  mode: "select" | "pan" | "connect" | "measure";
  history: EditOperation[];
  historyIndex: number;
}
