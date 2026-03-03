/**
 * CAD Tool Panel Component
 *
 * Floating panel on the left side with icons for CAD drawing operations:
 * - Select, Pan, Zoom, Fit View
 * - Trim, Extend, Delete
 * - Undo, Redo
 */

import React, { useState, useRef } from 'react';
import { CADSubmenu } from './components/CADSubmenu';
import {
    DRAW_CIRCLE_SUBMENU_ITEMS,
    TOOLS,
    getCADToolPanelStyles,
    type CADToolPanelProps,
    type CADToolType,
    type ToolButton,
} from './CADToolPanel.config';

export type { CADToolPanelProps, CADToolType } from './CADToolPanel.config';

const CADToolPanel: React.FC<CADToolPanelProps> = ({
    activeTool,
    onToolSelect,
    onDelete,
    onTrim,
    onExtend,
    onExplode,
    onUndo,
    onRedo,
    onZoomIn,
    onZoomOut,
    onFitView,
    canUndo = false,
    canRedo = false,
    hasSelection = false,
    hasSingleSelection = false,
    hasEditableEntities = false,
    theme = 'dark',
    editToolsEnabled = true,
    showDrawTools = true,
    style,
}) => {
    const styles = React.useMemo(() => getCADToolPanelStyles(theme), [theme]);
    const [hoveredTool, setHoveredTool] = useState<CADToolType | null>(null);
    const [submenuOpen, setSubmenuOpen] = useState<CADToolType | null>(null);
    const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const handleToolClick = (tool: ToolButton, e: React.MouseEvent<HTMLButtonElement>) => {
        // For tools with submenu, clicking the main button activates the primary tool
        if (tool.hasSubmenu) {
            // Close any open submenu and activate the primary tool
            setSubmenuOpen(null);
            onToolSelect(tool.id); // e.g., 'draw-circle' activates circle drawing
            return;
        }

        switch (tool.id) {
            case 'delete':
                onDelete?.();
                break;
            case 'trim':
                if (onTrim) {
                    onTrim();
                } else {
                    onToolSelect('trim');
                }
                break;
            case 'extend':
                if (onExtend) {
                    onExtend();
                } else {
                    onToolSelect('extend');
                }
                break;
            case 'explode':
                onExplode?.();
                break;
            case 'undo':
                onUndo?.();
                break;
            case 'redo':
                onRedo?.();
                break;
            case 'zoom-in':
                onZoomIn?.();
                break;
            case 'zoom-out':
                onZoomOut?.();
                break;
            case 'fit-view':
                onFitView?.();
                break;
            default:
                onToolSelect(tool.id);
        }
    };

    const isToolDisabled = (tool: ToolButton): boolean => {
        switch (tool.id) {
            case 'delete':
                return !hasEditableEntities;
            case 'trim':
            case 'extend':
                return !hasEditableEntities;
            case 'explode':
                return !hasEditableEntities;
            case 'undo':
                return !canUndo;
            case 'redo':
                return !canRedo;
            default:
                return false;
        }
    };

    const renderToolButton = (tool: ToolButton) => {
        const isActive = activeTool === tool.id || (tool.id === 'draw-circle' && ['draw-circle', 'draw-ellipse', 'draw-arc', 'draw-arc-3pt'].includes(activeTool));
        const isDisabled = isToolDisabled(tool);
        const isHovered = hoveredTool === tool.id;

        return (
            <div key={tool.id} style={{ position: 'relative' }}>
                <button
                    ref={(el) => {
                        buttonRefs.current[tool.id] = el;
                    }}
                    style={{
                        ...styles.button,
                        ...(isActive ? styles.buttonActive : {}),
                        ...(isHovered && !isDisabled ? styles.buttonHover : {}),
                        ...(isDisabled ? styles.buttonDisabled : {}),
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        !isDisabled && handleToolClick(tool, e);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                    disabled={isDisabled}
                    title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                >
                    {tool.icon}

                    {/* Active Indicator Bar */}
                    {isActive && <div style={styles.activeIndicator} />}
                </button>

                {/* Submenu Indicator - separate clickable area */}
                {tool.hasSubmenu && (
                    <div
                        style={styles.submenuIndicator}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSubmenuOpen(submenuOpen === tool.id ? null : tool.id);
                        }}
                        title="更多选项"
                    >
                        <div style={styles.submenuArrow} />
                    </div>
                )}

                {/* Tooltip */}
                {isHovered && !submenuOpen && (
                    <div style={styles.tooltip}>
                        {tool.label}
                        {tool.shortcut && (
                            <span style={styles.shortcut}>{tool.shortcut}</span>
                        )}
                    </div>
                )}

                {/* Submenu */}
                {submenuOpen === tool.id && (
                    <CADSubmenu
                        items={DRAW_CIRCLE_SUBMENU_ITEMS}
                        onSelect={(t) => {
                            onToolSelect(t);
                            setSubmenuOpen(null);
                        }}
                        onClose={() => setSubmenuOpen(null)}
                        theme={theme}
                    />
                )}
            </div>
        );
    };

    const navigationTools = TOOLS.filter(t => t.group === 'navigation');
    const editTools = TOOLS.filter(t => t.group === 'edit');
    const drawTools = TOOLS.filter(t => t.group === 'draw');
    const historyTools = TOOLS.filter(t => t.group === 'history');

    return (
        <div style={{ ...styles.container, ...style }}>
            {/* Navigation Tools */}
            {navigationTools.map(renderToolButton)}

            <div style={styles.divider} />

            {/* Edit Tools */}
            {editToolsEnabled && (
                <>
                    {editTools.map(renderToolButton)}
                    <div style={styles.divider} />
                </>
            )}

            {/* Draw Tools */}
            {showDrawTools && (
                <>
                    {drawTools.map(renderToolButton)}
                    <div style={styles.divider} />
                </>
            )}

            {/* History Tools */}
            {historyTools.map(renderToolButton)}
        </div>
    );
};

export default CADToolPanel;
