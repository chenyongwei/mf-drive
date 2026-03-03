import type React from 'react';
import type { DropdownItem as RibbonDropdownItem } from './RibbonDropdowns.types';

export type DropdownItem = RibbonDropdownItem;

export interface RibbonGroupProps {
    title: string;
    children: React.ReactNode;
    theme: 'dark' | 'light';
    showLabels?: boolean;
}

export interface RibbonButtonProps {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    onItemClick?: (id: string) => void;
    onItemPinToggle?: (id: string) => void;
    theme: 'dark' | 'light';
    size?: 'large' | 'small' | 'medium';
    active?: boolean;
    showLabel?: boolean;
    dropdownItems?: DropdownItem[];
}

export interface RibbonSplitButtonProps {
    label: string;
    icon?: React.ReactNode;
    theme: 'dark' | 'light';
    showLabel?: boolean;
    size?: 'large' | 'small' | 'medium';
    style?: React.CSSProperties;
    dropdownItems: DropdownItem[];
    onPrimaryClick?: () => void;
    onItemClick?: (id: string) => void;
    onItemPinToggle?: (id: string) => void;
    primaryDisabled?: boolean;
}
