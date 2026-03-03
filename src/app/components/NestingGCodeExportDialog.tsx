import React, { useState } from 'react';
import { exportNestingGCode } from '../services/api';
import { NESTING_GCODE_EXPORT_STYLES } from './NestingGCodeExportDialog.styles';
import type { NestingGCodeExportDialogProps } from './NestingGCodeExportDialog.types';

const NestingGCodeExportDialog: React.FC<NestingGCodeExportDialogProps> = ({
  isOpen,
  onClose,
  layout,
  gcodeConfigs,
}) => {
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen || !layout) return null;

  const handleExport = async () => {
    if (!selectedConfigId) {
      alert('请选择G代码配置');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => Math.min(prev + 20, 90));
      }, 500);

      const result = await exportNestingGCode({
        layoutId: layout.id,
        configId: selectedConfigId,
        fileName: fileName || `nesting_${layout.id}.gcode`,
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      // Trigger download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 1000);
    } catch (error) {
      setIsExporting(false);
      setExportProgress(0);
      alert('导出失败：' + (error as Error).message);
    }
  };

  const selectedConfig = gcodeConfigs.find((c) => c.id === selectedConfigId);

  return (
    <>
      <style>{NESTING_GCODE_EXPORT_STYLES}</style>
      <div className="nesting-export-overlay">
        <div className="nesting-export-dialog">
          {/* Header */}
          <div className="export-header">
            <h2>导出排样G代码</h2>
          </div>

          {/* Content */}
          <div className="export-content">
            {/* Export Summary */}
            <div className="export-summary">
              <div className="export-summary-title">排样摘要</div>
              <div className="export-summary-stats">
                <div className="export-stat">
                  <div className="export-stat-value">{layout.parts.length}</div>
                  <div className="export-stat-label">零件数</div>
                </div>
                <div className="export-stat">
                  <div className="export-stat-value">{(layout.utilization * 100).toFixed(1)}%</div>
                  <div className="export-stat-label">利用率</div>
                </div>
                <div className="export-stat">
                  <div className="export-stat-value">{layout.scrapLines?.length || 0}</div>
                  <div className="export-stat-label">余料线</div>
                </div>
              </div>
            </div>

            {/* Progress */}
            {isExporting && (
              <div className="progress-section">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exportProgress}%` }} />
                </div>
                <div className="progress-text">
                  正在生成G代码... {exportProgress}%
                </div>
              </div>
            )}

            {/* Config Selection */}
            <div className="form-group">
              <label>G代码配置</label>
              <select
                value={selectedConfigId}
                onChange={(e) => setSelectedConfigId(e.target.value)}
                disabled={isExporting}
              >
                <option value="">请选择配置</option>
                {gcodeConfigs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name} ({config.deviceType})
                  </option>
                ))}
              </select>

              {selectedConfig && (
                <div className="config-preview">
                  <div className="config-preview-title">{selectedConfig.name}</div>
                  <div className="config-preview-grid">
                    <div className="config-item">
                      设备: <span>{selectedConfig.deviceType}</span>
                    </div>
                    <div className="config-item">
                      控制系统: <span>{selectedConfig.controlSystem}</span>
                    </div>
                    <div className="config-item">
                      进给速度: <span>{selectedConfig.feedRate}</span>
                    </div>
                    <div className="config-item">
                      快移速度: <span>{selectedConfig.rapidRate}</span>
                    </div>
                    <div className="config-item">
                      单位: <span>{selectedConfig.unit}</span>
                    </div>
                    <div className="config-item">
                      起刀线: <span>{selectedConfig.leadIn.type}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* File Name */}
            <div className="form-group">
              <label>文件名</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={`nesting_${layout.id}.gcode`}
                disabled={isExporting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="export-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isExporting}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={!selectedConfigId || isExporting}
            >
              {isExporting ? '导出中...' : '导出G代码'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NestingGCodeExportDialog;
