import type { EntityGeometry } from './dxf';

// ==================== 编辑操作类型 ====================

export type EditOperationType =
  | "MERGE_LINES"
  | "DELETE_ENTITIES"
  | "ADD_LINE"
  | "CONNECT_LINES"
  | "MOVE_ENTITY"
  | "EXPLODE_ENTITY";

export interface EditOperation {
  type: EditOperationType;
  entityIds?: string[];
  geometry?: EntityGeometry;
  layer?: string;
}
