import {
  PRIMARY_ACTION_BUTTON_DISABLED_STYLE,
  PRIMARY_ACTION_BUTTON_HOVER_STYLE,
  PRIMARY_ACTION_BUTTON_STYLE,
} from './commonButtonStyles';

export const getStyles = (theme: 'dark' | 'light') => ({
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  tabContainer: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
    borderBottom: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #ddd',
  },
  tab: {
    flex: 1,
    padding: '8px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    fontSize: '14px',
    color: theme === 'dark' ? '#888' : '#666',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#4a9eff',
    borderBottom: '2px solid #4a9eff',
  },
  tabContent: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '12px',
    color: theme === 'dark' ? '#ffffff' : '#333333',
  },
  section: {
    marginBottom: '20px',
  },
  label: {
    fontSize: '12px',
    color: theme === 'dark' ? '#888' : '#666',
    marginBottom: '4px',
  },
  value: {
    fontSize: '14px',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    marginBottom: '8px',
  },
  emptyState: {
    fontSize: '14px',
    color: theme === 'dark' ? '#888' : '#666',
    textAlign: 'center' as const,
    padding: '20px',
  },
  entityCard: {
    backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f5f5f5',
    border: theme === 'dark' ? 'none' : '1px solid #ddd',
    borderRadius: '4px',
    padding: '8px',
    marginBottom: '8px',
  },
  operationList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  operationItem: {
    padding: '8px 12px',
    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
    borderRadius: '4px',
    borderLeft: '3px solid #4a9eff',
    borderRight: theme === 'dark' ? 'none' : '1px solid #eee',
    borderTop: theme === 'dark' ? 'none' : '1px solid #eee',
    borderBottom: theme === 'dark' ? 'none' : '1px solid #eee',
  },
  operationType: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: theme === 'dark' ? '#ffffff' : '#333333',
    marginBottom: '4px',
  },
  operationDetails: {
    fontSize: '12px',
    color: theme === 'dark' ? '#888' : '#666',
    marginBottom: '4px',
  },
  operationUser: {
    fontSize: '11px',
    color: theme === 'dark' ? '#666' : '#999',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  userColor: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  button: {
    width: '100%',
    marginBottom: '8px',
    ...PRIMARY_ACTION_BUTTON_STYLE,
  },
  buttonHover: PRIMARY_ACTION_BUTTON_HOVER_STYLE,
  buttonDisabled: PRIMARY_ACTION_BUTTON_DISABLED_STYLE,
  buttonSecondary: {
    backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f0f0f0',
    border: theme === 'dark' ? '1px solid #4a4a4a' : '1px solid #ccc',
    color: theme === 'dark' ? '#eee' : '#333',
  },
  buttonSecondaryHover: {
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#e0e0e0',
  },
  statusMessage: {
    padding: '8px 12px',
    marginBottom: '12px',
    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f7ff',
    borderRadius: '4px',
    fontSize: '12px',
    textAlign: 'center' as const,
    borderLeft: '3px solid #4a9eff',
    color: theme === 'dark' ? '#eee' : '#333',
  },
  statusSuccess: {
    borderLeftColor: '#4caf50',
    backgroundColor: theme === 'dark' ? '#1b3b1d' : '#e8f5e9',
  },
  statusError: {
    borderLeftColor: '#ff6b6b',
    backgroundColor: theme === 'dark' ? '#3d1b1b' : '#ffebee',
  },
  statusWarning: {
    borderLeftColor: '#ff9f43',
    backgroundColor: theme === 'dark' ? '#3d2b1b' : '#fff3e0',
  },
});

export const operationTypeLabels: Record<string, string> = {
  create: '➕ 创建',
  trim: '✂️ 修剪',
  extend: '📏 延伸',
  delete: '🗑️ 删除',
  explode: '💥 炸开',
  move: '✋ 移动',
  rotate: '🔄 旋转',
  update: '📝 更新',
};

export const operationTypeColors: Record<string, string> = {
  create: '#10b981',
  trim: '#ff9f43',
  extend: '#54a0ff',
  delete: '#ff6b6b',
  explode: '#f97316',
  move: '#1dd1a1',
  rotate: '#5f27cd',
  update: '#3b82f6',
};

export { getRandomColor } from './HistoryPanel.utils';
