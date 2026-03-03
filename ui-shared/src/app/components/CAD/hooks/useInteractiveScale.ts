/**
 * useInteractiveScale - Hook for managing interactive scaling of CAD entities
 * 
 * Provides drag-based scaling with:
 * - Uniform scaling (corner handles)
 * - Non-uniform scaling (edge handles)
 * - Real-time preview
 */

import { useState, useCallback, useRef } from 'react';

export type ScaleHandleType =
    | 'top-left' | 'top' | 'top-right'
    | 'left' | 'right'
    | 'bottom-left' | 'bottom' | 'bottom-right';

export interface ScaleDragState {
    isScaling: boolean;
    handleType: ScaleHandleType | null;
    startPoint: { x: number; y: number } | null;
    currentPoint: { x: number; y: number } | null;
    scaleX: number;
    scaleY: number;
    origin: { x: number; y: number };
}

interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface UseInteractiveScaleProps {
    selectionBBox: BoundingBox | null;
    onScaleChange?: (sx: number, sy: number, origin: { x: number; y: number }) => void;
    onScaleComplete?: (sx: number, sy: number, origin: { x: number; y: number }) => void;
    onScaleCancel?: () => void;
}

const initialState: ScaleDragState = {
    isScaling: false,
    handleType: null,
    startPoint: null,
    currentPoint: null,
    scaleX: 1,
    scaleY: 1,
    origin: { x: 0, y: 0 },
};

export function useInteractiveScale(props: UseInteractiveScaleProps) {
    const { selectionBBox, onScaleChange, onScaleComplete, onScaleCancel } = props;
    const [dragState, setDragState] = useState<ScaleDragState>(initialState);
    const stateRef = useRef(dragState);
    stateRef.current = dragState;

    const calculateScaleFromDrag = useCallback((
        handleType: ScaleHandleType,
        startPoint: { x: number; y: number },
        currentPoint: { x: number; y: number },
        bbox: BoundingBox
    ): { sx: number; sy: number } => {
        const width = bbox.maxX - bbox.minX;
        const height = bbox.maxY - bbox.minY;
        const centerX = (bbox.minX + bbox.maxX) / 2;
        const centerY = (bbox.minY + bbox.maxY) / 2;

        const dx = currentPoint.x - startPoint.x;
        const dy = currentPoint.y - startPoint.y;

        let sx = 1, sy = 1;

        // Calculate scale based on handle type
        switch (handleType) {
            case 'top-left':
                sx = Math.max(0.1, 1 - (2 * dx) / width);
                sy = Math.max(0.1, 1 + (2 * dy) / height);
                break;
            case 'top-right':
                sx = Math.max(0.1, 1 + (2 * dx) / width);
                sy = Math.max(0.1, 1 + (2 * dy) / height);
                break;
            case 'bottom-left':
                sx = Math.max(0.1, 1 - (2 * dx) / width);
                sy = Math.max(0.1, 1 - (2 * dy) / height);
                break;
            case 'bottom-right':
                sx = Math.max(0.1, 1 + (2 * dx) / width);
                sy = Math.max(0.1, 1 - (2 * dy) / height);
                break;
            case 'top':
                sy = Math.max(0.1, 1 + (2 * dy) / height);
                break;
            case 'bottom':
                sy = Math.max(0.1, 1 - (2 * dy) / height);
                break;
            case 'left':
                sx = Math.max(0.1, 1 - (2 * dx) / width);
                break;
            case 'right':
                sx = Math.max(0.1, 1 + (2 * dx) / width);
                break;
        }

        // For corner handles, make uniform scaling (use average)
        if (['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(handleType)) {
            const avg = (sx + sy) / 2;
            sx = avg;
            sy = avg;
        }

        return { sx, sy };
    }, []);

    const startScaling = useCallback((
        handleType: ScaleHandleType,
        worldPoint: { x: number; y: number }
    ) => {
        if (!selectionBBox) return;

        const origin = {
            x: (selectionBBox.minX + selectionBBox.maxX) / 2,
            y: (selectionBBox.minY + selectionBBox.maxY) / 2,
        };

        setDragState({
            isScaling: true,
            handleType,
            startPoint: worldPoint,
            currentPoint: worldPoint,
            scaleX: 1,
            scaleY: 1,
            origin,
        });
    }, [selectionBBox]);

    const updateScaling = useCallback((worldPoint: { x: number; y: number }) => {
        const state = stateRef.current;
        if (!state.isScaling || !state.handleType || !state.startPoint || !selectionBBox) return;

        const { sx, sy } = calculateScaleFromDrag(
            state.handleType,
            state.startPoint,
            worldPoint,
            selectionBBox
        );

        setDragState(prev => ({
            ...prev,
            currentPoint: worldPoint,
            scaleX: sx,
            scaleY: sy,
        }));

        onScaleChange?.(sx, sy, state.origin);
    }, [selectionBBox, calculateScaleFromDrag, onScaleChange]);

    const completeScaling = useCallback(() => {
        const state = stateRef.current;
        if (!state.isScaling) return;

        onScaleComplete?.(state.scaleX, state.scaleY, state.origin);
        setDragState(initialState);
    }, [onScaleComplete]);

    const cancelScaling = useCallback(() => {
        setDragState(initialState);
        onScaleCancel?.();
    }, [onScaleCancel]);

    return {
        dragState,
        startScaling,
        updateScaling,
        completeScaling,
        cancelScaling,
        isScaling: dragState.isScaling,
        scalePercentage: Math.round(((dragState.scaleX + dragState.scaleY) / 2) * 100),
    };
}
