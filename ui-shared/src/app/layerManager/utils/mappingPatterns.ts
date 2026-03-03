import { getAutocadColor } from '../../utils/autocadColors';

// Smart mapping rules based on layer name patterns
export const MAPPING_PATTERNS: Array<{ pattern: RegExp; processType: 'CUT' | 'MARK' | 'NONE'; priority: number }> = [
  { pattern: /cut/i, processType: 'CUT', priority: 10 },
  { pattern: /轮廓/i, processType: 'CUT', priority: 10 },
  { pattern: /contour/i, processType: 'CUT', priority: 10 },
  { pattern: /mark/i, processType: 'MARK', priority: 10 },
  { pattern: /标/i, processType: 'MARK', priority: 10 },
  { pattern: /dim/i, processType: 'NONE', priority: 8 },
  { pattern: /尺寸/i, processType: 'NONE', priority: 8 },
  { pattern: /text/i, processType: 'NONE', priority: 8 },
  { pattern: /文字/i, processType: 'NONE', priority: 8 },
  { pattern: /center/i, processType: 'NONE', priority: 7 },
  { pattern: /中心/i, processType: 'NONE', priority: 7 },
  { pattern: /hatch/i, processType: 'NONE', priority: 7 },
  { pattern: /填充/i, processType: 'NONE', priority: 7 },
];

// Suggest process type based on layer name
export function suggestProcessType(layerName: string): 'CUT' | 'MARK' | 'NONE' {
  for (const { pattern, processType } of MAPPING_PATTERNS) {
    if (pattern.test(layerName)) {
      return processType;
    }
  }
  return 'NONE';
}

// Get suggestion explanation
export function getSuggestionExplanation(layerName: string): string | null {
  for (const { pattern, processType } of MAPPING_PATTERNS) {
    if (pattern.test(layerName)) {
      switch (processType) {
        case 'CUT':
          return '建议：根据图层名称推测为切割轮廓';
        case 'MARK':
          return '建议：根据图层名称推测为打标内容';
        case 'NONE':
          return '建议：根据图层名称推测为辅助信息';
      }
    }
  }
  return null;
}

export { getAutocadColor };
