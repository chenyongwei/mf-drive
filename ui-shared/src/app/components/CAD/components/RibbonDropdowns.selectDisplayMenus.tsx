import React from 'react';
import * as Icons from './NestingRibbonIcons';
import type { DropdownItem } from './RibbonDropdowns.types';

const ApplySubMenu: DropdownItem[] = [
    { id: 'apply-current', label: '应用当前', icon: <Icons.ApplyCurrentIcon />, shortcut: '0' },
    { id: 'apply-all', label: '应用所有', icon: <Icons.ApplyAllIcon />, shortcut: '0' },
    { id: 'apply-selected', label: '应用选中', icon: <Icons.ApplySelectedIcon /> },
];

export const SelectLayerMenu: DropdownItem[] = [
    { id: 'select-layer-0', label: 'Layer 0' },
    { id: 'select-layer-1', label: 'Layer 1' },
];

export const NestingSelectMenu: DropdownItem[] = [
    { id: 'select-all', label: '全选', shortcut: 'Ctrl+A' },
    { id: 'select-invert', label: '反选' },
    { id: 'select-none', label: '取消选择' },
    { id: 'select-open', label: '选择未封闭' },
    { id: 'select-inner', label: '选择内轮廓' },
    { id: 'select-outer', label: '选择外轮廓' },
    { id: 'select-small', label: '选择小图形' },
];

export const DrawingSelectMenu: DropdownItem[] = [
    { id: 'select-all', label: '全选(A)', shortcut: 'Ctrl+A' },
    { id: 'select-invert', label: '反选(V)' },
    { id: 'select-none', label: '取消选择' },
    { id: 'quick-select', label: '快速选择', shortcut: 'Ctrl+F' },
    { id: 'delete-selected', label: '删除选中图纸', shortcut: 'Del', icon: <Icons.DeleteIcon /> },
    { id: 'copy', label: '复制', shortcut: 'Ctrl+C' },
    { id: 'paste', label: '粘贴', shortcut: 'Ctrl+V' },
    { id: 'isSeparator-batch', label: '', isSeparator: true },
    { id: 'batch-modify-label', label: '批量修改', disabled: true },
    { id: 'select-unclosed', label: '选择不封闭图形' },
    { id: 'select-similar', label: '选择相似图形', shortcut: 'S' },
    { id: 'select-similar-angle', label: '选择相似图形(区分角度)' },
    { id: 'select-outer', label: '选择所有外模' },
    { id: 'select-inner', label: '选择所有内模' },
    { id: 'distinguish-inner-outer', label: '区分内外模' },
    { id: 'select-layer', label: '选择图层', children: SelectLayerMenu },
    { id: 'select-smaller', label: '选择小于 1毫米' },
    { id: 'select-size-range', label: '尺寸范围选择' },
    { id: 'isSeparator-type', label: '', isSeparator: true },
    { id: 'select-polylines', label: '选择所有多段线' },
    { id: 'select-circles', label: '选择所有圆' },
    { id: 'select-beziers', label: '选择所有bezier' },
    { id: 'select-points', label: '选择所有点' },
    { id: 'select-texts', label: '选择所有文字' },
];

export const BevelTextMenu: DropdownItem[] = [
    { id: 'show-bevel-text-all', label: '显示全部' },
    { id: 'show-bevel-text-none', label: '隐藏全部' },
];

export const NestingDisplayMenu: DropdownItem[] = [
    { id: 'show-index', label: '显示序号', checked: true },
    { id: 'show-path', label: '显示路径', checked: true },
    { id: 'show-leads', label: '显示引线', checked: true },
    { id: 'show-micro', label: '显示微连', checked: true },
    { id: 'fill-parts', label: '零件填充', checked: true },
    { id: 'isSeparator-1', label: '', isSeparator: true },
    { id: 'show-dimensions', label: '显示尺寸标注', checked: false, icon: <Icons.DimensionIcon /> },
    { id: 'isSeparator-2', label: '', isSeparator: true },
    { id: 'hotkey-settings', label: '快捷键设置...' },
];

export const DrawingDisplayMenu: DropdownItem[] = [
    { id: 'show-unclosed-frame', label: '显示不封闭图形外框', icon: <Icons.UnclosedFrameIcon /> },
    { id: 'show-unclosed-red', label: '红色显示不封闭图形', icon: <Icons.UnclosedRedIcon /> },
    { id: 'show-path-start', label: '显示路径起点', icon: <Icons.PathStartIcon /> },
    { id: 'isSeparator-disp-1', label: '', isSeparator: true },
    { id: 'show-proc-path', label: '显示加工路径', shortcut: 'F7', icon: <Icons.ProcessPathIcon /> },
    { id: 'show-micro-mark', label: '显示微连标记', icon: <Icons.MicroJointMarkIcon /> },
    { id: 'show-gap-mark', label: '显示缺口标记' },
    { id: 'show-bevel-traj', label: '显示坡口下表面轨迹', icon: <Icons.BevelTrajIcon /> },
    { id: 'show-bevel-text', label: '显示坡口文字', children: BevelTextMenu },
    { id: 'isSeparator-disp-2', label: '', isSeparator: true },
    { id: 'show-dimensions', label: '显示尺寸标注', checked: false, icon: <Icons.DimensionIcon /> },
    { id: 'isSeparator-disp-3', label: '', isSeparator: true },
    { id: 'show-file-info', label: '显示图纸文件信息', icon: <Icons.FileInfoIcon /> },
    { id: 'show-errors', label: '显示错误提示', icon: <Icons.ErrorIcon /> },
    { id: 'isSeparator-disp-4', label: '', isSeparator: true },
    { id: 'view-all', label: '查看全部', shortcut: 'F3', icon: <Icons.ViewAllIcon /> },
    { id: 'fit-selection', label: '适应选择(L)', disabled: true, icon: <Icons.FitSelectionIcon /> },
    { id: 'custom-shortcuts', label: '自定义快捷键' },
];

export const LeadMenu: DropdownItem[] = [{ id: 'check-leads-current', label: '检查引入引出' }];

export const DeleteMenu: DropdownItem[] = [
    { id: 'clear-leads', label: '清除引入引出线', children: ApplySubMenu },
    { id: 'clear-micro', label: '清除微连', children: ApplySubMenu },
    { id: 'clear-cool', label: '清除冷却点', children: ApplySubMenu, icon: <Icons.CoolPointIcon /> },
    { id: 'clear-comp', label: '取消补偿', children: ApplySubMenu },
    { id: 'clear-gap', label: '清除缺口/过切', children: ApplySubMenu },
    { id: 'isSeparator-del', label: '', isSeparator: true },
    { id: 'delete-single-micro', label: '删除单个微连' },
];

export const MicroJointMenu: DropdownItem[] = [
    { id: 'micro-edit', label: '编辑微连', icon: <Icons.MicroJointEditIcon /> },
    { id: 'micro-auto', label: '自动微连', icon: <Icons.MicroJointAutoIcon />, shortcut: 'Shift+A' },
    { id: 'micro-batch', label: '划线批量微连', icon: <Icons.MicroJointBatchIcon />, shortcut: 'Shift+W' },
    { id: 'micro-long-edge', label: '长边微连', icon: <Icons.MicroJointLongEdgeIcon /> },
];

export const CompensationMenu: DropdownItem[] = [
    { id: 'comp-apply', label: '应用补偿', children: ApplySubMenu },
];

export const CoolPointMenu: DropdownItem[] = [
    { id: 'cool-auto', label: '自动冷却点', icon: <Icons.CoolPointIcon /> },
    { id: 'cool-clear', label: '清除冷却点', icon: <Icons.CoolPointIcon /> },
];

export const SealMenu: DropdownItem[] = [
    { id: 'seal-apply', label: '封口', icon: <Icons.SealIcon /> },
    { id: 'gap-apply', label: '缺口', icon: <Icons.GapIcon /> },
    { id: 'overcut-apply', label: '过切', icon: <Icons.OvercutIcon /> },
];

export const ReverseMenu: DropdownItem[] = [
    { id: 'reverse-do', label: '反向', shortcut: 'Ctrl+R', icon: <Icons.ReverseDirectionIcon /> },
    { id: 'reverse-ccw', label: '逆时针', icon: <Icons.RotateCCWIcon /> },
    { id: 'reverse-cw', label: '顺时针', icon: <Icons.RotateCWIcon /> },
];

export const SuperNestMenu: DropdownItem[] = [
    { id: 'nest-auto', label: '自动排样' },
    { id: 'nest-area', label: '区域排样' },
    { id: 'nest-non-scrap', label: '非余料区域排样' },
];

export const StickToEdgeMenu: DropdownItem[] = [
    { id: 'edge-auto', label: '自动排样启用贴边' },
    { id: 'edge-lead', label: '自动从板材引入，延伸出板', checked: true },
];
