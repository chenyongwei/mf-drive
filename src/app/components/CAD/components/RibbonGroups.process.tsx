import React from 'react';
import {
  RibbonGroup,
  RibbonButton,
  RibbonSplitButton,
  RibbonSlider,
  PlaybackControls,
  RibbonVerticalSeparator,
} from './RibbonShared';
import * as Icons from './NestingRibbonIcons';
import * as Menus from './RibbonDropdowns';
import type { GroupProps } from './RibbonGroups.types';
import { useEditableNumberInput } from './useEditableNumberInput';

const SmallStack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '100%', justifyContent: 'center' }}>
    {children}
  </div>
);

const PartSpacingInput: React.FC<{
  value: number;
  onChange?: (value: number) => void;
  theme: 'dark' | 'light';
}> = ({ value, onChange, theme }) => {
  const clampSpacing = (raw: number): number => {
    if (!Number.isFinite(raw)) return value;
    return Math.max(0, Math.min(100, raw));
  };

  const emitChange = (next: number) => {
    const clamped = clampSpacing(next);
    onChange?.(clamped);
  };

  const { isStale, displayValue, handleChange, handleFocus, handleBlur } = useEditableNumberInput({
    value,
    onValidChange: emitChange,
    onValidBlur: emitChange,
  });

  return (
    <input
      type="number"
      step="0.1"
      min="0"
      max="100"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        width: '48px',
        height: '20px',
        border: 'none',
        background: 'transparent',
        outline: 'none',
        fontSize: '10px',
        textAlign: 'center',
        color: isStale
          ? (theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)')
          : 'inherit',
      }}
    />
  );
};

export const ProcessSettingsGroup: React.FC<GroupProps> = ({
  theme,
  showLabels,
  onAction,
  processAddMenu,
  processDeleteMenu,
  processFavoriteActions = [],
  processPrimaryActionByOperation,
  processPrimaryActionDefByOperation,
  onProcessPrimaryClick,
  onProcessPinToggle,
}) => {
  const addPrimaryAction = processPrimaryActionDefByOperation?.add;
  const deletePrimaryAction = processPrimaryActionDefByOperation?.delete;
  const favoriteActions = processFavoriteActions.slice(0, 6);
  const hasFavorites = favoriteActions.length > 0;
  const favoriteColumnCount = Math.max(1, Math.ceil(favoriteActions.length / 3));

  return (
    <RibbonGroup title="工艺设置" theme={theme} showLabels={showLabels}>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
          <RibbonSplitButton
            label="添加"
            icon={addPrimaryAction?.icon ?? <Icons.LeadIcon />}
            theme={theme}
            showLabel={showLabels}
            size="small"
            dropdownItems={
              processAddMenu && processAddMenu.length > 0
                ? processAddMenu
                : Menus.LeadMenu
            }
            onPrimaryClick={() => onProcessPrimaryClick?.('add')}
            onItemClick={onAction}
            onItemPinToggle={onProcessPinToggle}
            primaryDisabled={!processPrimaryActionByOperation?.add}
          />
          <RibbonSplitButton
            label="删除"
            icon={deletePrimaryAction?.icon ?? <Icons.DeleteIcon />}
            theme={theme}
            showLabel={showLabels}
            size="small"
            dropdownItems={
              processDeleteMenu && processDeleteMenu.length > 0
                ? processDeleteMenu
                : Menus.DeleteMenu
            }
            onPrimaryClick={() => onProcessPrimaryClick?.('delete')}
            onItemClick={onAction}
            onItemPinToggle={onProcessPinToggle}
            primaryDisabled={!processPrimaryActionByOperation?.delete}
          />
        </div>

        {hasFavorites && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${favoriteColumnCount}, max-content)`,
              gridTemplateRows: 'repeat(3, max-content)',
              gridAutoFlow: 'column',
              gap: '2px',
            }}
          >
            {favoriteActions.map((actionDef) => (
              <RibbonButton
                key={actionDef.id}
                label={actionDef.label}
                icon={actionDef.icon}
                theme={theme}
                size="small"
                showLabel={showLabels}
                onClick={() => onAction?.(actionDef.id)}
              />
            ))}
          </div>
        )}
      </div>
    </RibbonGroup>
  );
};

export const NestingGroup: React.FC<GroupProps> = ({
  theme,
  showLabels,
  onAction,
  partSpacing = 5,
  onPartSpacingChange,
}) => (
  <RibbonGroup title="排样" theme={theme} showLabels={showLabels}>
    <RibbonButton label="排样" icon={<Icons.SuperNestIcon />} theme={theme} hasDropdown showLabel={showLabels} dropdownItems={Menus.SuperNestMenu} onItemClick={onAction} />
    <SmallStack>
      <RibbonButton label="重排当前板" theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.RenestMenu} icon={<Icons.RenestIcon />} onItemClick={onAction} />
      <RibbonButton label="填充当前板" theme={theme} size="small" showLabel={showLabels} icon={<div style={{ width: '12px', height: '12px', background: 'linear-gradient(45deg, #52c41a, #b7eb8f)' }} />} onClick={() => onAction?.('nest-auto')} />
      <RibbonButton label="调整当前板" theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.AdjustPlateMenu} icon={<Icons.AdjustPlateIcon />} onItemClick={onAction} />
    </SmallStack>
    <RibbonVerticalSeparator theme={theme} />
    <SmallStack>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '20px' }}>
        <RibbonButton label="共边" theme={theme} size="small" icon={<div style={{ width: '12px', height: '8px', background: 'green', borderTop: '2px solid yellow', borderBottom: '2px solid yellow' }} />} showLabel={showLabels} />
        <div style={{ fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center' }}>
          {showLabels && '零件间距'}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              border: '1px solid #ccc',
              borderRadius: '2px',
              padding: '0 4px',
              background: theme === 'dark' ? '#333' : '#fff',
            }}
          >
            <PartSpacingInput
              value={partSpacing}
              onChange={onPartSpacingChange}
              theme={theme}
            />
            <span style={{ fontSize: '9px', opacity: 0.65 }}>mm</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '20px' }}>
        <RibbonButton label="阵列" icon={<Icons.ArrayIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.ArrayMenu} onItemClick={onAction} />
        <RibbonButton label="贴边" theme={theme} size="small" hasDropdown showLabel={showLabels} icon={<Icons.StickToEdgeIcon />} dropdownItems={Menus.StickToEdgeMenu} onItemClick={onAction} />
      </div>

      <RibbonButton label="排样任务参数" theme={theme} size="small" icon={<div style={{ filter: 'grayscale(1)' }}>📋</div>} showLabel={showLabels} />
    </SmallStack>
  </RibbonGroup>
);

export const SortingGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction, sortingMode }) => (
  <RibbonGroup title="排序" theme={theme} showLabels={showLabels}>
    <RibbonSplitButton
      label="自动排序"
      icon={<Icons.AdvancedSortIcon />}
      theme={theme}
      showLabel={showLabels}
      dropdownItems={Menus.getSortingMenu(sortingMode)}
      onPrimaryClick={() => onAction?.('nest-auto')}
      onItemClick={onAction}
    />
    <RibbonButton label="手工排序" icon={<Icons.ManualSortIcon />} theme={theme} hasDropdown showLabel={showLabels} dropdownItems={Menus.ManualSortingMenu} onItemClick={onAction} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
      <PlaybackControls icons={Icons.PlaybackIcons} />
      <RibbonSlider theme={theme} />
    </div>
  </RibbonGroup>
);

export const PathGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="刀路" theme={theme} showLabels={showLabels}>
    <SmallStack>
      <RibbonButton label="模拟" icon={<Icons.SimulationIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} onClick={() => onAction?.('show-path')} />
      <RibbonButton label="余料" icon={<Icons.ScrapIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.ScrapMenu} onItemClick={onAction} />
      <RibbonButton label="骨架切碎" icon={<Icons.SkeletonCutIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.SkeletonCutMenu} onItemClick={onAction} />
    </SmallStack>
  </RibbonGroup>
);

export const ToolGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="工具" theme={theme} showLabels={showLabels}>
    <SmallStack>
      <RibbonButton label="测量" icon={<Icons.MeasureIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.MeasureMenu} onItemClick={onAction} />
      <RibbonButton label="工艺" icon={<Icons.CraftIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.CraftMenu} onItemClick={onAction} />
      <RibbonButton label="添加标签" icon={<Icons.LabelIcon />} theme={theme} size="small" showLabel={showLabels} onClick={() => onAction?.('add-label')} />
    </SmallStack>
    <RibbonButton label="导出" icon={<Icons.ExportIcon />} theme={theme} hasDropdown showLabel={showLabels} dropdownItems={Menus.CombinedExportMenu} onItemClick={onAction} />
  </RibbonGroup>
);
