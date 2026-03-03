import { useState, useCallback, useEffect } from 'react';
import { GCodeConfig } from '@dxf-fix/shared';
import {
  updateGCodeConfig,
  duplicateGCodeConfig,
} from '../../services/api';
import { loadGCodeConfigListsIntoState } from '../configData';

export const useGCodeConfigEditor = (isOpen: boolean, initialConfig?: GCodeConfig) => {
  const [presets, setPresets] = useState<GCodeConfig[]>([]);
  const [userConfigs, setUserConfigs] = useState<GCodeConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<GCodeConfig | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  useEffect(() => {
    if (isOpen) {
      loadConfigs();
      if (initialConfig) {
        setSelectedConfig({ ...initialConfig });
      } else if (presets.length > 0) {
        setSelectedConfig({ ...presets[0] });
      }
    }
  }, [isOpen, initialConfig]);

  const loadConfigs = useCallback(async () => {
    await loadGCodeConfigListsIntoState(setPresets, setUserConfigs);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const handleSave = useCallback(
    async (onSave?: (config: GCodeConfig) => void, onClose?: () => void) => {
      if (!selectedConfig) return;

      try {
        if (selectedConfig.isPreset) {
          // 复制预设为新配置
          const newConfig = await duplicateGCodeConfig(
            selectedConfig.id,
            selectedConfig.name + ' (副本)'
          );
          setSelectedConfig(newConfig);
          setUserConfigs((prev) => [...prev, newConfig]);
        } else {
          // 更新现有配置
          const updated = await updateGCodeConfig(selectedConfig.id, selectedConfig);
          setSelectedConfig(updated);
          setUserConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }

        onSave?.(selectedConfig);
        onClose?.();
      } catch (error) {
        console.error('Failed to save config:', error);
      }
    },
    [selectedConfig]
  );

  const handleSelectPreset = useCallback((preset: GCodeConfig) => {
    setSelectedConfig({ ...preset });
  }, []);

  const handleConfigChange = useCallback(
    (field: keyof GCodeConfig, value: any) => {
      if (!selectedConfig) return;

      setSelectedConfig({
        ...selectedConfig,
        [field]: value,
        id: selectedConfig.isPreset ? selectedConfig.id : selectedConfig.id,
      });
    },
    [selectedConfig]
  );

  const handleLeadChange = useCallback(
    (leadType: 'leadIn' | 'leadOut', field: keyof GCodeConfig['leadIn'], value: any) => {
      if (!selectedConfig) return;

      setSelectedConfig({
        ...selectedConfig,
        [leadType]: {
          ...selectedConfig[leadType],
          [field]: value,
        },
      });
    },
    [selectedConfig]
  );

  const handleMicroJointChange = useCallback(
    (field: keyof GCodeConfig['microJoint'], value: any) => {
      if (!selectedConfig) return;

      setSelectedConfig({
        ...selectedConfig,
        microJoint: {
          ...selectedConfig.microJoint,
          [field]: value,
        },
      });
    },
    [selectedConfig]
  );

  return {
    presets,
    userConfigs,
    selectedConfig,
    expandedSections,
    toggleSection,
    handleSave,
    handleSelectPreset,
    handleConfigChange,
    handleLeadChange,
    handleMicroJointChange,
  };
};
