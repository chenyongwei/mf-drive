import React, { useState, useEffect } from 'react';
import {
  updateGCodeConfig,
  deleteGCodeConfig,
  duplicateGCodeConfig,
} from '../services/api';
import { GCodeConfig } from '@dxf-fix/shared';
import { GCodeConfigEditor } from './GCodeConfigEditor';
import { loadGCodeConfigListsIntoState } from './GCodeConfigEditor/configData';
import { GCODE_CONFIG_MANAGER_STYLES } from './GCodeConfigManager.styles';
import {
  ConfigItemCard,
  PresetDeviceSection,
  SelectedConfigDetails,
} from './GCodeConfigManager.sections';
import { groupPresetsByDeviceType } from './GCodeConfigManager.utils';

interface GCodeConfigManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConfig?: (config: GCodeConfig) => void;
}

export const GCodeConfigManager: React.FC<GCodeConfigManagerProps> = ({
  isOpen,
  onClose,
  onSelectConfig,
}) => {
  const [presets, setPresets] = useState<GCodeConfig[]>([]);
  const [userConfigs, setUserConfigs] = useState<GCodeConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<GCodeConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<GCodeConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'user'>('presets');

  useEffect(() => {
    if (!isOpen) return;
    void loadGCodeConfigListsIntoState(setPresets, setUserConfigs);
  }, [isOpen]);

  const handleEditPreset = async (preset: GCodeConfig) => {
    try {
      const newConfig = await duplicateGCodeConfig(preset.id, `${preset.name} (副本)`);
      setUserConfigs((prev) => [...prev, newConfig]);
      setSelectedConfig(newConfig);
      setEditingConfig(newConfig);
    } catch (error) {
      console.error('Failed to duplicate preset:', error);
      alert(`复制失败：${(error as Error).message}`);
    }
  };

  const handleDeleteUserConfig = async (configId: string) => {
    if (!confirm('确定要删除这个配置吗？')) {
      return;
    }

    try {
      await deleteGCodeConfig(configId);
      setUserConfigs((prev) => prev.filter((c) => c.id !== configId));
      if (selectedConfig?.id === configId) {
        setSelectedConfig(null);
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
      alert(`删除失败：${(error as Error).message}`);
    }
  };

  const handleCreateNew = () => {
    if (presets.length === 0) return;

    const preset = presets[0];
    const newConfig: GCodeConfig = {
      ...preset,
      id: `config-${Date.now()}`,
      name: '新配置',
      isPreset: false,
    };
    setEditingConfig(newConfig);
  };

  const handleSaveEditor = async (config: GCodeConfig) => {
    try {
      if (config.isPreset) {
        alert('预设配置不能直接修改，请先复制为自定义配置');
        return;
      }

      const updated = await updateGCodeConfig(config.id, config);
      setUserConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingConfig(null);
      setSelectedConfig(updated);
      onSelectConfig?.(updated);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert(`保存失败：${(error as Error).message}`);
    }
  };

  if (!isOpen) {
    return null;
  }

  if (editingConfig) {
    return (
      <GCodeConfigEditor
        isOpen={!!editingConfig}
        initialConfig={editingConfig}
        onClose={() => setEditingConfig(null)}
        onSave={handleSaveEditor}
      />
    );
  }

  return (
    <>
      <style>{GCODE_CONFIG_MANAGER_STYLES}</style>
      <div className="gcode-config-manager-overlay">
        <div className="gcode-config-manager-modal">
          <div className="gcode-config-manager-header">
            <h2>G代码配置管理</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="gcode-config-manager-content">
            <div className="config-list">
              <div className="config-sidebar">
                <div className="tab-buttons">
                  <button
                    className={`tab-button ${activeTab === 'presets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('presets')}
                  >
                    预设配置
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'user' ? 'active' : ''}`}
                    onClick={() => setActiveTab('user')}
                  >
                    我的配置
                  </button>
                </div>

                {activeTab === 'presets' && (
                  <div className="presets-container">
                    {groupPresetsByDeviceType(presets).map(([deviceType, presetsOfType]) => (
                      <PresetDeviceSection
                        key={deviceType}
                        deviceType={deviceType}
                        presets={presetsOfType}
                        selectedConfigId={selectedConfig?.id}
                        onSelect={setSelectedConfig}
                        onDuplicate={handleEditPreset}
                      />
                    ))}
                  </div>
                )}

                {activeTab === 'user' && (
                  <div className="user-configs-container">
                    {userConfigs.length === 0 ? (
                      <div className="empty-state">
                        暂无自定义配置
                        <br />
                        <button className="new-button" onClick={handleCreateNew}>
                          + 新建配置
                        </button>
                      </div>
                    ) : (
                      <>
                        {userConfigs.map((config) => (
                          <ConfigItemCard
                            key={config.id}
                            config={config}
                            selected={selectedConfig?.id === config.id}
                            description={`${config.deviceType} | ${config.controlSystem}`}
                            onSelect={() => setSelectedConfig(config)}
                            actions={[
                              {
                                title: '编辑',
                                icon: '✏️',
                                onClick: (event) => {
                                  event.stopPropagation();
                                  setSelectedConfig(config);
                                  setEditingConfig(config);
                                },
                              },
                              {
                                title: '删除',
                                icon: '🗑️',
                                onClick: (event) => {
                                  event.stopPropagation();
                                  handleDeleteUserConfig(config.id);
                                },
                              },
                            ]}
                          />
                        ))}
                        <button className="new-button" onClick={handleCreateNew}>
                          + 新建配置
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {selectedConfig && (
                <SelectedConfigDetails
                  config={selectedConfig}
                  onDuplicatePreset={handleEditPreset}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
