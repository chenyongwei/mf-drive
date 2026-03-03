import React from 'react';
import type { GCodeConfig, GCodeDeviceType } from '@dxf-fix/shared';
import { LeadVisualPreview } from './LeadVisualPreview';
import { CONTROL_SYSTEM_OPTIONS } from './GCodeConfigEditor/controlSystemOptions';
import { LeadConfig } from './GCodeConfigEditor/components/LeadConfig';

function getDeviceTypeName(type: GCodeDeviceType): string {
  const names: Record<GCodeDeviceType, string> = {
    LASER: '激光',
    FLAME: '火焰',
    PLASMA: '等离子',
  };
  return names[type] || type;
}

interface PrimarySectionsProps {
  selectedConfig: GCodeConfig;
  presets: GCodeConfig[];
  userConfigs: GCodeConfig[];
  expandedSections: Set<string>;
  setSelectedConfig: (config: GCodeConfig) => void;
  onDeleteCurrent: () => void;
  toggleSection: (section: string) => void;
  handleConfigChange: (field: keyof GCodeConfig, value: unknown) => void;
  handleLeadChange: (
    leadType: 'leadIn' | 'leadOut',
    field: keyof GCodeConfig['leadIn'] | 'type' | 'length' | 'angle' | 'arcRadius' | 'spiralTurns',
    value: unknown,
  ) => void;
}

export const GCodeConfigPrimarySections: React.FC<PrimarySectionsProps> = ({
  selectedConfig,
  presets,
  userConfigs,
  expandedSections,
  setSelectedConfig,
  onDeleteCurrent,
  toggleSection,
  handleConfigChange,
  handleLeadChange,
}) => (
  <>
    <section className="config-section">
      <h3>配置选择</h3>
      <select
        value={selectedConfig.id}
        onChange={(event) => {
          const config = [...presets, ...userConfigs].find((item) => item.id === event.target.value);
          if (config) {
            setSelectedConfig({ ...config });
          }
        }}
      >
        <optgroup label="预设模板">
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              [{getDeviceTypeName(preset.deviceType)}] {preset.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="用户配置">
          {userConfigs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.name}
            </option>
          ))}
        </optgroup>
      </select>
      {!selectedConfig.isPreset && <button onClick={onDeleteCurrent}>删除</button>}
    </section>

    <section className={`config-section ${expandedSections.has('basic') ? 'expanded' : ''}`}>
      <div className="section-header" onClick={() => toggleSection('basic')}>
        <h3>基础参数</h3>
        <span className="toggle-icon">{expandedSections.has('basic') ? '▲' : '▼'}</span>
      </div>
      {expandedSections.has('basic') && (
        <div className="section-content">
          <div className="form-row">
            <label>
              设备类型:
              <select value={selectedConfig.deviceType} onChange={(event) => handleConfigChange('deviceType', event.target.value)}>
                <option value="LASER">激光切割</option>
                <option value="FLAME">火焰切割</option>
                <option value="PLASMA">等离子切割</option>
              </select>
            </label>
            <label>
              控制系统:
              <select value={selectedConfig.controlSystem} onChange={(event) => handleConfigChange('controlSystem', event.target.value)}>
                {CONTROL_SYSTEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              单位:
              <select value={selectedConfig.unit} onChange={(event) => handleConfigChange('unit', event.target.value)}>
                <option value="mm">mm</option>
                <option value="inch">inch</option>
              </select>
            </label>
            <label>
              切割速度:
              <input type="number" value={selectedConfig.feedRate} onChange={(event) => handleConfigChange('feedRate', parseFloat(event.target.value))} />
              mm/min
            </label>
            <label>
              快移速度:
              <input type="number" value={selectedConfig.rapidRate} onChange={(event) => handleConfigChange('rapidRate', parseFloat(event.target.value))} />
              mm/min
            </label>
          </div>
          <div className="form-row">
            <label>
              运动指令:
              <span>{selectedConfig.moveCommand}/{selectedConfig.linearCommand}</span>
              {selectedConfig.arcCW}/{selectedConfig.arcCCW}
            </label>
            <label>
              圆弧分段角度:
              <input type="number" value={selectedConfig.arcSegmentAngle} onChange={(event) => handleConfigChange('arcSegmentAngle', parseFloat(event.target.value))} />
              °
            </label>
            <label>
              <input type="checkbox" checked={selectedConfig.useIJK} onChange={(event) => handleConfigChange('useIJK', event.target.checked)} />
              使用IJK参数
            </label>
          </div>
        </div>
      )}
    </section>

    <section className={`config-section ${expandedSections.has('lead') ? 'expanded' : ''}`}>
      <div className="section-header" onClick={() => toggleSection('lead')}>
        <h3>引线配置</h3>
        <span className="toggle-icon">{expandedSections.has('lead') ? '▲' : '▼'}</span>
      </div>
      {expandedSections.has('lead') && (
        <div className="section-content">
          <LeadConfig leadConfig={selectedConfig.leadIn} label="引入引线" onChange={(field, value) => handleLeadChange('leadIn', field, value)} />
          <LeadConfig leadConfig={selectedConfig.leadOut} label="引出引线" onChange={(field, value) => handleLeadChange('leadOut', field, value)} />
          <LeadVisualPreview
            leadIn={selectedConfig.leadIn}
            leadOut={selectedConfig.leadOut}
            contourDirection="CW"
            onTypeChange={(lead, type) => handleLeadChange(lead === 'in' ? 'leadIn' : 'leadOut', 'type', type)}
          />
        </div>
      )}
    </section>
  </>
);
