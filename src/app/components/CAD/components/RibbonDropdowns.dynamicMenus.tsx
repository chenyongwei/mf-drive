import React from 'react';
import * as Icons from './NestingRibbonIcons';
import { AdvancedSortingMenu } from './RibbonDropdowns.operationMenus';
import { BevelTextMenu } from './RibbonDropdowns.selectDisplayMenus';
import type { DropdownItem, SortingModeId } from './RibbonDropdowns.types';

export function getNestingEnableMenu(
    commonEdgeEnabled: boolean = true,
    stickToEdgeEnabled: boolean = false,
    snappingEnabled: boolean = true,
    snapTolerance: number = 15,
): DropdownItem[] {
    const normalizedSnapTolerance = Number.isFinite(snapTolerance)
        ? Math.max(0, Number(snapTolerance))
        : 15;

    return [
        { id: 'enable-common-edge', label: '开启共边', checked: commonEdgeEnabled },
        { id: 'enable-stick-edge', label: '开启贴边', checked: stickToEdgeEnabled },
        {
            id: 'enable-snapping',
            label: '开启',
            checked: snappingEnabled,
            checkedLabelColor: '#00e68a',
            inlineNumberInput: {
                value: normalizedSnapTolerance,
                min: 0,
                max: 1000,
                step: 1,
                suffix: 'mm内自动吸附',
                actionPrefix: 'set-snap-tolerance:',
                textColor: '#b8b8b8',
                checkedTextColor: '#00e68a',
            },
        },
    ];
}

export function getSortingMenu(selectedMode?: SortingModeId): DropdownItem[] {
    return [
        { id: 'sort-inner-outer', label: '先内后外', checked: selectedMode === 'sort-inner-outer' },
        { id: 'sort-left-right', label: '从左到右', checked: selectedMode === 'sort-left-right' },
        { id: 'sort-top-bottom', label: '从上到下', checked: selectedMode === 'sort-top-bottom' },
        { id: 'sort-bottom-top', label: '从下到上', checked: selectedMode === 'sort-bottom-top' },
        { id: 'isSeparator-sorting-1', label: '', isSeparator: true },
        {
            id: 'sort-advanced-entry',
            label: '高级排序',
            icon: <Icons.AdvancedSortIcon />,
            children: AdvancedSortingMenu,
        },
    ];
}

export const SortingMenu: DropdownItem[] = getSortingMenu('sort-bottom-top');

export function getNestingDisplayMenu(
    showDimensions: boolean,
    showDistanceGuides: boolean = true,
    distanceGuideMaxDistance: number = 40,
): DropdownItem[] {
    const normalizedDistanceMax = Number.isFinite(distanceGuideMaxDistance)
        ? Math.max(0, Number(distanceGuideMaxDistance))
        : 40;

    return [
        { id: 'show-index', label: '显示序号', checked: true },
        { id: 'show-path', label: '显示路径', checked: true },
        { id: 'show-leads', label: '显示引线', checked: true },
        { id: 'show-micro', label: '显示微连', checked: true },
        { id: 'fill-parts', label: '零件填充', checked: true },
        { id: 'isSeparator-1', label: '', isSeparator: true },
        {
            id: 'show-distance-guides',
            label: '显示',
            checked: showDistanceGuides,
            checkedLabelColor: '#3b82f6',
            inlineNumberInput: {
                value: normalizedDistanceMax,
                min: 0,
                max: 1000,
                step: 1,
                suffix: 'mm 内的零件间距',
                actionPrefix: 'set-distance-guide-max:',
                textColor: '#b8b8b8',
                checkedTextColor: '#3b82f6',
            },
        },
        { id: 'isSeparator-1b', label: '', isSeparator: true },
        {
            id: 'show-dimensions',
            label: '显示尺寸标注',
            checked: showDimensions,
            icon: <Icons.DimensionIcon />,
        },
        { id: 'isSeparator-2', label: '', isSeparator: true },
        { id: 'hotkey-settings', label: '快捷键设置...' },
    ];
}

export function getDrawingDisplayMenu(showDimensions: boolean): DropdownItem[] {
    return [
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
        {
            id: 'show-dimensions',
            label: '显示尺寸标注',
            checked: showDimensions,
            icon: <Icons.DimensionIcon />,
        },
        { id: 'isSeparator-disp-3', label: '', isSeparator: true },
        { id: 'show-file-info', label: '显示图纸文件信息', icon: <Icons.FileInfoIcon /> },
        { id: 'show-errors', label: '显示错误提示', icon: <Icons.ErrorIcon /> },
        { id: 'isSeparator-disp-4', label: '', isSeparator: true },
        { id: 'view-all', label: '查看全部', shortcut: 'F3', icon: <Icons.ViewAllIcon /> },
        { id: 'fit-selection', label: '适应选择(L)', disabled: true, icon: <Icons.FitSelectionIcon /> },
        { id: 'custom-shortcuts', label: '自定义快捷键' },
    ];
}
