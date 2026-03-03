import React from 'react';
import { EditOperation } from '../../contexts/HistoryContext';
import { getStyles, getRandomColor, operationTypeColors, operationTypeLabels } from './PropertyPanel.styles';

interface PropertyPanelHistoryTabProps {
  styles: ReturnType<typeof getStyles>;
  historyState: { currentVersion: number; operations: EditOperation[] } | null;
  isLoading: boolean;
  error: string | null;
}

const PropertyPanelHistoryTab: React.FC<PropertyPanelHistoryTabProps> = ({
  styles,
  historyState,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return <div style={styles.emptyState}>加载中...</div>;
  }

  if (error) {
    return <div style={{ ...styles.emptyState, color: '#ff6b6b' }}>错误: {error}</div>;
  }

  if (!historyState || historyState.operations.length === 0) {
    return (
      <div style={styles.emptyState}>
        暂无操作记录<br />开始编辑以查看历史
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <div style={styles.title}>
        📜 操作历史
        <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
          v{historyState.currentVersion}
        </span>
      </div>

      <div style={styles.operationList}>
        {historyState.operations.slice().reverse().map((operation) => (
          <div
            key={operation.id}
            style={{
              ...styles.operationItem,
              borderLeftColor: operationTypeColors[operation.operationType] || '#4a9eff',
            }}
          >
            <div style={styles.operationType}>
              {operationTypeLabels[operation.operationType] || operation.operationType}
            </div>

            {operation.entityId && (
              <div style={styles.operationDetails}>实体: {operation.entityId.slice(0, 8)}...</div>
            )}

            {operation.entityIds && operation.entityIds.length > 0 && (
              <div style={styles.operationDetails}>{operation.entityIds.length} 个实体</div>
            )}

            <div style={styles.operationUser}>
              <span
                style={{
                  ...styles.userColor,
                  backgroundColor: getRandomColor(operation.userId),
                }}
              />
              {operation.username}
              <span style={{ marginLeft: 'auto', color: '#444' }}>
                {new Date(operation.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyPanelHistoryTab;
