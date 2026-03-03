/**
 * History Panel Component
 *
 * Displays operation history with undo/redo controls
 */

import React from 'react';
import { useHistory } from '../../contexts/HistoryContext';
import { EditOperation } from '../../contexts/HistoryContext';
import VersionPreview from './components/VersionPreview';
import ComparisonView from './components/ComparisonView';
import { getHistoryStyles } from './HistoryPanel.styles';
import HistoryPanelOperationCard from './HistoryPanel.OperationCard';

interface HistoryPanelProps {
  onUndo: () => void;
  onRedo: () => void;
  fileId: string;
  userId: string;
  username: string;
  theme: 'dark' | 'light';
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onUndo, onRedo, fileId, userId, username, theme }) => {
  const styles = React.useMemo(() => getHistoryStyles(theme), [theme]);
  const { historyState, isLoading, error, jumpToVersion } = useHistory();

  const [hoveredVersion, setHoveredVersion] = React.useState<number | null>(null);
  const [filterUser, setFilterUser] = React.useState<string>('all');
  const [filterOperations] = React.useState<Set<string>>(new Set());
  const [previewVersion, setPreviewVersion] = React.useState<number | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const previewTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [comparisonMode, setComparisonMode] = React.useState(false);
  const [comparisonVersion1, setComparisonVersion1] = React.useState<number | null>(null);
  const [comparisonVersion2, setComparisonVersion2] = React.useState<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, []);

  const handleJumpToVersion = React.useCallback(async (targetVersion: number) => {
    if (!fileId || !userId || !username) return;

    try {
      await jumpToVersion(fileId, targetVersion, userId, username);
    } catch (err) {
      console.error('Failed to jump to version:', err);
    }
  }, [fileId, jumpToVersion, userId, username]);

  const uniqueUsers = React.useMemo(() => {
    if (!historyState) return [];
    const users = new Set(historyState.operations.map(op => op.userId));
    return Array.from(users);
  }, [historyState]);

  const filteredOperations = React.useMemo(() => {
    if (!historyState) return [];

    return historyState.operations.filter(op => {
      if (filterUser !== 'all' && op.userId !== filterUser) {
        return false;
      }
      if (filterOperations.size > 0 && !filterOperations.has(op.operationType)) {
        return false;
      }
      return true;
    });
  }, [historyState, filterUser, filterOperations]);

  const handleOperationSelect = React.useCallback((operation: EditOperation) => {
    if (comparisonMode) {
      if (comparisonVersion1 === null) {
        setComparisonVersion1(operation.version);
      } else if (comparisonVersion2 === null && operation.version !== comparisonVersion1) {
        setComparisonVersion2(operation.version);
      } else {
        setComparisonVersion1(operation.version);
        setComparisonVersion2(null);
      }
      return;
    }

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    setPreviewVersion(null);
    handleJumpToVersion(operation.version);
  }, [comparisonMode, comparisonVersion1, comparisonVersion2, handleJumpToVersion]);

  const handleOperationHoverStart = React.useCallback((operation: EditOperation) => {
    setHoveredVersion(operation.version);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setPreviewVersion(operation.version);
    }, 500);
  }, []);

  const handleOperationHoverEnd = React.useCallback(() => {
    setHoveredVersion(null);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = setTimeout(() => {
      setPreviewVersion(null);
      previewTimeoutRef.current = null;
    }, 100);
  }, []);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>📜 操作历史</div>
        <div style={styles.loadingState}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>📜 操作历史</div>
        <div style={styles.errorState}>错误: {error}</div>
      </div>
    );
  }

  if (!historyState || historyState.operations.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.title}>📜 操作历史</div>
          <span style={styles.versionBadge}>v0</span>
        </div>
        <div style={styles.emptyState}>
          暂无历史记录<br />
          <span style={{ fontSize: '11px', opacity: 0.6 }}>开始编辑以查看历史</span>
        </div>
        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.button, ...styles.buttonDisabled }}
            onClick={onUndo}
            disabled
          >
            ↶ 撤销
          </button>
          <button
            style={{ ...styles.button, ...styles.buttonDisabled }}
            onClick={onRedo}
            disabled
          >
            ↷ 重做
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>📜 操作历史</div>
        <span style={styles.versionBadge}>v{historyState.currentVersion}</span>
      </div>

      <div style={styles.buttonGroup}>
        <button
          style={{
            ...styles.button,
            ...(historyState.canUndo ? {} : styles.buttonDisabled),
          }}
          onClick={onUndo}
          disabled={!historyState.canUndo}
          title="撤销 (Ctrl+Z)"
        >
          ↶ 撤销
        </button>
        <button
          style={{
            ...styles.button,
            ...(historyState.canRedo ? {} : styles.buttonDisabled),
          }}
          onClick={onRedo}
          disabled={!historyState.canRedo}
          title="重做 (Ctrl+Shift+Z)"
        >
          ↷ 重做
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          style={styles.select}
        >
          <option value="all">所有用户</option>
          {uniqueUsers.map(userId => {
            const op = historyState.operations.find(o => o.userId === userId);
            return (
              <option key={userId} value={userId}>
                {op?.username || userId}
              </option>
            );
          })}
        </select>

        <button
          style={{
            ...styles.button,
            flex: 'none',
            padding: '5px 8px',
            fontSize: '11px',
            borderColor: comparisonMode ? '#ff9f43' : '#444',
            backgroundColor: comparisonMode ? 'rgba(255, 159, 67, 0.1)' : '#333',
          }}
          onClick={() => {
            setComparisonMode(!comparisonMode);
            setComparisonVersion1(null);
            setComparisonVersion2(null);
          }}
          title={comparisonMode ? '取消对比' : '版本对比'}
        >
          {comparisonMode ? '✕ 取消' : '🔍 对比'}
        </button>
      </div>

      {comparisonMode && (comparisonVersion1 !== null || comparisonVersion2 !== null) && (
        <div style={{ fontSize: '11px', color: '#ff9f43', backgroundColor: 'rgba(255, 159, 67, 0.05)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255, 159, 67, 0.2)' }}>
          {comparisonVersion1 === null && '请选择第一个版本'}
          {comparisonVersion1 !== null && comparisonVersion2 === null && `已选 v${comparisonVersion1}，请选第二个版本`}
          {comparisonVersion1 !== null && comparisonVersion2 !== null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>v{comparisonVersion1} ↔ v{comparisonVersion2}</span>
              <button
                style={{ ...styles.button, padding: '2px 6px', fontSize: '10px', backgroundColor: '#2a4a2a', borderColor: '#1dd1a1', flex: 'none' }}
                onClick={() => {}}
              >
                查看
              </button>
            </div>
          )}
        </div>
      )}

      <div style={styles.operationList}>
        {filteredOperations.slice().reverse().map((operation) => (
          <HistoryPanelOperationCard
            key={operation.id ?? `${operation.version}-${operation.timestamp}`}
            operation={operation}
            currentVersion={historyState.currentVersion}
            hoveredVersion={hoveredVersion}
            styles={styles}
            onSelect={handleOperationSelect}
            onHoverStart={handleOperationHoverStart}
            onHoverEnd={handleOperationHoverEnd}
          />
        ))}
      </div>

      {previewVersion !== null && !comparisonMode && (
        <VersionPreview
          fileId={fileId}
          targetVersion={previewVersion}
          theme={theme}
          onClose={() => setPreviewVersion(null)}
        />
      )}

      {comparisonMode && comparisonVersion1 !== null && comparisonVersion2 !== null && (
        <ComparisonView
          fileId={fileId}
          version1={Math.min(comparisonVersion1, comparisonVersion2)}
          version2={Math.max(comparisonVersion1, comparisonVersion2)}
          theme={theme}
          onClose={() => {
            setComparisonVersion1(null);
            setComparisonVersion2(null);
          }}
        />
      )}
    </div>
  );
};

export default HistoryPanel;
