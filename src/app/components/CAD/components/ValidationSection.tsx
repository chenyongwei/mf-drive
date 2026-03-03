/**
 * Validation Section Component
 *
 * Handles drawing inspection and issue management.
 * Can be integrated into PropertyPanel or used standalone.
 */

import React, { useState, useCallback } from 'react';
import { InspectionResult, InspectionIssue, InspectionLevel } from '@dxf-fix/shared/types/inspection';
import {
  ISSUE_TYPE_LABELS,
  LEVEL_COLORS,
  validationStyles,
} from './ValidationSection.config';

interface ValidationSectionProps {
  fileId: string | null;
  onIssueSelect?: (issue: InspectionIssue) => void;
  onHighlightEntities?: (entityIds: string[]) => void;
  onInspectionComplete?: (result: InspectionResult) => void;
  onQuickFix?: (tool: string) => void;
}

const ValidationSection: React.FC<ValidationSectionProps> = ({
  fileId,
  onIssueSelect,
  onHighlightEntities,
  onInspectionComplete,
  onQuickFix,
}) => {
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<InspectionLevel | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Run inspection
  const runInspection = useCallback(async () => {
    if (!fileId) {
      setError('请先选择一个文件');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsInspecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/drawing/files/${fileId}/inspect?tolerance=0.5`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: InspectionResult = await response.json();
      setInspectionResult(result);

      // Notify parent component
      if (onInspectionComplete) {
        onInspectionComplete(result);
      }
    } catch (err) {
      console.error('Inspection failed:', err);
      setError(`检测失败: ${err instanceof Error ? err.message : '未知错误'}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsInspecting(false);
    }
  }, [fileId]);

  // Handle issue click
  const handleIssueClick = useCallback((issue: InspectionIssue) => {
    setSelectedIssueId(issue.id);

    // Notify parent components
    if (onIssueSelect) {
      onIssueSelect(issue);
    }

    // Highlight related entities
    if (onHighlightEntities && issue.entities) {
      onHighlightEntities(issue.entities);
    }
  }, [onIssueSelect, onHighlightEntities]);

  // Filter issues by severity level
  const filteredIssues = React.useMemo(() => {
    if (!inspectionResult) return [];

    let issues = inspectionResult.issues;

    if (filterLevel) {
      issues = issues.filter(issue => issue.level === filterLevel);
    }

    return issues;
  }, [inspectionResult, filterLevel]);

  return (
    <div style={validationStyles.container}>
      {/* Run Inspection Button */}
      <button
        style={{
          ...validationStyles.button,
          ...(!fileId || isInspecting ? validationStyles.buttonDisabled : {}),
        }}
        onClick={runInspection}
        disabled={!fileId || isInspecting}
        onMouseEnter={(e) => {
          if (fileId && !isInspecting) {
            e.currentTarget.style.backgroundColor = validationStyles.buttonHover.backgroundColor;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = validationStyles.button.backgroundColor;
        }}
      >
        {isInspecting ? '🔄 检测中...' : '🔍 开始检测'}
      </button>

      {/* Error Message */}
      {error && (
        <div style={{
          ...validationStyles.summaryCard,
          borderLeftColor: '#ff6b6b',
          borderLeftWidth: '3px',
        }}>
          <div style={{ fontSize: '12px', color: '#ff6b6b' }}>{error}</div>
        </div>
      )}

      {/* Inspection Results */}
      {inspectionResult && (
        <>
          {/* Summary */}
          <div style={validationStyles.summaryCard}>
            <div style={validationStyles.summaryTitle}>📊 检测摘要</div>
            <div style={validationStyles.summaryStats}>
              <div style={validationStyles.statItem}>
                <div style={{ ...validationStyles.statValue, color: LEVEL_COLORS[InspectionLevel.ERROR] }}>
                  {inspectionResult.summary.error}
                </div>
                <div style={validationStyles.statLabel}>严重</div>
              </div>
              <div style={validationStyles.statItem}>
                <div style={{ ...validationStyles.statValue, color: LEVEL_COLORS[InspectionLevel.WARNING] }}>
                  {inspectionResult.summary.warning}
                </div>
                <div style={validationStyles.statLabel}>警告</div>
              </div>
              <div style={validationStyles.statItem}>
                <div style={{ ...validationStyles.statValue, color: LEVEL_COLORS[InspectionLevel.INFO] }}>
                  {inspectionResult.summary.info}
                </div>
                <div style={validationStyles.statLabel}>信息</div>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          {inspectionResult.issues.length > 0 && (
            <div style={validationStyles.filterContainer}>
              <button
                style={{
                  ...validationStyles.filterButton,
                  ...(filterLevel === null ? validationStyles.filterButtonActive : {}),
                }}
                onClick={() => setFilterLevel(null)}
              >
                全部 ({inspectionResult.issues.length})
              </button>
              <button
                style={{
                  ...validationStyles.filterButton,
                  ...(filterLevel === InspectionLevel.ERROR ? validationStyles.filterButtonActive : {}),
                }}
                onClick={() => setFilterLevel(InspectionLevel.ERROR)}
              >
                严重 ({inspectionResult.summary.error})
              </button>
              <button
                style={{
                  ...validationStyles.filterButton,
                  ...(filterLevel === InspectionLevel.WARNING ? validationStyles.filterButtonActive : {}),
                }}
                onClick={() => setFilterLevel(InspectionLevel.WARNING)}
              >
                警告 ({inspectionResult.summary.warning})
              </button>
              <button
                style={{
                  ...validationStyles.filterButton,
                  ...(filterLevel === InspectionLevel.INFO ? validationStyles.filterButtonActive : {}),
                }}
                onClick={() => setFilterLevel(InspectionLevel.INFO)}
              >
                信息 ({inspectionResult.summary.info})
              </button>
            </div>
          )}

          {/* Issue List */}
          <div style={validationStyles.issueList}>
            {filteredIssues.length === 0 ? (
              <div style={validationStyles.emptyState}>
                {filterLevel ? '没有符合该级别的问题' : '✅ 未发现任何问题'}
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    ...validationStyles.issueCard,
                    borderLeftColor: LEVEL_COLORS[issue.level],
                    ...(issue.id === selectedIssueId ? { backgroundColor: '#3a3a3a' } : {}),
                  }}
                  onClick={() => handleIssueClick(issue)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = validationStyles.issueCardHover.backgroundColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = issue.id === selectedIssueId ? '#3a3a3a' : '#2a2a2a';
                  }}
                >
                  <div style={validationStyles.issueType}>
                    {ISSUE_TYPE_LABELS[issue.type] || issue.type}
                  </div>
                  <div style={validationStyles.issueMessage}>{issue.message}</div>
                  {issue.data && (
                    <div style={validationStyles.issueMeta}>
                      {issue.data.gapDistance !== undefined && `缺口: ${issue.data.gapDistance.toFixed(3)}mm`}
                      {issue.data.tolerance !== undefined && ` 容差: ${issue.data.tolerance.toFixed(3)}mm`}
                      {issue.data.overlapCount !== undefined && ` 交点: ${issue.data.overlapCount}`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Recommendations */}
          {inspectionResult.recommendations && inspectionResult.recommendations.length > 0 && (
            <div style={validationStyles.summaryCard}>
              <div style={{ ...validationStyles.summaryTitle, marginBottom: '8px' }}>💡 修复建议</div>
              {inspectionResult.recommendations.map((rec, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  <span>• {rec}</span>
                  <button
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#4a9eff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // Map recommendation text to tool ID
                      if (rec.includes('重复')) onQuickFix?.('remove-duplicates');
                      else if (rec.includes('相连')) onQuickFix?.('merge-connected');
                      else if (rec.includes('轮廓')) onQuickFix?.('close-contours');
                    }}
                  >
                    立即修复
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!inspectionResult && !isInspecting && !error && (
        <div style={validationStyles.emptyState}>
          点击"开始检测"按钮检查图纸质量问题
        </div>
      )}
    </div>
  );
};

export default ValidationSection;
