import type { Entity } from '../../../lib/webgpu/EntityToVertices';

export interface Point {
  x: number;
  y: number;
}

export interface SelectionRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type SelectionMode = 'window' | 'crossing';
export type ModifierKey = 'none' | 'shift' | 'ctrl';

export interface BoxSelectionState {
  isSelecting: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  selectionMode: SelectionMode;
  modifierKey: ModifierKey;
  selectedEntities: Set<string>;
}

export interface UseCADBoxSelectionOptions {
  entities: Entity[];
  onSelectionChange?: (selectedIds: Set<string>) => void;
  externalSelectedIds?: Set<string>;
}
