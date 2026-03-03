import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DropdownMenu } from './RibbonShared.dropdown';
import type { RibbonButtonProps, RibbonSplitButtonProps } from './RibbonShared.types';

export const RibbonButton: React.FC<
    RibbonButtonProps & { style?: React.CSSProperties; hasDropdown?: boolean; highlightColor?: string }
> = ({
    label,
    icon,
    onClick,
    onItemClick,
    onItemPinToggle,
    theme,
    size = 'large',
    showLabel = true,
    dropdownItems,
    style,
    hasDropdown,
    highlightColor,
}) => {
    const [hovered, setHovered] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isLarge = size === 'large';
    const showText = showLabel;

    const updateRect = () => {
        if (containerRef.current) {
            setRect(containerRef.current.getBoundingClientRect());
        }
    };

    useLayoutEffect(() => {
        if (isDropdownOpen) {
            updateRect();
            window.addEventListener('resize', updateRect);
            window.addEventListener('scroll', updateRect, true);
        }
        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            const clickedInsidePortal = Boolean(target?.closest?.('[data-ribbon-dropdown-menu="true"]'));
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node) &&
                !clickedInsidePortal
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const isGold = highlightColor === 'gold' || isDropdownOpen;
    const goldBorder = theme === 'dark' ? '#ff8c00' : '#ffd54f';

    const buttonStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: isLarge ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isLarge ? 'center' : 'flex-start',
        gap: isLarge ? '4px' : '6px',
        padding: isLarge ? (showText ? '4px 8px' : '4px 4px') : '1px 4px',
        background: isGold
            ? (theme === 'dark' ? '#ff9800' : '#ffda44')
            : (highlightColor || (hovered ? (theme === 'dark' ? '#333' : '#f0f0f0') : 'transparent')),
        border: isGold
            ? `1px solid ${goldBorder}`
            : (highlightColor ? '1px solid rgba(0,0,0,0.1)' : '1px solid transparent'),
        borderRadius: '3px',
        cursor: 'pointer',
        color: isGold ? '#000' : (theme === 'dark' ? '#eee' : '#333'),
        transition: 'all 0.1s',
        minWidth: isLarge ? (showText ? '54px' : '36px') : (showLabel ? '70px' : '24px'),
        height: isLarge ? '100%' : '20px',
        outline: 'none',
    };

    return (
        <div
            ref={containerRef}
            style={{
                height: isLarge ? '100%' : 'auto',
                position: 'relative',
                display: 'flex',
                zIndex: isGold || hovered ? 10 : 1,
            }}
        >
            <button
                style={{ ...buttonStyle, ...style, border: 'none' }}
                onClick={() => {
                    if (dropdownItems) {
                        setIsDropdownOpen(!isDropdownOpen);
                    } else {
                        onClick?.();
                    }
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                title={!showText ? label : ''}
            >
                {icon && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: isLarge ? '32px' : '18px',
                            height: isLarge ? '32px' : '18px',
                            flexShrink: 0,
                            marginBottom: (isLarge && showText) ? '4px' : 0,
                        }}
                    >
                        {icon}
                    </div>
                )}
                {showText && <span style={{ fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 500 }}>{label}</span>}
                {hasDropdown && showLabel && <span style={{ fontSize: '9px', marginLeft: 'auto', opacity: 0.6 }}>▼</span>}
            </button>
            {isDropdownOpen && dropdownItems && rect && (
                <DropdownMenu
                    items={dropdownItems}
                    theme={theme}
                    rect={rect}
                    onClose={() => setIsDropdownOpen(false)}
                    onItemClick={onItemClick}
                    onItemPinToggle={onItemPinToggle}
                />
            )}
        </div>
    );
};

export const RibbonSplitButton: React.FC<RibbonSplitButtonProps> = ({
    label,
    icon,
    theme,
    showLabel = true,
    size = 'small',
    style,
    dropdownItems,
    onPrimaryClick,
    onItemClick,
    onItemPinToggle,
    primaryDisabled = false,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const compact = size !== 'large';

    const updateRect = () => {
        if (containerRef.current) {
            setRect(containerRef.current.getBoundingClientRect());
        }
    };

    useLayoutEffect(() => {
        if (!isDropdownOpen) {
            return undefined;
        }
        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);
        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            const clickedInsidePortal = Boolean(target?.closest?.('[data-ribbon-dropdown-menu="true"]'));
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                !clickedInsidePortal
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const baseBackground = isDropdownOpen
        ? (theme === 'dark' ? '#2f3a25' : '#e8f7e8')
        : (isHovered ? (theme === 'dark' ? '#333' : '#f0f0f0') : 'transparent');
    const borderColor = theme === 'dark' ? '#4a4a4a' : '#d1d5db';
    const textColor = theme === 'dark' ? '#eee' : '#333';
    const buttonHeight = compact ? 24 : 30;
    const iconSize = compact ? 16 : 18;

    const handlePrimaryClick = () => {
        if (!primaryDisabled && onPrimaryClick) {
            onPrimaryClick();
            return;
        }
        setIsDropdownOpen(true);
    };

    return (
        <div
            ref={containerRef}
            style={{
                display: 'inline-flex',
                alignItems: 'stretch',
                border: `1px solid ${borderColor}`,
                borderRadius: 4,
                overflow: 'hidden',
                background: baseBackground,
                color: textColor,
                ...style,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                type="button"
                onClick={handlePrimaryClick}
                title={!showLabel ? label : ''}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: buttonHeight,
                    minWidth: showLabel ? 72 : 28,
                    padding: showLabel ? '0 8px' : '0 6px',
                    border: 'none',
                    borderRight: `1px solid ${borderColor}`,
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                }}
            >
                {icon && (
                    <span
                        style={{
                            width: `${iconSize}px`,
                            height: `${iconSize}px`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </span>
                )}
                {showLabel && <span>{label}</span>}
            </button>
            <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-label={`${label} 菜单`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: buttonHeight,
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '10px',
                    opacity: 0.8,
                }}
            >
                ▼
            </button>
            {isDropdownOpen && rect && (
                <DropdownMenu
                    items={dropdownItems}
                    theme={theme}
                    rect={rect}
                    onClose={() => setIsDropdownOpen(false)}
                    onItemClick={onItemClick}
                    onItemPinToggle={onItemPinToggle}
                />
            )}
        </div>
    );
};
