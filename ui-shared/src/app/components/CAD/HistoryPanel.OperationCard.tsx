import React from 'react';
import { EditOperation } from '../../contexts/HistoryContext';
import { operationTypeColors, operationTypeLabels } from './HistoryPanel.constants';
import { getRandomColor } from './HistoryPanel.utils';
import type { HistoryPanelStyles } from './HistoryPanel.styles';

interface HistoryPanelOperationCardProps {
  operation: EditOperation;
  currentVersion: number;
  hoveredVersion: number | null;
  styles: HistoryPanelStyles;
  onSelect: (operation: EditOperation) => void;
  onHoverStart: (operation: EditOperation) => void;
  onHoverEnd: () => void;
}

const HistoryPanelOperationCard: React.FC<HistoryPanelOperationCardProps> = ({
  operation,
  currentVersion,
  hoveredVersion,
  styles,
  onSelect,
  onHoverStart,
  onHoverEnd,
}) => {
  const isCurrentVersion = operation.version === currentVersion;
  const isFutureVersion = operation.version > currentVersion;
  const isHovered = hoveredVersion === operation.version;
  const operationColor = operationTypeColors[operation.operationType] || '#4a9eff';

  return (
    <div
      style={{
        ...styles.operationItem,
        borderLeftColor: operationColor,
        opacity: isFutureVersion ? 0.4 : 1,
        backgroundColor: isCurrentVersion
          ? 'rgba(74, 158, 255, 0.15)'
          : isHovered
            ? '#3a3a3a'
            : '#2a2a2a',
        ...(isHovered ? styles.operationItemHover : {}),
        borderColor: isCurrentVersion ? '#4a9eff' : operationColor,
      }}
      onClick={() => onSelect(operation)}
      onMouseEnter={() => onHoverStart(operation)}
      onMouseLeave={onHoverEnd}
    >
      <div style={styles.operationMain}>
        <div style={styles.operationType}>
          {operationTypeLabels[operation.operationType] || operation.operationType}
        </div>
        <div
          style={{
            ...styles.versionBadge,
            backgroundColor: isCurrentVersion ? '#4a9eff' : '#333',
            color: isCurrentVersion ? '#fff' : '#888',
            borderColor: isCurrentVersion ? '#4a9eff' : '#444',
          }}
        >
          v{operation.version}
        </div>
      </div>

      {operation.entityId && (
        <div style={styles.operationDetails}>ID: {operation.entityId.slice(0, 12)}...</div>
      )}

      {operation.entityIds && operation.entityIds.length > 0 && (
        <div style={styles.operationDetails}>{operation.entityIds.length} 个对象</div>
      )}

      <div style={styles.operationMeta}>
        <div style={styles.operationUser}>
          <span
            style={{
              ...styles.userColor,
              backgroundColor: getRandomColor(operation.userId),
            }}
          />
          {operation.username}
        </div>
        <div style={styles.operationTime}>
          {new Date(operation.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanelOperationCard;
