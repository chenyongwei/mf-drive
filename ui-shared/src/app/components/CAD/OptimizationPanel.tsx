import React, { useState, useCallback } from 'react';
import OptimizationPreview from './OptimizationPreview';
import {
  OPTIMIZATION_TOOL_META,
  optimizationStyles,
  type OptimizationPreviewData,
  type OptimizationTool,
} from './OptimizationPanel.config';

interface OptimizationPanelProps {
  fileId: string | null;
  selectedEntityIds?: string[];
  selectedEntities?: any[];
  onOptimizationApplied?: (result: any, modifiedFileIds?: string[]) => void;
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  fileId,
  selectedEntityIds = [],
  selectedEntities = [],
  onOptimizationApplied,
}) => {
  const [tolerance, setTolerance] = useState('0.5');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [previewData, setPreviewData] = useState<OptimizationPreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<OptimizationTool | null>(null);

  const runPreview = useCallback(async (tool: OptimizationTool) => {
    if (!fileId) {
      setPreviewError('请先选择一个文件');
      return;
    }

    if (tool === 'explode') {
      if (selectedEntityIds.length === 0) {
        setPreviewError('请先选择要炸开的多段线实体');
        return;
      }

      setIsApplying(true);
      setPreviewError(null);
      setActiveTool(tool);

      try {
        const entitiesByFile = new Map<string, string[]>();
        selectedEntities.forEach((entity) => {
          const entityFileId = entity.fileId;
          if (!entityFileId) {
            return;
          }
          if (!entitiesByFile.has(entityFileId)) {
            entitiesByFile.set(entityFileId, []);
          }
          entitiesByFile.get(entityFileId)!.push(entity.id);
        });

        if (entitiesByFile.size === 0) {
          setPreviewError('无法识别选中实体所属的文件');
          setIsApplying(false);
          return;
        }

        const allResults: any[] = [];
        for (const [entityFileId, entityIdsForFile] of entitiesByFile.entries()) {
          const results = await Promise.all(
            entityIdsForFile.map(async (entityId) => {
              const entity = selectedEntities.find(e => e.id === entityId);
              const entityIdentifier = entity?.handle || entityId;

              const response = await fetch(`/api/drawing/files/${entityFileId}/edit`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  command: 'explode',
                  params: {
                    entityId: entityIdentifier,
                  },
                }),
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              return response.json();
            })
          );

          allResults.push(...results);
        }

        const failed = allResults.filter((r) => !r.success);
        if (failed.length > 0) {
          throw new Error(failed.map((f) => f.message).join('; '));
        }

        if (onOptimizationApplied) {
          const modifiedFileIds = Array.from(entitiesByFile.keys());
          onOptimizationApplied({ results: allResults, tool: 'explode' }, modifiedFileIds);
        }

        setPreviewData({
          explode: selectedEntityIds.length,
          totalEntitiesAffected: allResults.reduce(
            (sum, r) => sum + (r.updatedEntities?.length || 0),
            0
          ),
        });
      } catch (err) {
        console.error('Explode failed:', err);
        setPreviewError(`炸开失败: ${err instanceof Error ? err.message : '未知错误'}`);
      } finally {
        setIsApplying(false);
        setTimeout(() => {
          setPreviewData(null);
          setActiveTool(null);
        }, 2000);
      }
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);
    setActiveTool(tool);

    try {
      const response = await fetch('/api/rules/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          rules: {
            tolerance: parseFloat(tolerance),
            [tool]: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      const preview: OptimizationPreviewData = {
        removeDuplicates: result.summary?.removedDuplicates || result.removedDuplicates || 0,
        mergeConnectedLines: result.summary?.mergedLines || result.mergedLines || 0,
        closeContours: result.summary?.closedContours || result.closedContours || 0,
        explode: result.summary?.exploded || result.exploded || 0,
      };

      setPreviewData(preview);
    } catch (err) {
      console.error('Preview failed:', err);
      setPreviewError(`预览失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsPreviewing(false);
    }
  }, [fileId, tolerance, selectedEntityIds, onOptimizationApplied]);

  const applyOptimization = useCallback(async () => {
    if (!activeTool || !fileId) {
      return;
    }

    setIsApplying(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/rules/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          rules: {
            tolerance: parseFloat(tolerance),
            [activeTool]: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (onOptimizationApplied) {
        onOptimizationApplied(result);
      }

      setPreviewData(null);
      setActiveTool(null);
    } catch (err) {
      console.error('Apply failed:', err);
      setPreviewError(`应用失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsApplying(false);
    }
  }, [activeTool, fileId, tolerance, onOptimizationApplied]);

  const cancelPreview = useCallback(() => {
    setPreviewData(null);
    setActiveTool(null);
    setPreviewError(null);
  }, []);

  return (
    <div style={optimizationStyles.container}>
      <div style={optimizationStyles.toleranceContainer}>
        <div style={optimizationStyles.toleranceLabel}>容差 (mm)</div>
        <input
          type="number"
          step="0.1"
          min="0.01"
          max="10"
          value={tolerance}
          onChange={(e) => setTolerance(e.target.value)}
          style={optimizationStyles.toleranceInput}
        />
        <div style={{ ...optimizationStyles.infoBox, marginTop: '8px' }}>
          <div style={optimizationStyles.infoTitle}>ℹ️ 容差说明</div>
          <div>
            用于判断线条是否重复/相连/闭合的距离阈值。
            值越大，优化越激进。
          </div>
        </div>
      </div>

      <div>
        <div style={optimizationStyles.title}>🔧 优化工具</div>
        <div style={optimizationStyles.toolGrid}>
          {(Object.keys(OPTIMIZATION_TOOL_META) as OptimizationTool[]).map((tool) => {
            const toolInfo = OPTIMIZATION_TOOL_META[tool];
            const isDisabled =
              !fileId ||
              isPreviewing ||
              isApplying ||
              (tool === 'explode' && selectedEntityIds.length === 0);

            return (
              <button
                key={tool}
                style={{
                  ...optimizationStyles.toolButton,
                  ...(isDisabled ? optimizationStyles.toolButtonDisabled : {}),
                }}
                onClick={() => runPreview(tool)}
                disabled={isDisabled}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.backgroundColor = optimizationStyles.toolButtonHover.backgroundColor;
                    e.currentTarget.style.borderColor = optimizationStyles.toolButtonHover.borderColor;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = optimizationStyles.toolButton.backgroundColor;
                  e.currentTarget.style.borderColor = optimizationStyles.toolButton.borderColor;
                }}
              >
                <div style={optimizationStyles.toolIcon}>{toolInfo.icon}</div>
                <div style={optimizationStyles.toolName}>{toolInfo.name}</div>
                <div style={optimizationStyles.toolDescription}>{toolInfo.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {(previewData || previewError || isPreviewing) && (
        <OptimizationPreview
          isLoading={isPreviewing}
          preview={previewData}
          error={previewError}
          onConfirm={applyOptimization}
          onCancel={cancelPreview}
        />
      )}

      <div style={optimizationStyles.infoBox}>
        <div style={optimizationStyles.infoTitle}>💡 使用提示</div>
        <div>• 删除重复/合并相连/闭合轮廓: 点击预览优化效果</div>
        <div>• 炸开: 先选中多段线实体，再点击炸开按钮</div>
        <div>• 预览后可点击"应用"执行优化</div>
        <div>• 所有操作支持撤销（Ctrl+Z）</div>
      </div>
    </div>
  );
};

export default OptimizationPanel;
