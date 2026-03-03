import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from './NestingRibbonIcons';
import type { DropdownItem } from './RibbonShared.types';

const DropdownInlineNumberInputControl: React.FC<{
    config: NonNullable<DropdownItem['inlineNumberInput']>;
    theme: 'dark' | 'light';
    onAction?: (id: string) => void;
    active?: boolean;
}> = ({ config, theme, onAction, active = false }) => {
    const [draftValue, setDraftValue] = useState<string>(String(config.value));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setDraftValue(String(config.value));
        }
    }, [config.value, isFocused]);

    const clampValue = (raw: number): number => {
        if (!Number.isFinite(raw)) return config.value;
        let next = raw;
        if (typeof config.min === 'number') next = Math.max(config.min, next);
        if (typeof config.max === 'number') next = Math.min(config.max, next);
        if (typeof config.step === 'number' && config.step > 0) {
            next = Math.round(next / config.step) * config.step;
        }
        return Number(next.toFixed(3));
    };

    const emitChange = (raw: number) => {
        const normalized = clampValue(raw);
        onAction?.(`${config.actionPrefix}${normalized}`);
    };

    const textColor = active
        ? (config.checkedTextColor ?? '#00e68a')
        : (config.textColor ?? (theme === 'dark' ? '#b8b8b8' : '#555'));

    return (
        <div
            data-dropdown-inline-input="true"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: '6px',
                opacity: config.disabled ? 0.45 : 1,
            }}
        >
            <input
                type="number"
                value={draftValue}
                min={config.min}
                max={config.max}
                step={config.step ?? 1}
                disabled={config.disabled}
                onFocus={(event) => {
                    setIsFocused(true);
                    event.currentTarget.select();
                }}
                onChange={(event) => {
                    const next = event.target.value;
                    setDraftValue(next);
                    const parsed = Number.parseFloat(next);
                    if (!Number.isNaN(parsed)) {
                        emitChange(parsed);
                    }
                }}
                onBlur={() => {
                    setIsFocused(false);
                    const parsed = Number.parseFloat(draftValue);
                    const fallback = Number.isFinite(parsed) ? parsed : config.value;
                    const normalized = clampValue(fallback);
                    setDraftValue(String(normalized));
                    emitChange(normalized);
                }}
                onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === 'Enter') {
                        (event.currentTarget as HTMLInputElement).blur();
                    }
                    if (event.key === 'Escape') {
                        setDraftValue(String(config.value));
                        (event.currentTarget as HTMLInputElement).blur();
                    }
                }}
                style={{
                    width: '48px',
                    height: '28px',
                    padding: '0 6px',
                    borderRadius: '4px',
                    border: `1px solid ${theme === 'dark' ? '#5c6066' : '#bfc4cb'}`,
                    background: theme === 'dark' ? '#3a3d42' : '#ffffff',
                    color: theme === 'dark' ? '#f7f9fb' : '#1f2937',
                    fontSize: '12px',
                    outline: 'none',
                }}
            />
            <span style={{ color: textColor, fontSize: '12px', whiteSpace: 'nowrap' }}>
                {config.suffix ?? 'mm'}
            </span>
        </div>
    );
};

export const DropdownMenu: React.FC<{
    items: DropdownItem[];
    theme: 'dark' | 'light';
    onClose: () => void;
    onItemClick?: (id: string) => void;
    onItemPinToggle?: (id: string) => void;
    rect?: DOMRect;
    level?: number;
}> = ({ items, theme, onClose, onItemClick, onItemPinToggle, rect, level = 0 }) => {
    const [activeSubMenu, setActiveSubMenu] = useState<{ id: string; rect: DOMRect } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const shouldAlignRight = rect && level === 0 && (rect.left + 180 > windowWidth - 20);

    const style: React.CSSProperties = {
        position: 'fixed',
        top: rect ? (level === 0 ? rect.bottom + 2 : rect.top) : 0,
        left: shouldAlignRight ? 'auto' : (rect ? (level === 0 ? rect.left : rect.right) : 0),
        right: shouldAlignRight && rect ? windowWidth - rect.right : 'auto',
        zIndex: 10000 + level,
        background: theme === 'dark' ? '#2a2a2a' : '#fff',
        border: theme === 'dark' ? '1px solid #4a4a4a' : '1px solid #ccc',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        borderRadius: '2px',
        minWidth: '180px',
        padding: '2px 0',
        color: theme === 'dark' ? '#eee' : '#333',
    };

    return createPortal(
        <div
            ref={menuRef}
            data-ribbon-dropdown-menu="true"
            style={style}
            onMouseLeave={() => level > 0 && setActiveSubMenu(null)}
        >
            {items.map((item) => (
                item.isSeparator ? (
                    <div
                        key={item.id}
                        style={{
                            height: '1px',
                            background: theme === 'dark' ? '#3a3a3a' : '#eee',
                            margin: '2px 0',
                        }}
                    />
                ) : (
                    <div
                        key={item.id}
                        role="menuitem"
                        data-dropdown-item={item.id}
                        data-item-id={item.id}
                        onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('[data-dropdown-inline-input="true"]')) {
                                return;
                            }
                            if (target.closest('[data-dropdown-pin-toggle="true"]')) {
                                return;
                            }
                            if (item.children || item.disabled) return;
                            e.stopPropagation();
                            onItemClick?.(item.id);
                            onClose();
                        }}
                        onMouseEnter={(e) => {
                            if (item.disabled) return;
                            if (item.children) {
                                setActiveSubMenu({ id: item.id, rect: e.currentTarget.getBoundingClientRect() });
                            } else {
                                setActiveSubMenu(null);
                            }
                            e.currentTarget.style.background = theme === 'dark' ? '#3a3a3a' : '#f0f0f0';
                        }}
                        onMouseLeave={(e) => {
                            if (item.disabled) return;
                            if (!activeSubMenu || activeSubMenu.id !== item.id) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 10px',
                            cursor: item.disabled ? 'default' : 'pointer',
                            fontSize: '12px',
                            gap: '8px',
                            position: 'relative',
                            opacity: item.disabled ? 0.4 : 1,
                            color: item.disabled ? (theme === 'dark' ? '#666' : '#aaa') : 'inherit',
                        }}
                    >
                        <div
                            style={{
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '8px',
                                borderRadius: '2px',
                                border: item.checked ? '1px solid #faad14' : 'none',
                                background: item.checked ? '#fff7e6' : 'transparent',
                            }}
                        >
                            {item.checked && <Icons.CheckIcon />}
                            {!item.checked && item.icon}
                        </div>
                        <span
                            style={{
                                flex: item.inlineNumberInput ? '0 0 auto' : 1,
                                color: item.checked && item.checkedLabelColor ? item.checkedLabelColor : 'inherit',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {item.label}
                        </span>
                        {item.isVIP && (
                            <div style={{ marginLeft: '4px' }}>
                                <Icons.VIPIcon />
                            </div>
                        )}
                        {item.inlineNumberInput && (
                            <DropdownInlineNumberInputControl
                                config={item.inlineNumberInput}
                                theme={theme}
                                onAction={onItemClick}
                                active={Boolean(item.checked)}
                            />
                        )}
                        {item.shortcut && <span style={{ opacity: 0.5, fontSize: '10px', marginLeft: '8px' }}>{item.shortcut}</span>}
                        {!item.children && item.pinnable && !item.disabled && (
                            <button
                                type="button"
                                data-dropdown-pin-toggle="true"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onItemPinToggle?.(item.id);
                                }}
                                style={{
                                    marginLeft: '8px',
                                    border: item.pinned
                                        ? `1px solid ${theme === 'dark' ? '#f59e0b' : '#d97706'}`
                                        : `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
                                    background: item.pinned
                                        ? (theme === 'dark' ? 'rgba(245,158,11,0.16)' : 'rgba(245,158,11,0.12)')
                                        : 'transparent',
                                    color: theme === 'dark' ? '#e5e7eb' : '#374151',
                                    borderRadius: '999px',
                                    padding: '1px 8px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {item.pinLabel ?? (item.pinned ? '取消固定' : '固定')}
                            </button>
                        )}
                        {item.children && <span style={{ opacity: 0.5, fontSize: '10px' }}>▶</span>}

                        {activeSubMenu && activeSubMenu.id === item.id && item.children && (
                            <DropdownMenu
                                items={item.children}
                                theme={theme}
                                rect={activeSubMenu.rect}
                                onClose={onClose}
                                onItemClick={onItemClick}
                                onItemPinToggle={onItemPinToggle}
                                level={level + 1}
                            />
                        )}
                    </div>
                )
            ))}
        </div>,
        document.body,
    );
};
