/**
 * Feature Flags Configuration
 *
 * This file controls which features are enabled/disabled in the WebCAD application.
 *
 * Usage:
 * - To disable a feature package: Set enabled to false at the package level
 * - To disable a specific feature: Set enabled to false at the feature level
 * - To disable a specific UI element: Set enabled to false at the children level
 *
 * Example: Disable "合并相连线" button:
 *   DRAWING.OPTIMIZATION.children.MERGE_LINES.enabled = false
 *
 * Example: Disable entire "图形优化" feature:
 *   DRAWING.OPTIMIZATION.enabled = false
 */

import {
  FeatureFlags,
  FeaturePackage,
  DrawingFeature,
  PartFeature,
  NestingFeature,
  CommonFeature,
  UIElement,
} from "@dxf-fix/shared";

// ============================================================================
// Default Configuration - All Features Enabled
// ============================================================================

/**
 * Default feature flags configuration with all features enabled
 * Modify this file or import a custom JSON to customize feature availability
 */
export const defaultFeatureFlags: FeatureFlags = {
  // =========================================================================
  // Drawing/DXF Features (图纸相关)
  // =========================================================================
  [FeaturePackage.DRAWING]: {
    // 编辑功能（修剪、延伸、删除）
    [DrawingFeature.EDIT]: {
      enabled: true,
    },

    // 图形检查
    [DrawingFeature.INSPECTION]: {
      enabled: true,
    },

    // 图形优化
    [DrawingFeature.OPTIMIZATION]: {
      enabled: true,
      children: {
        // 合并相连线
        [UIElement.MERGE_LINES]: {
          enabled: true,
        },
        // 去除重复线
        [UIElement.REMOVE_DUPLICATES]: {
          enabled: true,
        },
        // 炸碎
        [UIElement.EXPLODE]: {
          enabled: true,
        },
        // 自动闭合
        [UIElement.AUTO_CLOSE]: {
          enabled: true,
        },
      },
    },

    // 识别零件
    [DrawingFeature.PART_RECOGNITION]: {
      enabled: true,
    },
  },

  // =========================================================================
  // Part/PRTS Features (零件相关)
  // =========================================================================
  [FeaturePackage.PART]: {
    // 填充色
    [PartFeature.FILL_COLOR]: {
      enabled: true,
    },

    // 图层编辑
    [PartFeature.LAYER_EDIT]: {
      enabled: true,
      children: {
        // 切割
        [UIElement.CUTTING]: {
          enabled: true,
        },
        // 精细切割
        [UIElement.FINE_CUTTING]: {
          enabled: true,
        },
        // 打标/去膜
        [UIElement.MARKING]: {
          enabled: true,
        },
        // 切断
        [UIElement.CUT_OFF]: {
          enabled: true,
        },
      },
    },

    // 图形工艺
    [PartFeature.PROCESS]: {
      enabled: true,
      children: {
        // 微连
        [UIElement.MICRO_CONNECTION]: {
          enabled: true,
        },
        // 补偿
        [UIElement.COMPENSATION]: {
          enabled: true,
        },
      },
    },
  },

  // =========================================================================
  // Nesting Features (排样相关) - All enabled by default
  // =========================================================================
  [FeaturePackage.NESTING]: {
    // 零件旋转
    [NestingFeature.PART_ROTATION]: {
      enabled: true,
    },

    // 碰撞检测
    [NestingFeature.COLLISION_DETECTION]: {
      enabled: true,
    },

    // 板材边框
    [NestingFeature.PLATE_BORDER]: {
      enabled: true,
    },

    // 留边
    [NestingFeature.MARGIN]: {
      enabled: true,
    },

    // 排样模式 (Default to false unless overridden)
    [NestingFeature.NESTING_MODE]: {
      enabled: false,
    },
  },

  // =========================================================================
  // Common Features (通用功能)
  // =========================================================================
  [FeaturePackage.COMMON]: {
    // 图形和零件的边框（虚线）
    [CommonFeature.BOUNDING_BOX]: {
      enabled: true,
    },

    // 文件名/零件名显示
    [CommonFeature.NAME_LABEL]: {
      enabled: true,
    },

    // 操作历史面板
    [CommonFeature.OPERATION_HISTORY]: {
      enabled: true,
    },
  },
};

// ============================================================================
// Export Configuration
// ============================================================================

/**
 * Current active feature flags configuration
 *
 * To customize features, you have two options:
 *
 * Option 1: Directly modify defaultFeatureFlags above
 * Option 2: Create a custom JSON file and merge it:
 *
 * import customConfig from './featureFlags.custom.json';
 * export const featureFlags: FeatureFlags = deepMerge(defaultFeatureFlags, customConfig);
 */
export const featureFlags: FeatureFlags = defaultFeatureFlags;

// ============================================================================
// Helper: Deep Merge for Custom Configurations (Optional)
// ============================================================================

/**
 * Deep merge two objects
 * Useful for merging custom configurations with defaults
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target } as any;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject((source as any)[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: (source as any)[key] });
        } else {
          output[key] = deepMerge(target[key], (source as any)[key]);
        }
      } else {
        Object.assign(output, { [key]: (source as any)[key] });
      }
    });
  }

  return output;
}

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === "object" && !Array.isArray(item));
}
