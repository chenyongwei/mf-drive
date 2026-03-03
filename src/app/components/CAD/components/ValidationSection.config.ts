import { InspectionLevel, IssueType } from '@dxf-fix/shared/types/inspection';
import {
  PRIMARY_ACTION_BUTTON_DISABLED_STYLE,
  PRIMARY_ACTION_BUTTON_HOVER_STYLE,
  PRIMARY_ACTION_BUTTON_STYLE,
} from '../commonButtonStyles';

export const validationStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  summaryCard: {
    padding: '12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    border: '1px solid #3a3a3a',
  },
  summaryTitle: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: '8px',
  },
  summaryStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
  },
  statItem: {
    flex: 1,
    textAlign: 'center' as const,
    padding: '6px',
    borderRadius: '4px',
    backgroundColor: '#3a3a3a',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    marginBottom: '2px',
  },
  statLabel: {
    fontSize: '11px',
    color: '#888',
  },
  button: {
    width: '100%',
    ...PRIMARY_ACTION_BUTTON_STYLE,
  },
  buttonHover: PRIMARY_ACTION_BUTTON_HOVER_STYLE,
  buttonDisabled: PRIMARY_ACTION_BUTTON_DISABLED_STYLE,
  filterContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  filterButton: {
    flex: '1 1 calc(50% - 3px)',
    padding: '6px 10px',
    backgroundColor: '#3a3a3a',
    border: '1px solid #4a4a4a',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#888',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    borderColor: '#4a9eff',
  },
  issueList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  issueCard: {
    padding: '10px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
    borderLeft: '3px solid #4a9eff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  issueCardHover: {
    backgroundColor: '#3a3a3a',
  },
  issueType: {
    fontSize: '13px',
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: '4px',
  },
  issueMessage: {
    fontSize: '12px',
    color: '#ccc',
    marginBottom: '6px',
  },
  issueMeta: {
    fontSize: '11px',
    color: '#888',
  },
  emptyState: {
    fontSize: '13px',
    color: '#888',
    textAlign: 'center' as const,
    padding: '20px',
  },
  loadingState: {
    fontSize: '13px',
    color: '#4a9eff',
    textAlign: 'center' as const,
    padding: '20px',
  },
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  [IssueType.UNCLOSED_CONTOUR]: '未闭合轮廓',
  [IssueType.DUPLICATE_LINES]: '重复线条',
  [IssueType.OVERLAPPING_LINES]: '重叠线条',
  [IssueType.SELF_INTERSECTION]: '自相交',
  [IssueType.TINY_ENTITY]: '微小实体',
  [IssueType.ZERO_LENGTH]: '零长度线',
};

export const LEVEL_COLORS: Record<InspectionLevel, string> = {
  [InspectionLevel.ERROR]: '#f44336',
  [InspectionLevel.WARNING]: '#ff9800',
  [InspectionLevel.INFO]: '#2196f3',
};
