import React, { useCallback, useEffect, useState } from 'react';
import { GCodeConfig } from '@dxf-fix/shared';
import {
  getGCodePresets,
  getGCodeConfigs,
  updateGCodeConfig,
  deleteGCodeConfig,
  duplicateGCodeConfig,
} from '../services/api';
import { GCODE_CONFIG_EDITOR_STYLES } from './GCodeConfigEditor.styles';
import { GCodeConfigPrimarySections } from './GCodeConfigEditor.sections.primary';
import { GCodeConfigSecondarySections } from './GCodeConfigEditor.sections.secondary';

interface GCodeConfigEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: GCodeConfig) => void;
  initialConfig?: GCodeConfig;
}

export const GCodeConfigEditor: React.FC<GCodeConfigEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const [presets, setPresets] = useState<GCodeConfig[]>([]);
  const [userConfigs, setUserConfigs] = useState<GCodeConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<GCodeConfig | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const loadConfigs = useCallback(async () => {
    try {
      const [presetsData, configsData] = await Promise.all([getGCodePresets(), getGCodeConfigs()]);
      setPresets(presetsData);
      setUserConfigs(configsData);
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void loadConfigs();
    if (initialConfig) {
      setSelectedConfig({ ...initialConfig });
    }
  }, [initialConfig, isOpen, loadConfigs]);

  useEffect(() => {
    if (!isOpen || selectedConfig || initialConfig) {
      return;
    }
    if (presets.length > 0) {
      setSelectedConfig({ ...presets[0] });
    }
  }, [initialConfig, isOpen, presets, selectedConfig]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedConfig) return;

    try {
      if (selectedConfig.isPreset) {
        const newConfig = await duplicateGCodeConfig(selectedConfig.id, `${selectedConfig.name} (副本)`);
        setSelectedConfig(newConfig);
        setUserConfigs((prev) => [...prev, newConfig]);
      } else {
        const updated = await updateGCodeConfig(selectedConfig.id, selectedConfig);
        setSelectedConfig(updated);
        setUserConfigs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      }
      onSave?.(selectedConfig);
      onClose();
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleDeleteCurrent = useCallback(async () => {
    if (!selectedConfig || selectedConfig.isPreset) {
      return;
    }
    try {
      await deleteGCodeConfig(selectedConfig.id);
      await loadConfigs();
      setSelectedConfig((prev) => {
        if (!prev || prev.id !== selectedConfig.id) {
          return prev;
        }
        return null;
      });
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  }, [loadConfigs, selectedConfig]);

  const handleConfigChange = (field: keyof GCodeConfig, value: unknown) => {
    if (!selectedConfig) return;
    setSelectedConfig({ ...selectedConfig, [field]: value } as GCodeConfig);
  };

  const handleLeadChange = (
    leadType: 'leadIn' | 'leadOut',
    field: keyof GCodeConfig['leadIn'] | 'type' | 'length' | 'angle' | 'arcRadius' | 'spiralTurns',
    value: unknown,
  ) => {
    if (!selectedConfig) return;
    setSelectedConfig({
      ...selectedConfig,
      [leadType]: {
        ...selectedConfig[leadType],
        [field]: value,
      },
    });
  };

  const handleMicroJointChange = (field: keyof GCodeConfig['microJoint'], value: unknown) => {
    if (!selectedConfig) return;
    setSelectedConfig({
      ...selectedConfig,
      microJoint: {
        ...selectedConfig.microJoint,
        [field]: value,
      },
    });
  };

  if (!isOpen || !selectedConfig) return null;

  return (
    <>
      <style>{GCODE_CONFIG_EDITOR_STYLES}</style>
      <div className="gcode-config-editor-overlay">
        <div className="gcode-config-editor">
          <div className="gcode-config-header">
            <h2>G代码配置编辑器</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="gcode-config-body">
            <GCodeConfigPrimarySections
              selectedConfig={selectedConfig}
              presets={presets}
              userConfigs={userConfigs}
              expandedSections={expandedSections}
              setSelectedConfig={(config) => setSelectedConfig(config)}
              onDeleteCurrent={() => void handleDeleteCurrent()}
              toggleSection={toggleSection}
              handleConfigChange={handleConfigChange}
              handleLeadChange={handleLeadChange}
            />

            <GCodeConfigSecondarySections
              selectedConfig={selectedConfig}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              handleMicroJointChange={handleMicroJointChange}
              handleConfigChange={handleConfigChange}
            />
          </div>

          <div className="gcode-config-footer">
            <button className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button className="btn-secondary" onClick={() => void handleSave()}>
              另存为
            </button>
            <button className="btn-primary" onClick={() => void handleSave()}>
              保存
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
