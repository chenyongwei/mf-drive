export interface NestingResultPanelColors {
  bg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  statBg: string;
  statLabel: string;
  cardBg: string;
  itemHover: string;
  itemSelected: string;
  itemSelectedBorder: string;
  buttonSecondaryBg: string;
  buttonSecondaryHover: string;
  buttonSecondaryText: string;
}

export function getNestingResultPanelColors(theme: 'light' | 'dark'): NestingResultPanelColors {
  const isDark = theme === 'dark';
  return {
    bg: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    textPrimary: isDark ? '#e5e7eb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    statBg: isDark ? '#2a2a2a' : '#f9fafb',
    statLabel: '#9ca3af',
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    itemHover: isDark ? '#3b2c4e' : '#faf5ff',
    itemSelected: isDark ? '#4c1d95' : '#ede9fe',
    itemSelectedBorder: '#8b5cf6',
    buttonSecondaryBg: isDark ? '#2a2a2a' : '#f9fafb',
    buttonSecondaryHover: isDark ? '#374151' : '#f3f4f6',
    buttonSecondaryText: isDark ? '#e5e7eb' : '#374151',
  };
}

export function buildNestingResultPanelCss(
  colors: NestingResultPanelColors,
  theme: 'light' | 'dark',
): string {
  return `
    .nesting-result-panel {
      position: absolute;
      right: 16px;
      top: 16px;
      width: 320px;
      max-height: calc(100% - 32px);
      background: ${colors.bg};
      backdrop-filter: blur(8px);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow-y: auto;
      z-index: 100;
      color: ${colors.textPrimary};
      border: 1px solid ${colors.border};
    }
    .nesting-result-header {
      padding: 16px;
      border-bottom: 1px solid ${colors.border};
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .nesting-result-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: white;
    }
    .utilization-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      color: white;
    }
    .nesting-result-content {
      padding: 16px;
    }
    .result-section {
      margin-bottom: 20px;
    }
    .result-section-title {
      font-size: 13px;
      font-weight: 600;
      color: ${colors.textSecondary};
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .stat-item {
      background: ${colors.statBg};
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: ${colors.textPrimary};
    }
    .stat-label {
      font-size: 11px;
      color: ${colors.statLabel};
      margin-top: 2px;
    }
    .part-group {
      margin-bottom: 12px;
    }
    .part-group-title {
      font-size: 13px;
      font-weight: 600;
      color: ${colors.textPrimary};
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    .part-group-count {
      background: #e0e7ff;
      color: #4338ca;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
    }
    .part-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .part-item {
      padding: 8px 12px;
      background: ${theme === 'dark' ? '#2c2c2c' : 'white'};
      border: 1px solid ${colors.border};
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .part-item:hover {
      border-color: ${colors.itemSelectedBorder};
      background: ${colors.itemHover};
    }
    .part-item.selected {
      border-color: ${colors.itemSelectedBorder};
      background: ${colors.itemSelected};
    }
    .part-item-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .part-item-name {
      font-size: 12px;
      font-weight: 500;
      color: ${colors.textPrimary};
    }
    .part-item-position {
      font-size: 10px;
      color: ${colors.textSecondary};
    }
    .scrap-lines-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .scrap-line-item {
      padding: 10px;
      background: ${theme === 'dark' ? '#2c2c2c' : 'white'};
      border: 1px solid ${colors.border};
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .scrap-line-type {
      font-size: 12px;
      font-weight: 500;
      color: ${colors.textPrimary};
    }
    .scrap-line-area {
      font-size: 11px;
      color: ${colors.textSecondary};
    }
    .btn-icon {
      padding: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: ${colors.textSecondary};
      transition: color 0.2s;
    }
    .btn-icon:hover {
      color: #ef4444;
    }
    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    .btn-action {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .btn-secondary {
      background: ${colors.buttonSecondaryBg};
      color: ${colors.buttonSecondaryText};
      border: 1px solid ${colors.border};
    }
    .btn-secondary:hover {
      background: ${colors.buttonSecondaryHover};
    }
  `;
}
