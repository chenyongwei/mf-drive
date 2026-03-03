import React from 'react';
import { LeadConfigProps } from '../types';

/**
 * LeadConfig - Component for configuring lead-in/lead-out settings
 */
export const LeadConfig: React.FC<LeadConfigProps> = ({ leadConfig, label, onChange }) => {
  return (
    <div className="lead-config">
      <div className="form-row">
        <label>
          <input
            type="checkbox"
            checked={leadConfig.enabled}
            onChange={(e) => onChange('enabled', e.target.checked)}
          />
          {label}
        </label>
        {leadConfig.enabled && (
          <>
            <label>
              类型:
              <select value={leadConfig.type} onChange={(e) => onChange('type', e.target.value)}>
                <option value="NONE">无引线</option>
                <option value="LINEAR">直线引线</option>
                <option value="TANGENT">切向引线</option>
                <option value="ARC">圆弧引线</option>
                <option value="SPIRAL">螺旋引线</option>
              </select>
            </label>
            <label>
              长度:
              <input
                type="number"
                step="0.1"
                value={leadConfig.length}
                onChange={(e) => onChange('length', parseFloat(e.target.value))}
              />
              mm
            </label>
            <label>
              角度:
              <input
                type="number"
                step="1"
                value={leadConfig.angle}
                onChange={(e) => onChange('angle', parseFloat(e.target.value))}
              />
              °
            </label>
            {(leadConfig.type === 'ARC' || leadConfig.type === 'SPIRAL') && (
              <label>
                半径:
                <input
                  type="number"
                  step="0.1"
                  value={leadConfig.arcRadius || 2}
                  onChange={(e) => onChange('arcRadius', parseFloat(e.target.value))}
                />
                mm
              </label>
            )}
            {leadConfig.type === 'SPIRAL' && (
              <label>
                圈数:
                <input
                  type="number"
                  step="0.1"
                  value={leadConfig.spiralTurns || 1.5}
                  onChange={(e) => onChange('spiralTurns', parseFloat(e.target.value))}
                />
              </label>
            )}
          </>
        )}
      </div>
    </div>
  );
};
