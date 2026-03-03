/**
 * UndoRedoOverlay Component
 * 
 * Floating overlay with undo/redo buttons for CADView
 * Supports collapse/expand animation
 */

import React from 'react';

interface UndoRedoOverlayProps {
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const UndoRedoOverlay: React.FC<UndoRedoOverlayProps> = ({
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    position = 'top-left',
}) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const getPositionStyles = () => {
        const base = {
            position: 'absolute' as const,
            zIndex: 1000,
            display: 'flex',
            gap: '8px',
            padding: '8px',
            transition: 'transform 0.3s ease-in-out',
        };

        switch (position) {
            case 'top-left':
                return {
                    ...base,
                    top: '10px',
                    left: '10px',
                    transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)',
                };
            case 'top-right':
                return {
                    ...base,
                    top: '10px',
                    right: '10px',
                    transform: isCollapsed ? 'translateX(100%)' : 'translateX(0)',
                };
            case 'bottom-left':
                return {
                    ...base,
                    bottom: '10px',
                    left: '10px',
                    transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)',
                };
            case 'bottom-right':
                return {
                    ...base,
                    bottom: '10px',
                    right: '10px',
                    transform: isCollapsed ? 'translateX(100%)' : 'translateX(0)',
                };
            default:
                return {
                    ...base,
                    top: '10px',
                    left: '10px',
                    transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)',
                };
        }
    };

    const getExpandButtonPosition = () => {
        const base = {
            position: 'absolute' as const,
            zIndex: 1001,
            transition: 'opacity 0.3s ease-in-out',
            opacity: isCollapsed ? 1 : 0,
            pointerEvents: isCollapsed ? 'auto' as const : 'none' as const,
        };

        // Position expand button at edge where panel collapsed to
        switch (position) {
            case 'top-left':
            case 'bottom-left':
                return { ...base, top: '10px', left: '10px' };
            case 'top-right':
            case 'bottom-right':
                return { ...base, top: '10px', right: '10px' };
            default:
                return { ...base, top: '10px', left: '10px' };
        }
    };

    const buttonStyles = {
        base: {
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: '1px solid #4a4a4a',
            backgroundColor: 'rgba(42, 42, 42, 0.9)',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.2s',
            backdropFilter: 'blur(4px)',
        },
        disabled: {
            opacity: 0.3,
            cursor: 'not-allowed',
        },
        hover: {
            backgroundColor: 'rgba(58, 58, 58, 0.95)',
            borderColor: '#4a9eff',
        },
        collapse: {
            width: '28px',
            height: '28px',
            fontSize: '14px',
        },
    };

    const [undoHovered, setUndoHovered] = React.useState(false);
    const [redoHovered, setRedoHovered] = React.useState(false);
    const [collapseHovered, setCollapseHovered] = React.useState(false);
    const [expandHovered, setExpandHovered] = React.useState(false);

    const getCollapseIcon = () => {
        // Arrow direction depends on position
        switch (position) {
            case 'top-left':
            case 'bottom-left':
                return '«'; // Collapse to left
            case 'top-right':
            case 'bottom-right':
                return '»'; // Collapse to right
            default:
                return '«';
        }
    };

    const getExpandIcon = () => {
        // Arrow direction opposite of collapse
        switch (position) {
            case 'top-left':
            case 'bottom-left':
                return '»'; // Expand from left
            case 'top-right':
            case 'bottom-right':
                return '«'; // Expand from right
            default:
                return '»';
        }
    };

    return (
        <>
            {/* Main Panel */}
            <div style={getPositionStyles()}>
                {/* Undo Button */}
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="撤销 (Ctrl+Z)"
                    style={{
                        ...buttonStyles.base,
                        ...((!canUndo) ? buttonStyles.disabled : {}),
                        ...(undoHovered && canUndo ? buttonStyles.hover : {}),
                    }}
                    onMouseEnter={() => setUndoHovered(true)}
                    onMouseLeave={() => setUndoHovered(false)}
                >
                    ↶
                </button>

                {/* Redo Button */}
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="重做 (Ctrl+Shift+Z)"
                    style={{
                        ...buttonStyles.base,
                        ...((!canRedo) ? buttonStyles.disabled : {}),
                        ...(redoHovered && canRedo ? buttonStyles.hover : {}),
                    }}
                    onMouseEnter={() => setRedoHovered(true)}
                    onMouseLeave={() => setRedoHovered(false)}
                >
                    ↷
                </button>

                {/* Collapse Button */}
                <button
                    onClick={() => setIsCollapsed(true)}
                    title="收起面板"
                    style={{
                        ...buttonStyles.base,
                        ...buttonStyles.collapse,
                        ...(collapseHovered ? buttonStyles.hover : {}),
                    }}
                    onMouseEnter={() => setCollapseHovered(true)}
                    onMouseLeave={() => setCollapseHovered(false)}
                >
                    {getCollapseIcon()}
                </button>
            </div>

            {/* Expand Button (visible when collapsed) */}
            <button
                onClick={() => setIsCollapsed(false)}
                title="展开操作历史"
                style={{
                    ...buttonStyles.base,
                    ...buttonStyles.collapse,
                    ...getExpandButtonPosition(),
                    ...(expandHovered ? buttonStyles.hover : {}),
                }}
                onMouseEnter={() => setExpandHovered(true)}
                onMouseLeave={() => setExpandHovered(false)}
            >
                {getExpandIcon()}
            </button>
        </>
    );
};

export default UndoRedoOverlay;
