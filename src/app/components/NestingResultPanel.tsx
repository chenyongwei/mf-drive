import React, { useMemo } from 'react';
import type { Layout, PlacedPart } from '@dxf-fix/shared';
import {
  buildNestingResultPanelCss,
  getNestingResultPanelColors,
} from './NestingResultPanel.styles';

interface NestingResultPanelProps {
  layout: Layout | null;
  selectedPartId: string | null;
  onPartSelect?: (partId: string | null) => void;
  onAddScrapLine?: () => void;
  onDeleteScrapLine?: (lineId: string) => void;
  onExportGCode?: () => void;
  theme?: 'light' | 'dark';
}

const NestingResultPanel: React.FC<NestingResultPanelProps> = ({
  layout,
  selectedPartId,
  onPartSelect,
  onAddScrapLine,
  onDeleteScrapLine,
  onExportGCode,
  theme = 'light',
}) => {
  if (!layout) {
    return null;
  }

  const groupedParts = layout.parts.reduce((acc, part) => {
    const key = part.partName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(part);
    return acc;
  }, {} as Record<string, PlacedPart[]>);

  const colors = useMemo(() => getNestingResultPanelColors(theme), [theme]);
  const panelCss = useMemo(() => buildNestingResultPanelCss(colors, theme), [colors, theme]);

  return (
    <>
      <style>{panelCss}</style>
      <div className="nesting-result-panel">
        {/* Header */}
        <div className="nesting-result-header">
          <h3>排样结果</h3>
          <div className="utilization-badge">
            利用率: {(layout.utilization * 100).toFixed(1)}%
          </div>
        </div>

        {/* Content */}
        <div className="nesting-result-content">
          {/* Statistics */}
          <div className="result-section">
            <div className="result-section-title">统计信息</div>
            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-value">{layout.parts.length}</div>
                <div className="stat-label">零件数量</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{Object.keys(groupedParts).length}</div>
                <div className="stat-label">零件类型</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {layout.scrapLines?.length || 0}
                </div>
                <div className="stat-label">余料线</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {new Date(layout.createdAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="stat-label">生成时间</div>
              </div>
            </div>
          </div>

          {/* Parts List */}
          <div className="result-section">
            <div className="result-section-title">零件列表</div>
            {Object.entries(groupedParts).map(([partName, parts]) => (
              <div key={partName} className="part-group">
                <div className="part-group-title">
                  <span>{partName}</span>
                  <span className="part-group-count">{parts.length}</span>
                </div>
                <div className="part-list">
                  {parts.map((part, index) => (
                    <div
                      key={`${part.partId}_${index}`}
                      className={`part-item ${selectedPartId === part.partId ? 'selected' : ''}`}
                      onClick={() => onPartSelect?.(part.partId)}
                    >
                      <div className="part-item-info">
                        <div className="part-item-name">
                          {part.partName}-{index + 1}
                        </div>
                        <div className="part-item-position">
                          ({part.position.x.toFixed(0)}, {part.position.y.toFixed(0)})
                        </div>
                      </div>
                      <div className="part-item-position">
                        {part.rotation}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Scrap Lines */}
          <div className="result-section">
            <div className="result-section-title">余料线</div>
            {layout.scrapLines && layout.scrapLines.length > 0 ? (
              <div className="scrap-lines-list">
                {layout.scrapLines.map((line) => (
                  <div key={line.id} className="scrap-line-item">
                    <div>
                      <div className="scrap-line-type">{getScrapLineTypeName(line.type)}</div>
                      {line.area && (
                        <div className="scrap-line-area">
                          面积: {(line.area / 100).toFixed(1)} cm²
                        </div>
                      )}
                    </div>
                    <button
                      className="btn-icon"
                      onClick={() => onDeleteScrapLine?.(line.id)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: colors.textSecondary,
                  fontSize: '12px',
                  padding: '20px',
                }}
              >
                暂无余料线
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-action btn-secondary" onClick={onAddScrapLine}>
              + 添加余料线
            </button>
            <button className="btn-action btn-primary" onClick={onExportGCode}>
              导出G代码
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

function getScrapLineTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    LINE: '直线',
    TRIANGLE: '三角形',
    TRAPEZOID: '梯形',
    CIRCLE: '圆形',
    PART_OUTER: '零件轮廓',
  };
  return typeNames[type] || type;
}

export default NestingResultPanel;
