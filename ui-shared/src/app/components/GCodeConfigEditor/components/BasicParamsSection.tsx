import React from 'react';
import { GCodeConfig } from '@dxf-fix/shared';
import { CONTROL_SYSTEM_OPTIONS } from '../controlSystemOptions';

interface BasicParamsSectionProps {
  config: GCodeConfig;
  onChange: (field: keyof GCodeConfig, value: any) => void;
}

/**
 * BasicParamsSection - Component for basic G-code parameters
 */
export const BasicParamsSection: React.FC<BasicParamsSectionProps> = ({ config, onChange }) => {
  return (
    <div className="section-content">
      <div className="form-row">
        <label>
          设备类型:
          <select value={config.deviceType} onChange={(e) => onChange('deviceType', e.target.value)}>
            <option value="LASER">激光切割</option>
            <option value="FLAME">火焰切割</option>
            <option value="PLASMA">等离子切割</option>
          </select>
        </label>
        <label>
          控制系统:
          <select
            value={config.controlSystem}
            onChange={(e) => onChange('controlSystem', e.target.value)}
          >
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
          <select value={config.unit} onChange={(e) => onChange('unit', e.target.value)}>
            <option value="mm">mm</option>
            <option value="inch">inch</option>
          </select>
        </label>
        <label>
          切割速度:
          <input
            type="number"
            value={config.feedRate}
            onChange={(e) => onChange('feedRate', parseFloat(e.target.value))}
          />
          mm/min
        </label>
        <label>
          快移速度:
          <input
            type="number"
            value={config.rapidRate}
            onChange={(e) => onChange('rapidRate', parseFloat(e.target.value))}
          />
          mm/min
        </label>
      </div>
      <div className="form-row">
        <label>
          运动指令:
          <span>
            {config.moveCommand}/{config.linearCommand}
          </span>
          {config.arcCW}/{config.arcCCW}
        </label>
        <label>
          圆弧分段角度:
          <input
            type="number"
            value={config.arcSegmentAngle}
            onChange={(e) => onChange('arcSegmentAngle', parseFloat(e.target.value))}
          />
          °
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.useIJK}
            onChange={(e) => onChange('useIJK', e.target.checked)}
          />
          使用IJK参数
        </label>
      </div>
    </div>
  );
};
