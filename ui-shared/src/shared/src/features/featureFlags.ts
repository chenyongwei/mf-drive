/**
 * Feature Flags System
 *
 * Provides granular control over WebCAD features at three levels:
 * 1. Feature Package (大类)
 * 2. Feature (子功能)
 * 3. UI Element (单个按钮)
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Feature Package Categories (大类)
 */
export enum FeaturePackage {
  DRAWING = 'drawing',        // 针对图纸：编辑、检查、优化、识别
  PART = 'part',              // 针对零件：填充、图层、工艺
  NESTING = 'nesting',        // 针对排样：旋转、碰撞、边框、留边
  COMMON = 'common'           // 通用功能：边框、名称显示
}

/**
 * Drawing/DXF Features (图纸相关功能)
 */
export enum DrawingFeature {
  EDIT = 'edit',                      // 编辑功能（修剪、延伸、删除）
  INSPECTION = 'inspection',          // 图形检查
  OPTIMIZATION = 'optimization',      // 图形优化（合并、去重、炸碎、闭合）
  PART_RECOGNITION = 'partRecognition' // 识别零件
}

/**
 * Part/PRTS Features (零件相关功能)
 */
export enum PartFeature {
  FILL_COLOR = 'fillColor',           // 填充色
  LAYER_EDIT = 'layerEdit',           // 图层编辑（切割、精细切割、打标、切断）
  PROCESS = 'process'                 // 图形工艺（微连、补偿）
}

/**
 * Nesting Features (排样相关功能)
 */
export enum NestingFeature {
  PART_ROTATION = 'partRotation',           // 零件旋转
  COLLISION_DETECTION = 'collisionDetection', // 碰撞检测
  PLATE_BORDER = 'plateBorder',             // 板材边框
  MARGIN = 'margin',                         // 留边
  NESTING_MODE = 'nestingMode'               // 排样模式
}

/**
 * Common Features (通用功能)
 */
export enum CommonFeature {
  BOUNDING_BOX = 'boundingBox',       // 图形和零件的边框（虚线）
  NAME_LABEL = 'nameLabel',           // 文件名/零件名显示
  OPERATION_HISTORY = 'operationHistory' // 操作历史面板
}

/**
 * UI Elements - Individual Buttons/Controls (UI 元素级别)
 */
export enum UIElement {
  // Drawing - Optimization Children
  MERGE_LINES = 'mergeLines',               // 合并相连线
  REMOVE_DUPLICATES = 'removeDuplicates',   // 去除重复线
  EXPLODE = 'explode',                      // 炸碎
  AUTO_CLOSE = 'autoClose',                 // 自动闭合

  // Part - Layer Edit Children
  CUTTING = 'cutting',                      // 切割
  FINE_CUTTING = 'fineCutting',             // 精细切割
  MARKING = 'marking',                      // 打标/去膜
  CUT_OFF = 'cutOff',                       // 切断

  // Part - Process Children
  MICRO_CONNECTION = 'microConnection',     // 微连
  COMPENSATION = 'compensation'             // 补偿
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Feature Flag Configuration Node
 * Supports hierarchical structure with children
 */
export interface FeatureFlagConfig {
  /** Whether this feature is enabled */
  enabled: boolean;
  /** Child features (for UI Element level control) */
  children?: Record<string, FeatureFlagConfig>;
}

/**
 * Feature Flags Configuration Structure
 * Organized by Feature Package > Feature > UI Element
 */
export interface FeatureFlags {
  [FeaturePackage.DRAWING]?: {
    [DrawingFeature.EDIT]?: FeatureFlagConfig;
    [DrawingFeature.INSPECTION]?: FeatureFlagConfig;
    [DrawingFeature.OPTIMIZATION]?: FeatureFlagConfig;
    [DrawingFeature.PART_RECOGNITION]?: FeatureFlagConfig;
  };
  [FeaturePackage.PART]?: {
    [PartFeature.FILL_COLOR]?: FeatureFlagConfig;
    [PartFeature.LAYER_EDIT]?: FeatureFlagConfig;
    [PartFeature.PROCESS]?: FeatureFlagConfig;
  };
  [FeaturePackage.NESTING]?: {
    [NestingFeature.PART_ROTATION]?: FeatureFlagConfig;
    [NestingFeature.COLLISION_DETECTION]?: FeatureFlagConfig;
    [NestingFeature.PLATE_BORDER]?: FeatureFlagConfig;
    [NestingFeature.MARGIN]?: FeatureFlagConfig;
    [NestingFeature.NESTING_MODE]?: FeatureFlagConfig;
  };
  [FeaturePackage.COMMON]?: {
    [CommonFeature.BOUNDING_BOX]?: FeatureFlagConfig;
    [CommonFeature.NAME_LABEL]?: FeatureFlagConfig;
    [CommonFeature.OPERATION_HISTORY]?: FeatureFlagConfig;
  };
}

// ============================================================================
// Helper Types for Component Props
// ============================================================================

/**
 * Feature identifier tuple for type-safe feature flag checking
 */
export type FeatureIdentifier =
  | [FeaturePackage.DRAWING, DrawingFeature]
  | [FeaturePackage.PART, PartFeature]
  | [FeaturePackage.NESTING, NestingFeature]
  | [FeaturePackage.COMMON, CommonFeature];

/**
 * UI Element identifier tuple for granular control
 */
export type UIElementIdentifier =
  | [FeaturePackage.DRAWING, DrawingFeature.OPTIMIZATION, UIElement]
  | [FeaturePackage.PART, PartFeature.LAYER_EDIT, UIElement]
  | [FeaturePackage.PART, PartFeature.PROCESS, UIElement];
