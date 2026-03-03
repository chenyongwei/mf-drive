import React from 'react';
import { GCodeConfig, GCodeDeviceType } from '@dxf-fix/shared';
import { getDeviceTypeName, getIconByDeviceType } from './GCodeConfigManager.utils';

interface ConfigAction {
  title: string;
  icon: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface ConfigItemCardProps {
  config: GCodeConfig;
  selected: boolean;
  description: string;
  actions?: ConfigAction[];
  onSelect: () => void;
}

export const ConfigItemCard: React.FC<ConfigItemCardProps> = ({
  config,
  selected,
  description,
  actions = [],
  onSelect,
}) => (
  <div
    className={`config-item ${selected ? 'selected' : ''}`}
    onClick={onSelect}
  >
    <div className="config-icon">{getIconByDeviceType(config.deviceType)}</div>
    <div className="config-info">
      <div className="config-name">{config.name}</div>
      <div className="config-description">{description}</div>
    </div>
    {actions.length > 0 && (
      <div className="config-actions">
        {actions.map((action) => (
          <button
            key={action.title}
            className="action-button"
            onClick={action.onClick}
            title={action.title}
          >
            {action.icon}
          </button>
        ))}
      </div>
    )}
  </div>
);

interface PresetDeviceSectionProps {
  deviceType: string;
  presets: GCodeConfig[];
  selectedConfigId?: string;
  onSelect: (preset: GCodeConfig) => void;
  onDuplicate: (preset: GCodeConfig) => void;
}

export const PresetDeviceSection: React.FC<PresetDeviceSectionProps> = ({
  deviceType,
  presets,
  selectedConfigId,
  onSelect,
  onDuplicate,
}) => (
  <div className="device-section">
    <div className="section-title">
      {getIconByDeviceType(deviceType as GCodeDeviceType)}{' '}
      {getDeviceTypeName(deviceType as GCodeDeviceType)}
    </div>
    {presets.map((preset) => (
      <ConfigItemCard
        key={preset.id}
        config={preset}
        selected={selectedConfigId === preset.id}
        description={preset.description}
        onSelect={() => onSelect(preset)}
        actions={[
          {
            title: '复制为自定义配置',
            icon: '📋',
            onClick: (event) => {
              event.stopPropagation();
              onDuplicate(preset);
            },
          },
        ]}
      />
    ))}
  </div>
);

interface SelectedConfigDetailsProps {
  config: GCodeConfig;
  onDuplicatePreset: (config: GCodeConfig) => void;
}

export const SelectedConfigDetails: React.FC<SelectedConfigDetailsProps> = ({
  config,
  onDuplicatePreset,
}) => (
  <div className="config-sidebar">
    <div className="section-title">配置详情</div>
    <ConfigItemCard
      config={config}
      selected={true}
      description={config.isPreset ? '预设配置' : '自定义配置'}
      onSelect={() => {}}
    />
    <div className="config-description">设备: {getDeviceTypeName(config.deviceType)}</div>
    <div className="config-description">控制系统: {config.controlSystem}</div>
    <div className="config-description">进给率: {config.feedRate} mm/min</div>
    <div className="config-description">快速移动: {config.rapidRate} mm/min</div>
    {config.isPreset && (
      <button className="new-button" onClick={() => onDuplicatePreset(config)}>
        📋 复制为自定义配置
      </button>
    )}
  </div>
);
