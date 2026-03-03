import React from "react";
import { GCodeConfig, Part } from "@dxf-fix/shared";
import { GCodeSimulator } from "./GCodeSimulator";

interface ConfigSectionProps {
  configs: GCodeConfig[];
  selectedConfigId: string;
  selectedConfig?: GCodeConfig;
  onConfigChange: (configId: string) => void;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  configs,
  selectedConfigId,
  selectedConfig,
  onConfigChange,
}) => {
  return (
    <section className="dialog-section">
      <h3>选择配置</h3>
      <div className="config-selector">
        <select
          value={selectedConfigId}
          onChange={(e) => onConfigChange(e.target.value)}
          className="w-full"
        >
          <optgroup label="激光切割">
            {configs
              .filter((c) => c.deviceType === "LASER")
              .map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="火焰切割">
            {configs
              .filter((c) => c.deviceType === "FLAME")
              .map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="等离子切割">
            {configs
              .filter((c) => c.deviceType === "PLASMA")
              .map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      {selectedConfig && (
        <div className="config-info">
          <div className="info-row">
            <span className="info-label">设备类型:</span>
            <span className="info-value">{selectedConfig.deviceType}</span>
          </div>
          <div className="info-row">
            <span className="info-label">控制系统:</span>
            <span className="info-value">{selectedConfig.controlSystem}</span>
          </div>
          <div className="info-row">
            <span className="info-label">切割速度:</span>
            <span className="info-value">{selectedConfig.feedRate} mm/min</span>
          </div>
          <div className="info-row">
            <span className="info-label">引线:</span>
            <span className="info-value">
              {selectedConfig.leadIn.enabled
                ? `${selectedConfig.leadIn.type} (${selectedConfig.leadIn.length}mm)`
                : "无"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">微连:</span>
            <span className="info-value">
              {selectedConfig.microJoint.enabled
                ? `${selectedConfig.microJoint.type} x${selectedConfig.microJoint.count}`
                : "无"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

interface PartsSectionProps {
  loadingParts: boolean;
  availableParts: Part[];
  selectedParts: string[];
  onToggleAll: (checked: boolean) => void;
  onTogglePart: (partId: string, checked: boolean) => void;
}

export const PartsSection: React.FC<PartsSectionProps> = ({
  loadingParts,
  availableParts,
  selectedParts,
  onToggleAll,
  onTogglePart,
}) => {
  return (
    <section className="dialog-section">
      <h3>选择零件</h3>
      <div className="part-selector">
        {loadingParts ? (
          <div className="loading">加载零件中...</div>
        ) : availableParts.length > 0 ? (
          <div className="part-list">
            <label className="part-item">
              <input
                type="checkbox"
                checked={selectedParts.length === availableParts.length}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
              <span>全选/取消全选</span>
            </label>
            <div className="selected-info">
              已选择 {selectedParts.length} / {availableParts.length} 个零件
            </div>
            <div className="info-text">
              <small>只显示切割(CUT)和打标(MARK)类型的零件</small>
            </div>
            <div className="part-items">
              {availableParts.map((part) => (
                <label key={part.id} className="part-item">
                  <input
                    type="checkbox"
                    checked={selectedParts.includes(part.id)}
                    onChange={(e) => onTogglePart(part.id, e.target.checked)}
                  />
                  <span>
                    {part.name}
                    <span className="process-type-badge">
                      {part.processType === "CUT" ? "切割" : "打标"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-parts">
            请先打开一个包含零件的文件，或设置图层为切割/打标类型
          </div>
        )}
      </div>
    </section>
  );
};

interface PreviewSectionProps {
  gcodePreview: string;
  showSimulator: boolean;
  onToggleSimulator: () => void;
  onClear: () => void;
  onCloseSimulator: () => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  gcodePreview,
  showSimulator,
  onToggleSimulator,
  onClear,
  onCloseSimulator,
}) => {
  if (!gcodePreview) {
    return null;
  }

  return (
    <section className="dialog-section">
      <div className="section-header">
        <h3>G代码预览</h3>
        <div className="section-header-buttons">
          <button
            className={`btn-toggle ${showSimulator ? "active" : ""}`}
            onClick={onToggleSimulator}
          >
            {showSimulator ? "隐藏模拟" : "显示模拟"}
          </button>
          <button onClick={onClear}>清除</button>
        </div>
      </div>

      {showSimulator ? (
        <GCodeSimulator gcode={gcodePreview} onClose={onCloseSimulator} />
      ) : (
        <div className="gcode-preview">
          <pre>{gcodePreview}</pre>
        </div>
      )}
    </section>
  );
};
