export type OptimizationTool =
  | 'removeDuplicates'
  | 'mergeConnectedLines'
  | 'closeContours'
  | 'explode';

export interface OptimizationPreviewData {
  removeDuplicates?: number;
  mergeConnectedLines?: number;
  closeContours?: number;
  explode?: number;
  totalEntitiesAffected?: number;
}

export const optimizationStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: '8px',
  },
  toolGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  toolButton: {
    padding: '12px',
    backgroundColor: '#3a3a3a',
    border: '1px solid #4a4a4a',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  toolButtonHover: {
    backgroundColor: '#4a4a4a',
    borderColor: '#4a9eff',
  },
  toolButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  toolIcon: {
    fontSize: '20px',
  },
  toolName: {
    fontWeight: 'bold' as const,
  },
  toolDescription: {
    fontSize: '10px',
    color: '#888',
    textAlign: 'center' as const,
  },
  toleranceContainer: {
    padding: '12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
  },
  toleranceLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '6px',
  },
  toleranceInput: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#3a3a3a',
    border: '1px solid #4a4a4a',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '14px',
  },
  infoBox: {
    padding: '10px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.4',
  },
  infoTitle: {
    fontWeight: 'bold' as const,
    color: '#4a9eff',
    marginBottom: '4px',
  },
};

export const OPTIMIZATION_TOOL_META: Record<
  OptimizationTool,
  {
    icon: string;
    name: string;
    description: string;
  }
> = {
  removeDuplicates: {
    icon: '🗑️',
    name: '删除重复',
    description: '删除重复和重叠线条',
  },
  mergeConnectedLines: {
    icon: '🔗',
    name: '合并相连',
    description: '合并端点相连的线条',
  },
  closeContours: {
    icon: '🔄',
    name: '闭合轮廓',
    description: '自动闭合未封闭轮廓',
  },
  explode: {
    icon: '💥',
    name: '炸开',
    description: '将选中的多段线炸开为线段',
  },
};
