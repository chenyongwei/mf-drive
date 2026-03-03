/**
 * Feature Flags Test Panel
 *
 * 用于测试和演示 Feature Flags 功能的控制面板
 */

import React, { useState } from 'react';
import { useFeatureFlags } from '../../../contexts/FeatureFlagContext';
import {
  FeaturePackage,
  DrawingFeature,
  PartFeature,
  NestingFeature,
  CommonFeature,
  UIElement
} from '@dxf-fix/shared';

const styles = {
  container: {
    padding: '12px',
    backgroundColor: '#2a2a2a',
    borderBottom: '1px solid #3a3a3a',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontSize: '12px',
    color: '#888',
    fontWeight: 'bold' as const,
  },
  button: {
    padding: '4px 8px',
    fontSize: '11px',
    backgroundColor: '#3a3a3a',
    border: '1px solid #4a4a4a',
    borderRadius: '3px',
    color: '#fff',
    cursor: 'pointer',
  },
  buttonActive: {
    backgroundColor: '#4a9eff',
    border: '1px solid #4a9eff',
  },
  select: {
    padding: '4px 8px',
    fontSize: '11px',
    backgroundColor: '#3a3a3a',
    border: '1px solid #4a4a4a',
    borderRadius: '3px',
    color: '#fff',
    cursor: 'pointer',
  },
};

interface FeatureToggle {
  package: FeaturePackage;
  feature: DrawingFeature | PartFeature | NestingFeature | CommonFeature;
  label: string;
}

export const FeatureFlagsTestPanel: React.FC = () => {
  const { isFeatureEnabled, toggleFeature, resetToDefaults, hasUserOverrides } = useFeatureFlags();
  const [debugMode, setDebugMode] = useState(false);

  // 定义要测试的功能开关
  const featureToggles: FeatureToggle[] = [
    { package: FeaturePackage.DRAWING, feature: DrawingFeature.EDIT, label: '编辑功能' },
    { package: FeaturePackage.DRAWING, feature: DrawingFeature.INSPECTION, label: '图形检查' },
    { package: FeaturePackage.DRAWING, feature: DrawingFeature.OPTIMIZATION, label: '图形优化' },
    { package: FeaturePackage.DRAWING, feature: DrawingFeature.PART_RECOGNITION, label: '识别零件' },
    { package: FeaturePackage.PART, feature: PartFeature.FILL_COLOR, label: '填充色' },
    { package: FeaturePackage.PART, feature: PartFeature.LAYER_EDIT, label: '图层编辑' },
    { package: FeaturePackage.PART, feature: PartFeature.PROCESS, label: '图形工艺' },
    { package: FeaturePackage.NESTING, feature: NestingFeature.PART_ROTATION, label: '零件旋转' },
    { package: FeaturePackage.NESTING, feature: NestingFeature.COLLISION_DETECTION, label: '碰撞检测' },
    { package: FeaturePackage.NESTING, feature: NestingFeature.PLATE_BORDER, label: '板材边框' },
    { package: FeaturePackage.NESTING, feature: NestingFeature.MARGIN, label: '留边' },
    { package: FeaturePackage.COMMON, feature: CommonFeature.BOUNDING_BOX, label: '边框' },
    { package: FeaturePackage.COMMON, feature: CommonFeature.NAME_LABEL, label: '名称' },
  ];

  const getFeatureStatus = (toggle: FeatureToggle): boolean => {
    return isFeatureEnabled(toggle.package, toggle.feature);
  };

  const handleToggle = (toggle: FeatureToggle) => {
    toggleFeature(toggle.package, toggle.feature);
  };

  if (!debugMode) {
    return (
      <div style={styles.container}>
        <button
          style={{ ...styles.button, backgroundColor: hasUserOverrides ? '#4a9eff' : '#2a2a2a' }}
          onClick={() => setDebugMode(true)}
          title={hasUserOverrides ? '有自定义配置' : '显示 Feature Flags 测试面板'}
        >
          🧪 Feature Flags {hasUserOverrides && '✓'}
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <span style={styles.label}>Feature Flags 测试面板</span>
        <button
          style={styles.button}
          onClick={() => setDebugMode(false)}
          title="隐藏测试面板"
        >
          ✕
        </button>
      </div>

      <div style={{ height: '20px', width: '1px', backgroundColor: '#3a3a3a' }} />

      {/* Drawing Features */}
      <div style={styles.section}>
        <span style={styles.label}>图纸:</span>
        {featureToggles
          .filter(t => t.package === FeaturePackage.DRAWING)
          .map(toggle => (
            <button
              key={toggle.label}
              style={{
                ...styles.button,
                ...(getFeatureStatus(toggle) ? styles.buttonActive : {}),
              }}
              onClick={() => handleToggle(toggle)}
              title={`点击切换 - 当前: ${getFeatureStatus(toggle) ? '启用' : '禁用'}`}
            >
              {toggle.label}
            </button>
          ))}
      </div>

      {/* Part Features */}
      <div style={styles.section}>
        <span style={styles.label}>零件:</span>
        {featureToggles
          .filter(t => t.package === FeaturePackage.PART)
          .map(toggle => (
            <button
              key={toggle.label}
              style={{
                ...styles.button,
                ...(getFeatureStatus(toggle) ? styles.buttonActive : {}),
              }}
              onClick={() => handleToggle(toggle)}
              title={`点击切换 - 当前: ${getFeatureStatus(toggle) ? '启用' : '禁用'}`}
            >
              {toggle.label}
            </button>
          ))}
      </div>

      {/* Nesting Features */}
      <div style={styles.section}>
        <span style={styles.label}>排样:</span>
        {featureToggles
          .filter(t => t.package === FeaturePackage.NESTING)
          .map(toggle => (
            <button
              key={toggle.label}
              style={{
                ...styles.button,
                ...(getFeatureStatus(toggle) ? styles.buttonActive : {}),
              }}
              onClick={() => handleToggle(toggle)}
              title={`点击切换 - 当前: ${getFeatureStatus(toggle) ? '启用' : '禁用'}`}
            >
              {toggle.label}
            </button>
          ))}
      </div>

      {/* Common Features */}
      <div style={styles.section}>
        <span style={styles.label}>通用:</span>
        {featureToggles
          .filter(t => t.package === FeaturePackage.COMMON)
          .map(toggle => (
            <button
              key={toggle.label}
              style={{
                ...styles.button,
                ...(getFeatureStatus(toggle) ? styles.buttonActive : {}),
              }}
              onClick={() => handleToggle(toggle)}
              title={`点击切换 - 当前: ${getFeatureStatus(toggle) ? '启用' : '禁用'}`}
            >
              {toggle.label}
            </button>
          ))}
      </div>

      <div style={{ height: '20px', width: '1px', backgroundColor: '#3a3a3a' }} />

      <div style={styles.section}>
        <span style={{ ...styles.label, color: '#4a9eff' }}>
          ✅ 自动保存
        </span>
        {hasUserOverrides && (
          <button
            style={{ ...styles.button, backgroundColor: '#ff6b6b' }}
            onClick={resetToDefaults}
            title="重置为默认配置"
          >
            🔄 重置
          </button>
        )}
      </div>
    </div>
  );
};
