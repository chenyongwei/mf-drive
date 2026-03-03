import React from 'react';
import { GCodeConfig } from '@dxf-fix/shared';
import { MicroJointVisualPreview } from '../../MicroJointVisualPreview';

interface MicroJointSectionProps {
  config: GCodeConfig;
  onMicroJointChange: (field: string, value: any) => void;
}

/**
 * MicroJointSection - Component for micro-joint configuration
 */
export const MicroJointSection: React.FC<MicroJointSectionProps> = ({
  config,
  onMicroJointChange,
}) => {
  return (
    <div className="section-content">
      <div className="form-row">
        <label>
          <input
            type="checkbox"
            checked={config.microJoint.enabled}
            onChange={(e) => onMicroJointChange('enabled', e.target.checked)}
          />
          启用微连
        </label>
        <label>
          类型:
          <select
            value={config.microJoint.type}
            onChange={(e) => onMicroJointChange('type', e.target.value)}
          >
            <option value="NONE">无微连</option>
            <option value="POINT">点式微连</option>
            <option value="OVERCUT">过切微连</option>
            <option value="TAB">留白微连</option>
          </select>
        </label>
        <label>
          宽度:
          <input
            type="number"
            step="0.1"
            value={config.microJoint.width}
            onChange={(e) => onMicroJointChange('width', parseFloat(e.target.value))}
          />
          mm
        </label>
      </div>
      <div className="form-row">
        <label>
          深度:
          <input
            type="number"
            step="0.1"
            value={config.microJoint.depth}
            onChange={(e) => onMicroJointChange('depth', parseFloat(e.target.value))}
          />
          mm
        </label>
        <label>
          微连数量:
          <input
            type="number"
            value={config.microJoint.count}
            onChange={(e) => onMicroJointChange('count', parseInt(e.target.value))}
          />
        </label>
        <label>
          分布方式:
          <select
            value={config.microJoint.distribution}
            onChange={(e) => onMicroJointChange('distribution', e.target.value)}
          >
            <option value="EVEN">均匀分布</option>
            <option value="MANUAL">手动分布</option>
          </select>
        </label>
      </div>
      {config.microJoint.enabled && (
        <MicroJointVisualPreview
          config={config.microJoint}
          contourLength={100}
          onPositionChange={(positions) => onMicroJointChange('positions', positions)}
        />
      )}
    </div>
  );
};
