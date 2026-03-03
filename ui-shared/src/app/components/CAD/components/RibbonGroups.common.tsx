import React from 'react';
import { RibbonGroup, RibbonButton } from './RibbonShared';
import * as Icons from './NestingRibbonIcons';
import * as DrawingIcons from './DrawingRibbonIcons';
import * as Menus from './RibbonDropdowns';
import type { GroupProps, SettingsGroupProps } from './RibbonGroups.types';

export const ViewGroup: React.FC<GroupProps> = ({
  theme,
  showLabels,
  onAction,
  showDimensions = false,
  showDistanceGuides = true,
  distanceGuideMaxDistance = 40,
  commonEdgeEnabled = true,
  stickToEdgeEnabled = false,
  snappingEnabled = true,
  snapTolerance = 15,
}) => (
  <RibbonGroup title="查看" theme={theme} showLabels={showLabels}>
    <RibbonButton label="选择" icon={<Icons.SelectIcon />} theme={theme} hasDropdown showLabel={showLabels} dropdownItems={Menus.NestingSelectMenu} onItemClick={onAction} />
    <RibbonButton
      label="显示"
      icon={<Icons.DisplayIcon />}
      theme={theme}
      hasDropdown
      showLabel={showLabels}
      dropdownItems={Menus.getNestingDisplayMenu(showDimensions, showDistanceGuides, distanceGuideMaxDistance)}
      onItemClick={onAction}
    />
    <RibbonButton
      label="开启"
      icon={<Icons.EnableIcon />}
      theme={theme}
      hasDropdown
      showLabel={showLabels}
      dropdownItems={Menus.getNestingEnableMenu(commonEdgeEnabled, stickToEdgeEnabled, snappingEnabled, snapTolerance)}
      onItemClick={onAction}
    />
  </RibbonGroup>
);

export const DrawingViewGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction, showDimensions = false }) => (
  <RibbonGroup title="查看" theme={theme} showLabels={showLabels}>
    <RibbonButton label="选择" icon={<DrawingIcons.SelectIcon />} theme={theme} hasDropdown showLabel={showLabels} dropdownItems={Menus.DrawingSelectMenu} onItemClick={onAction} />
    <RibbonButton label="显示" icon={<DrawingIcons.DisplayIcon />} theme={theme} hasDropdown showLabel={showLabels} dropdownItems={Menus.getDrawingDisplayMenu(showDimensions)} onItemClick={onAction} />
  </RibbonGroup>
);

const languageLabelByCode: Record<string, string> = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  ja: '日本語',
};

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  theme,
  showLabels,
  lang,
  onThemeToggle,
  onLanguageChange,
}) => (
  <RibbonGroup title="设置" theme={theme} showLabels={showLabels}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '100%', justifyContent: 'center' }}>
      <RibbonButton
        label={languageLabelByCode[lang] ?? 'English'}
        icon={<Icons.LanguageIcon />}
        theme={theme}
        size="small"
        onClick={onLanguageChange}
        style={{ width: showLabels ? '90px' : '30px' }}
        showLabel={showLabels}
        hasDropdown
        dropdownItems={Menus.LanguageMenu}
      />
      <RibbonButton
        label={theme === 'dark' ? '深色模式' : '浅色模式'}
        icon={<Icons.ThemeIcon isDark={theme === 'dark'} />}
        theme={theme}
        size="small"
        onClick={onThemeToggle}
        style={{ width: showLabels ? '90px' : '30px' }}
        showLabel={showLabels}
        hasDropdown={false}
      />
    </div>
  </RibbonGroup>
);
