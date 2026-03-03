import type React from 'react';
import type { NestingProcessOperation } from '../types/NestingTypes';

export interface DropdownItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    checked?: boolean;
    children?: DropdownItem[];
    isSeparator?: boolean;
    disabled?: boolean;
    isVIP?: boolean;
    checkedLabelColor?: string;
    inlineNumberInput?: {
        value: number;
        min?: number;
        max?: number;
        step?: number;
        suffix?: string;
        actionPrefix: string;
        disabled?: boolean;
        textColor?: string;
        checkedTextColor?: string;
    };
    pinnable?: boolean;
    pinned?: boolean;
    pinLabel?: string;
}

export interface NestingProcessCapabilityMap {
    [capability: string]: boolean | undefined;
}

export interface NestingProcessActionDef {
    id: string;
    operation: NestingProcessOperation;
    label: string;
    enabledByDefault: boolean;
    capabilityRequired?: string;
    groupLabel: string;
    icon?: React.ReactNode;
}

export interface NestingProcessMenusResult {
    addMenu: DropdownItem[];
    deleteMenu: DropdownItem[];
    primaryActionByOperation: Partial<Record<NestingProcessOperation, string>>;
    favoriteActions: NestingProcessActionDef[];
    defsById: Record<string, NestingProcessActionDef>;
}

export type SortingModeId = 'sort-inner-outer' | 'sort-left-right' | 'sort-top-bottom' | 'sort-bottom-top';
