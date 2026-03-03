/**
 * Optimization Preview Component
 *
 * Shows preview of optimization operations before applying them.
 * Displays summary of changes and allows user to confirm or cancel.
 */

import React from 'react';

interface OptimizationPreviewProps {
  isLoading: boolean;
  preview: {
    removeDuplicates?: number;
    mergeConnectedLines?: number;
    closeContours?: number;
    explode?: number;
    totalEntitiesAffected?: number;
  } | null;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    border: '1px solid #4a9eff',
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#4a9eff',
    marginBottom: '12px',
  },
  summary: {
    marginBottom: '16px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #3a3a3a',
    fontSize: '13px',
  },
  label: {
    color: '#ccc',
  },
  value: {
    color: '#ffffff',
    fontWeight: 'bold' as const,
  },
  totalAffected: {
    marginTop: '12px',
    padding: '10px',
    backgroundColor: '#3a3a3a',
    borderRadius: '4px',
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#4a9eff',
    fontWeight: 'bold' as const,
  },
  buttonContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  button: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s',
  },
  buttonConfirm: {
    backgroundColor: '#4caf50',
    color: '#ffffff',
  },
  buttonConfirmHover: {
    backgroundColor: '#45a049',
  },
  buttonCancel: {
    backgroundColor: '#f44336',
    color: '#ffffff',
  },
  buttonCancelHover: {
    backgroundColor: '#da190b',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#4a9eff',
    fontSize: '14px',
  },
  error: {
    padding: '10px',
    backgroundColor: '3a1a1a',
    borderRadius: '4px',
    color: '#ff6b6b',
    fontSize: '13px',
    marginBottom: '12px',
  },
};

const OptimizationPreview: React.FC<OptimizationPreviewProps> = ({
  isLoading,
  preview,
  error,
  onConfirm,
  onCancel,
}) => {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          🔄 正在分析图纸...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>⚠️ 预览失败</div>
        <div style={styles.error}>{error}</div>
        <div style={styles.buttonContainer}>
          <button
            style={{ ...styles.button, ...styles.buttonCancel }}
            onClick={onCancel}
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  // Calculate total entities affected
  const totalAffected =
    (preview.removeDuplicates || 0) +
    (preview.mergeConnectedLines || 0) +
    (preview.closeContours || 0) +
    (preview.explode || 0);

  return (
    <div style={styles.container}>
      <div style={styles.title}>📋 优化预览</div>

      <div style={styles.summary}>
        {preview.removeDuplicates !== undefined && preview.removeDuplicates > 0 && (
          <div style={styles.summaryItem}>
            <span style={styles.label}>🗑️ 删除重复线条</span>
            <span style={styles.value}>{preview.removeDuplicates} 条</span>
          </div>
        )}

        {preview.mergeConnectedLines !== undefined && preview.mergeConnectedLines > 0 && (
          <div style={styles.summaryItem}>
            <span style={styles.label}>🔗 合并相连线条</span>
            <span style={styles.value}>{preview.mergeConnectedLines} 条</span>
          </div>
        )}

        {preview.closeContours !== undefined && preview.closeContours > 0 && (
          <div style={styles.summaryItem}>
            <span style={styles.label}>🔄 闭合轮廓</span>
            <span style={styles.value}>{preview.closeContours} 个</span>
          </div>
        )}

        {preview.explode !== undefined && preview.explode > 0 && (
          <div style={styles.summaryItem}>
            <span style={styles.label}>💥 炸开实体</span>
            <span style={styles.value}>{preview.explode} 个</span>
          </div>
        )}

        {totalAffected > 0 && (
          <div style={styles.totalAffected}>
            总计影响 {totalAffected} 个实体
          </div>
        )}
      </div>

      <div style={styles.buttonContainer}>
        <button
          style={{
            ...styles.button,
            ...styles.buttonCancel,
          }}
          onClick={onCancel}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = styles.buttonCancelHover.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = styles.buttonCancel.backgroundColor;
          }}
        >
          ❌ 取消
        </button>
        <button
          style={{
            ...styles.button,
            ...styles.buttonConfirm,
          }}
          onClick={onConfirm}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = styles.buttonConfirmHover.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = styles.buttonConfirm.backgroundColor;
          }}
        >
          ✅ 应用
        </button>
      </div>
    </div>
  );
};

export default OptimizationPreview;
