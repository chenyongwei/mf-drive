/**
 * ScaleHandles - Visual overlay for interactive scaling
 * 
 * Renders 8 handles around selection bounding box with drag interaction
 */

import React, { useCallback, useMemo } from 'react';
import { ScaleHandleType } from '../hooks/useInteractiveScale';

interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface Viewport {
    zoom: number;
    pan: { x: number; y: number };
}

interface ScaleHandlesProps {
    selectionBBox: BoundingBox;
    viewport: Viewport;
    isScaling: boolean;
    scaleX: number;
    scaleY: number;
    scalePercentage: number;
    onHandleMouseDown: (handleType: ScaleHandleType, worldPoint: { x: number; y: number }) => void;
    theme?: 'dark' | 'light';
}

const HANDLE_SIZE = 8;
const HANDLE_OFFSET = HANDLE_SIZE / 2;

const handlePositions: { type: ScaleHandleType; getPos: (b: BoundingBox) => { x: number; y: number }; cursor: string }[] = [
    { type: 'top-left', getPos: b => ({ x: b.minX, y: b.maxY }), cursor: 'nwse-resize' },
    { type: 'top', getPos: b => ({ x: (b.minX + b.maxX) / 2, y: b.maxY }), cursor: 'ns-resize' },
    { type: 'top-right', getPos: b => ({ x: b.maxX, y: b.maxY }), cursor: 'nesw-resize' },
    { type: 'left', getPos: b => ({ x: b.minX, y: (b.minY + b.maxY) / 2 }), cursor: 'ew-resize' },
    { type: 'right', getPos: b => ({ x: b.maxX, y: (b.minY + b.maxY) / 2 }), cursor: 'ew-resize' },
    { type: 'bottom-left', getPos: b => ({ x: b.minX, y: b.minY }), cursor: 'nesw-resize' },
    { type: 'bottom', getPos: b => ({ x: (b.minX + b.maxX) / 2, y: b.minY }), cursor: 'ns-resize' },
    { type: 'bottom-right', getPos: b => ({ x: b.maxX, y: b.minY }), cursor: 'nwse-resize' },
];

const ScaleHandles: React.FC<ScaleHandlesProps> = ({
    selectionBBox,
    viewport,
    isScaling,
    scaleX,
    scaleY,
    scalePercentage,
    onHandleMouseDown,
    theme = 'dark',
}) => {
    const worldToScreen = useCallback((wx: number, wy: number) => ({
        x: wx * viewport.zoom + viewport.pan.x,
        y: wy * viewport.zoom + viewport.pan.y,
    }), [viewport]);

    const screenToWorld = useCallback((sx: number, sy: number) => ({
        x: (sx - viewport.pan.x) / viewport.zoom,
        y: (sy - viewport.pan.y) / viewport.zoom,
    }), [viewport]);

    // Calculate scaled bounding box for preview
    const scaledBBox = useMemo(() => {
        const cx = (selectionBBox.minX + selectionBBox.maxX) / 2;
        const cy = (selectionBBox.minY + selectionBBox.maxY) / 2;
        const halfW = (selectionBBox.maxX - selectionBBox.minX) / 2;
        const halfH = (selectionBBox.maxY - selectionBBox.minY) / 2;
        return {
            minX: cx - halfW * scaleX,
            maxX: cx + halfW * scaleX,
            minY: cy - halfH * scaleY,
            maxY: cy + halfH * scaleY,
        };
    }, [selectionBBox, scaleX, scaleY]);

    const displayBBox = isScaling ? scaledBBox : selectionBBox;

    // Screen coordinates for bounding box
    const screenTopLeft = worldToScreen(displayBBox.minX, displayBBox.maxY);
    const screenBottomRight = worldToScreen(displayBBox.maxX, displayBBox.minY);
    const screenWidth = screenBottomRight.x - screenTopLeft.x;
    const screenHeight = screenBottomRight.y - screenTopLeft.y;

    const handleMouseDown = useCallback((
        e: React.MouseEvent,
        handleType: ScaleHandleType
    ) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.target as HTMLElement).closest('[data-scale-container]')?.getBoundingClientRect();
        if (!rect) return;
        const worldPoint = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        onHandleMouseDown(handleType, worldPoint);
    }, [screenToWorld, onHandleMouseDown]);

    const colors = theme === 'dark'
        ? { border: '#4A9EFF', handle: '#4A9EFF', handleBg: '#1a1a2e', text: '#fff' }
        : { border: '#0066cc', handle: '#0066cc', handleBg: '#fff', text: '#333' };

    return (
        <div
            data-scale-container
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 50,
            }}
        >
            {/* Bounding box outline */}
            <div
                style={{
                    position: 'absolute',
                    left: screenTopLeft.x,
                    top: screenTopLeft.y,
                    width: Math.abs(screenWidth),
                    height: Math.abs(screenHeight),
                    border: `1px dashed ${colors.border}`,
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                }}
            />

            {/* Scale handles */}
            {handlePositions.map(({ type, getPos, cursor }) => {
                const worldPos = getPos(displayBBox);
                const screenPos = worldToScreen(worldPos.x, worldPos.y);

                return (
                    <div
                        key={type}
                        onMouseDown={e => handleMouseDown(e, type)}
                        style={{
                            position: 'absolute',
                            left: screenPos.x - HANDLE_OFFSET,
                            top: screenPos.y - HANDLE_OFFSET,
                            width: HANDLE_SIZE,
                            height: HANDLE_SIZE,
                            backgroundColor: colors.handleBg,
                            border: `2px solid ${colors.handle}`,
                            borderRadius: 2,
                            cursor,
                            pointerEvents: 'auto',
                            transition: 'transform 0.1s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                );
            })}

            {/* Scale percentage indicator */}
            {isScaling && (
                <div
                    style={{
                        position: 'absolute',
                        left: screenTopLeft.x + screenWidth / 2,
                        top: screenTopLeft.y - 28,
                        transform: 'translateX(-50%)',
                        backgroundColor: colors.border,
                        color: colors.text,
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                >
                    {scalePercentage}%
                </div>
            )}
        </div>
    );
};

export default ScaleHandles;
