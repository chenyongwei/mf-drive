import React from 'react';
import * as Icons from './NestingRibbonIcons';
import type { DropdownItem } from './RibbonDropdowns.types';

const ApplySubMenu: DropdownItem[] = [
    { id: 'apply-current', label: '应用当前', icon: <Icons.ApplyCurrentIcon />, shortcut: '0' },
    { id: 'apply-all', label: '应用所有', icon: <Icons.ApplyAllIcon />, shortcut: '0' },
    { id: 'apply-selected', label: '应用选中', icon: <Icons.ApplySelectedIcon /> },
];

export const AdvancedSortingMenu: DropdownItem[] = [
    { id: 'sort-adv-inner', label: '高级排序', icon: <Icons.AdvancedSortIcon /> },
    { id: 'sort-edit-common', label: '编辑共边刀路', disabled: true },
    { id: 'sort-check', label: '检查刀路' },
    { id: 'sort-clear-check', label: '清除刀路检查结果' },
];

export const ManualSortingMenu: DropdownItem[] = [
    { id: 'sort-part', label: '零件间排序', icon: <Icons.PartSortIcon /> },
    { id: 'sort-inner', label: '零件内排序', icon: <Icons.InnerSortIcon /> },
    { id: 'isSeparator-sort', label: '', isSeparator: true },
    { id: 'sort-front', label: '最前', icon: <Icons.SortToFrontIcon /> },
    { id: 'sort-back', label: '最后', icon: <Icons.SortToBackIcon /> },
    { id: 'sort-fwd', label: '向前', icon: <Icons.SortForwardIcon /> },
    { id: 'sort-prev', label: '向后', icon: <Icons.SortBackwardIcon /> },
];

export const ScrapMenu: DropdownItem[] = [
    { id: 'scrap-auto', label: '自动余料线' },
    { id: 'scrap-edit', label: '编辑/绘制余料线' },
    { id: 'scrap-clear', label: '清空余料线', children: ApplySubMenu },
    { id: 'scrap-tag', label: '余料板打标' },
    {
        id: 'scrap-export',
        label: '导出余料板材',
        children: [
            { id: 'export-curr', label: '当前排版' },
            { id: 'export-selected', label: '勾选排版' },
            { id: 'export-all', label: '所有排版' },
        ],
    },
    { id: 'scrap-lead', label: '余料线板外引入、延伸出板' },
];

export const SkeletonCutMenu: DropdownItem[] = [
    { id: 'ske-edit-single', label: '编辑单条切碎线' },
    { id: 'ske-edit-all', label: '编辑整条切碎线' },
    { id: 'ske-draw-manual', label: '手动绘制切碎线' },
    { id: 'ske-draw-area', label: '区域绘制切碎线' },
    {
        id: 'ske-clear',
        label: '清空骨架线',
        children: [
            { id: 'clear-ske-curr', label: '应用当前' },
            { id: 'clear-ske-all', label: '应用所有' },
        ],
    },
    { id: 'ske-bridge', label: '手动骨架连桥', isVIP: true },
];

export const RenestMenu: DropdownItem[] = [
    { id: 'renest-checked', label: '重排勾选排板', disabled: true },
    { id: 'renest-all', label: '重排所有板' },
];

export const AdjustPlateMenu: DropdownItem[] = [
    { id: 'adjust-checked', label: '调整勾选板材', disabled: true },
    { id: 'adjust-all', label: '调整所有板材' },
];

export const ArrayMenu: DropdownItem[] = [
    { id: 'rect-array', label: '矩形阵列' },
    { id: 'interactive-array', label: '交互式阵列' },
    { id: 'circle-array', label: '环形阵列' },
];

export const ChamferMenu: DropdownItem[] = [
    { id: 'restore-chamfer', label: '恢复倒角', icon: <Icons.ChamferIcon /> },
];

export const OptimizeMenu: DropdownItem[] = [
    { id: 'merge-connected-lines', label: '合并相连线' },
    { id: 'remove-duplicates', label: '去除重复线' },
    { id: 'break-lines', label: '裁断', icon: <Icons.SplitIcon /> },
];

export const GeomReplaceMenu: DropdownItem[] = [
    { id: 'replace-with-circle', label: '替换为圆' },
    { id: 'replace-with-point', label: '替换为点' },
    { id: 'replace-with-cross', label: '替换为十字' },
    { id: 'isSeparator-replace', label: '', isSeparator: true },
    { id: 'narrow-slot-replace', label: '窄缝替换', icon: <Icons.SortSmallIcon /> },
    { id: 'simplify-marking', label: '简化打标线' },
];

export const CountersinkMenu: DropdownItem[] = [
    { id: 'new-countersink', label: '新建沉孔' },
    { id: 'countersink-to-circle', label: '沉孔变圆' },
    { id: 'countersink-params', label: '沉孔参数' },
];

export const MeasureMenu: DropdownItem[] = [
    { id: 'measure-curve', label: '曲线测量' },
    { id: 'draw-dimension', label: '标注', icon: <Icons.MeasureIcon /> },
];

export const CombinedExportMenu: DropdownItem[] = [
    { id: 'export-top-dxf', label: '导出 DXF', icon: <Icons.ExportIcon /> },
    { id: 'export-top-pdf', label: '导出 PDF', icon: <Icons.ExportIcon /> },
    { id: 'push-entry', label: '推送', icon: <Icons.PushIcon /> },
    { id: 'isSeparator-export-1', label: '', isSeparator: true },
    { id: 'report-summary-entry', label: '生产汇总表', icon: <Icons.ReportIcon /> },
    { id: 'report-label-entry', label: '零件标签页', icon: <Icons.ReportIcon /> },
];

export const CraftMenu: DropdownItem[] = [
    { id: 'craft-check', label: '工艺检查' },
    { id: 'craft-auto', label: '自动分配工艺' },
];

export const LanguageMenu: DropdownItem[] = [
    { id: 'lang-zh-cn', label: '简体中文' },
    { id: 'lang-zh-tw', label: '繁體中文' },
    { id: 'lang-en', label: 'English' },
    { id: 'lang-ja', label: '日本語' },
];

export const DimensionMenu: DropdownItem[] = [
    { id: 'scale-100mm', label: '100mm' },
    { id: 'scale-200mm', label: '200mm' },
    { id: 'scale-0.5x', label: '0.5倍' },
    { id: 'scale-2x', label: '2倍' },
    { id: 'scale-4x', label: '4倍' },
    { id: 'scale-8x', label: '8倍' },
    { id: 'scale-10x', label: '10倍' },
    { id: 'scale-25.4x', label: '25.4倍' },
    { id: 'scale-1-25.4x', label: '1/25.4倍' },
    { id: 'isSeparator-dim', label: '', isSeparator: true },
    { id: 'scale-interactive', label: '交互式缩放', icon: <Icons.MeasureIcon /> },
];

export const TransformMenu: DropdownItem[] = [
    { id: 'mirror-horizontal', label: '水平镜像' },
    { id: 'mirror-vertical', label: '垂直镜像' },
    { id: 'mirror-arbitrary', label: '任意角度镜像' },
    { id: 'rotate-cw-90', label: '顺时针旋转90°' },
    { id: 'rotate-ccw-90', label: '逆时针旋转90°' },
    { id: 'rotate-180', label: '旋转180°' },
    { id: 'rotate-arbitrary', label: '任意角度旋转' },
];
