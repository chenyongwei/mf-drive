import React from 'react';
import { RibbonGroup, RibbonButton, RibbonSplitButton } from './RibbonShared';
import * as DrawingIcons from './DrawingRibbonIcons';
import * as Menus from './RibbonDropdowns';
import type { GroupProps } from './RibbonGroups.types';

const PartRecognitionMenu: Menus.DropdownItem[] = [
  { id: 'set-as-part', label: '强制设为零件', icon: <DrawingIcons.SetAsPartIcon /> },
];

export const PartsGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="零件" theme={theme} showLabels={showLabels}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '4px',
        minWidth: showLabels ? '118px' : '50px',
      }}
    >
      <RibbonSplitButton
        label="自动识别零件"
        icon={<DrawingIcons.IdentifyPartIcon />}
        theme={theme}
        showLabel={showLabels}
        size="small"
        style={{ width: '100%' }}
        dropdownItems={PartRecognitionMenu}
        onPrimaryClick={() => onAction?.('identify-part')}
        onItemClick={onAction}
      />
      <RibbonButton
        label="还原为图形"
        icon={<DrawingIcons.CancelPartIcon />}
        theme={theme}
        size="small"
        showLabel={showLabels}
        style={{
          width: '100%',
          justifyContent: showLabels ? undefined : 'center',
        }}
        onClick={() => onAction?.('cancel-part')}
      />
    </div>
  </RibbonGroup>
);

export const NotchGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="坡口" theme={theme} showLabels={showLabels}>
    <RibbonButton label="坡口属性" icon={<DrawingIcons.NotchPropIcon />} theme={theme} hasDropdown showLabel={showLabels} onItemClick={onAction} />
    <RibbonButton label="手动坡口" icon={<DrawingIcons.ManualNotchIcon />} theme={theme} hasDropdown showLabel={showLabels} onItemClick={onAction} />
    <RibbonButton label="自动坡口" icon={<DrawingIcons.AutoNotchIcon />} theme={theme} hasDropdown showLabel={showLabels} onItemClick={onAction} />
    <RibbonButton label="坡口延伸" icon={<DrawingIcons.NotchExtendIcon />} theme={theme} hasDropdown showLabel={showLabels} onItemClick={onAction} />
    <RibbonButton label="合并坡口" icon={<DrawingIcons.MergeNotchIcon />} theme={theme} hasDropdown showLabel={showLabels} onItemClick={onAction} />
    <RibbonButton label="坡口映射" icon={<DrawingIcons.NotchMappingIcon />} theme={theme} showLabel={showLabels} onClick={() => onAction?.('notch-mapping')} />
  </RibbonGroup>
);

export const DrawingOptimizationGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="图纸编辑" theme={theme} showLabels={showLabels}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, max-content)',
        gridTemplateRows: 'repeat(3, 22px)',
        columnGap: '8px',
        rowGap: '2px',
        alignItems: 'center',
        height: '100%',
        padding: '2px 0',
      }}
    >
      <RibbonButton label="曲线分割" theme={theme} size="small" icon={<DrawingIcons.CurveSplitIcon />} showLabel={showLabels} onClick={() => onAction?.('curve-split')} />
      <RibbonButton label="裁剪" theme={theme} size="small" icon={<DrawingIcons.TrimIcon />} showLabel={showLabels} onClick={() => onAction?.('trim')} />
      <RibbonButton label="延伸" theme={theme} size="small" icon={<DrawingIcons.ExtendIcon />} showLabel={showLabels} onClick={() => onAction?.('extend')} />
      <RibbonButton label="倒角" theme={theme} size="small" icon={<DrawingIcons.ChamferIcon />} hasDropdown showLabel={showLabels} dropdownItems={Menus.ChamferMenu} onItemClick={onAction} />

      <RibbonButton label="桥接" theme={theme} size="small" icon={<DrawingIcons.BridgeIcon />} showLabel={showLabels} onClick={() => onAction?.('bridge')} />
      <RibbonButton label="释放角" theme={theme} size="small" icon={<DrawingIcons.ReleaseAngleIcon />} showLabel={showLabels} onClick={() => onAction?.('release-angle')} />
      <RibbonButton label="阵列" theme={theme} size="small" icon={<DrawingIcons.ArrayIcon />} hasDropdown showLabel={showLabels} dropdownItems={Menus.ArrayMenu} onItemClick={onAction} />
      <RibbonButton label="图纸优化" theme={theme} size="small" icon={<DrawingIcons.OptimizeIcon />} hasDropdown showLabel={showLabels} dropdownItems={Menus.OptimizeMenu} onItemClick={onAction} />

      <RibbonButton label="文字编辑" theme={theme} size="small" icon={<DrawingIcons.TextExplodeIcon />} showLabel={showLabels} onClick={() => onAction?.('text-edit')} />
      <RibbonButton label="图形替换" theme={theme} size="small" icon={<DrawingIcons.GeomReplaceIcon />} hasDropdown showLabel={showLabels} dropdownItems={Menus.GeomReplaceMenu} onItemClick={onAction} />
      <RibbonButton label="沉孔" theme={theme} size="small" icon={<DrawingIcons.FilletIcon />} hasDropdown showLabel={showLabels} dropdownItems={Menus.CountersinkMenu} onItemClick={onAction} />
      <div />
    </div>
  </RibbonGroup>
);

export const GeometryGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="几何变换" theme={theme} showLabels={showLabels}>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', height: '100%' }}>
      <RibbonButton label="尺寸" icon={<DrawingIcons.SizeIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.DimensionMenu} onItemClick={onAction} />
      <RibbonButton label="几何变换" icon={<DrawingIcons.TransformIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.TransformMenu} onItemClick={onAction} />
      <RibbonButton label="测量" icon={<DrawingIcons.MeasureIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.MeasureMenu} onItemClick={onAction} />
    </div>
  </RibbonGroup>
);

export const ProcessGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="工艺设置" theme={theme} showLabels={showLabels}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, max-content)',
        gridTemplateRows: 'repeat(3, 22px)',
        gridAutoFlow: 'column',
        columnGap: '8px',
        rowGap: '2px',
        alignItems: 'center',
        height: '100%',
        padding: '2px 0',
      }}
    >
      <RibbonButton label="引线" icon={<DrawingIcons.LeadIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.LeadMenu} onItemClick={onAction} />
      <RibbonButton label="删除" icon={<DrawingIcons.DeleteIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.DeleteMenu} onItemClick={onAction} />
      <RibbonButton label="阳切" icon={<DrawingIcons.PositiveCutIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} onClick={() => onAction?.('positive-cut')} />

      <RibbonButton label="阴切" icon={<DrawingIcons.NegativeCutIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} onClick={() => onAction?.('negative-cut')} />
      <RibbonButton label="起点" icon={<DrawingIcons.StartPointIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.LeadMenu} onItemClick={onAction} />
      <RibbonButton label="冷却点" icon={<DrawingIcons.CoolPointIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.CoolPointMenu} onItemClick={onAction} />

      <RibbonButton label="微连" icon={<DrawingIcons.MicroJointIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.MicroJointMenu} onItemClick={onAction} />
      <RibbonButton label="反向" icon={<DrawingIcons.ReverseDirectionIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.ReverseMenu} onItemClick={onAction} />
      <RibbonButton label="环切" icon={<DrawingIcons.LoopIcon />} theme={theme} size="small" showLabel={showLabels} onClick={() => onAction?.('loop-cut')} />

      <RibbonButton label="封口" icon={<DrawingIcons.SealIcon />} theme={theme} size="small" hasDropdown showLabel={showLabels} dropdownItems={Menus.SealMenu} onItemClick={onAction} />
    </div>
  </RibbonGroup>
);

export const DrawingToolGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="工具" theme={theme} showLabels={showLabels}>
    <RibbonButton label="打数" icon={<DrawingIcons.CountIcon />} theme={theme} showLabel={showLabels} onClick={() => onAction?.('count')} />
    <RibbonButton label="测量" icon={<DrawingIcons.MeasureIcon />} theme={theme} showLabel={showLabels} hasDropdown dropdownItems={Menus.MeasureMenu} onItemClick={onAction} />
  </RibbonGroup>
);

export const SaveGroup: React.FC<GroupProps> = ({ theme, showLabels, onAction }) => (
  <RibbonGroup title="保存" theme={theme} showLabels={showLabels}>
    <RibbonButton label="保存" icon={<DrawingIcons.SaveIcon />} theme={theme} showLabel={showLabels} onClick={() => onAction?.('save')} />
  </RibbonGroup>
);
