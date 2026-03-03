/**
 * useMouseHandlers - Extracted mouse event handling logic
 */

import { useCallback, useEffect, useRef } from 'react';

interface Viewport {
    zoom: number;
    pan: { x: number; y: number };
}

import { SnapPoint } from './useSnapping';

interface UseMouseHandlersProps {
    viewport: Viewport;
    setViewport: (v: Viewport) => void;
    activeTool: string;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    isNestingMode: boolean;
    // Callbacks
    snapPoint: SnapPoint | null;
    findNearestSnapPoint: (x: number, y: number) => SnapPoint | null;
    handleDrawingClick: (x: number, y: number, snap: SnapPoint | null) => void;
    handleDrawingMove: (x: number, y: number, snap: SnapPoint | null) => void;
    boxSelection: {
        handleMouseDown: (e: React.MouseEvent) => void;
        handleMouseMove: (e: React.MouseEvent) => void;
        handleMouseUp: (e: React.MouseEvent) => void;
        handleMouseLeave: (e: React.MouseEvent) => void;
    };
    findEntityAtPosition: (x: number, y: number) => string | null;
    hoveredEntityId: string | null;
    onEntityHover: (id: string | null) => void;
    onPartClick?: (id: string | null, isCtrlPressed: boolean) => void;
    onPartDragStart?: (e: React.MouseEvent, id: string) => void;
    onPartDragMove?: (e: React.MouseEvent) => void;
    onPartDragEnd?: () => void;
    findPartAtPosition?: (x: number, y: number) => string | null;
    isStickyPlacementActive?: boolean;
    onStickyPlacementMove?: (payload: {
        clientPoint: { x: number; y: number };
        worldPoint: { x: number; y: number };
    }) => void;
    onStickyPlacementCommit?: (payload: {
        clientPoint: { x: number; y: number };
        worldPoint: { x: number; y: number };
    }) => boolean;
}

export function useMouseHandlers(props: UseMouseHandlersProps) {
    const {
        viewport, setViewport, activeTool, canvasRef, containerRef,
        isNestingMode, snapPoint, findNearestSnapPoint,
        handleDrawingClick, handleDrawingMove, boxSelection,
        findEntityAtPosition, hoveredEntityId, onEntityHover,
        onPartClick, onPartDragStart, onPartDragMove, onPartDragEnd, findPartAtPosition,
        isStickyPlacementActive = false,
        onStickyPlacementMove,
        onStickyPlacementCommit,
    } = props;

    const isPanningRef = useRef(false);
    const isSpacePressedRef = useRef(false);
    const isTemporaryPanRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code !== 'Space') {
                return;
            }

            const target = event.target as HTMLElement | null;
            const tagName = (target?.tagName ?? '').toUpperCase();
            const isEditableTarget =
                tagName === 'INPUT' ||
                tagName === 'TEXTAREA' ||
                Boolean(target?.isContentEditable);

            if (isEditableTarget) {
                return;
            }

            isSpacePressedRef.current = true;
            event.preventDefault();
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code !== 'Space') {
                return;
            }
            isSpacePressedRef.current = false;
            if (isTemporaryPanRef.current && activeTool !== 'pan') {
                isTemporaryPanRef.current = false;
                isPanningRef.current = false;
            }
        };

        const handleWindowBlur = () => {
            isSpacePressedRef.current = false;
            if (activeTool !== 'pan') {
                isTemporaryPanRef.current = false;
                isPanningRef.current = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [activeTool]);

    const screenToWorld = useCallback((clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return null;
        return {
            x: (clientX - rect.left - viewport.pan.x) / viewport.zoom,
            y: (clientY - rect.top - viewport.pan.y) / viewport.zoom,
        };
    }, [canvasRef, viewport]);

    const supportsEntityPick =
        activeTool === 'select' ||
        activeTool === 'trim' ||
        activeTool === 'extend' ||
        activeTool === 'delete' ||
        activeTool === 'explode';

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent drawing/selecting when clicking on UI elements outside the canvas area
        // Check if the click target is the canvas itself or the container div
        const target = e.target as HTMLElement;
        const isCanvasOrContainer = target === canvasRef.current || target === containerRef.current;
        console.log(`[Mouse] Down. Target: ${target.tagName}, IsCanvasOrContainer: ${isCanvasOrContainer}, ActiveTool: ${activeTool}`);

        if (!isCanvasOrContainer) {
            console.log('[Mouse] Click ignored - invalid target');
            return;
        }

        if (isSpacePressedRef.current && e.button === 0) {
            isPanningRef.current = true;
            isTemporaryPanRef.current = true;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        const isCtrlPressed = e.ctrlKey || e.metaKey;

        if (isNestingMode) {
            if (isStickyPlacementActive && e.button === 0) {
                return;
            }
            const world = screenToWorld(e.clientX, e.clientY);
            if (world && findPartAtPosition) {
                const partId = findPartAtPosition(world.x, world.y);
                onPartClick?.(partId, isCtrlPressed);
                if (partId) onPartDragStart?.(e, partId);
            }
            return;
        }
        if (activeTool === 'pan') {
            isPanningRef.current = true;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            return;
        }
        if (activeTool.startsWith('draw-')) {
            const world = screenToWorld(e.clientX, e.clientY);
            if (world) {
                // Find snap point for drawing tools (this works in both drawing and nesting mode)
                const snap = findNearestSnapPoint ? findNearestSnapPoint(world.x, world.y) : snapPoint;
                handleDrawingClick(world.x, world.y, snap);
            }
            return;
        }
        if (supportsEntityPick) {
            boxSelection.handleMouseDown(e);
        }
    }, [isNestingMode, isStickyPlacementActive, activeTool, supportsEntityPick, screenToWorld, handleDrawingClick, snapPoint, findNearestSnapPoint, boxSelection, canvasRef, containerRef, findPartAtPosition, onPartClick, onPartDragStart]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanningRef.current && (activeTool === 'pan' || isTemporaryPanRef.current)) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            setViewport({ zoom: viewport.zoom, pan: { x: viewport.pan.x + dx, y: viewport.pan.y + dy } });
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // Handle part drag move in nesting mode
        if (isNestingMode && !isStickyPlacementActive) {
            onPartDragMove?.(e);
        }

        const world = screenToWorld(e.clientX, e.clientY);
        if (world) {
            if (isNestingMode && isStickyPlacementActive) {
                onStickyPlacementMove?.({
                    clientPoint: { x: e.clientX, y: e.clientY },
                    worldPoint: world,
                });
            }
            if (supportsEntityPick) {
                let hitId = findEntityAtPosition(world.x, world.y);

                // In nesting mode, check for parts if no entity found (or to return part ID)
                // We prefer part interactions in nesting mode
                if (isNestingMode && findPartAtPosition) {
                    const partId = findPartAtPosition(world.x, world.y);
                    if (partId) hitId = partId;
                }

                if (hitId !== hoveredEntityId) {
                    onEntityHover(hitId);
                }
            }
            if (activeTool.startsWith('draw-')) {
                handleDrawingMove(world.x, world.y, findNearestSnapPoint(world.x, world.y));
            }
        }
        boxSelection.handleMouseMove(e);
    }, [activeTool, supportsEntityPick, viewport, setViewport, screenToWorld, findEntityAtPosition, hoveredEntityId, onEntityHover, handleDrawingMove, findNearestSnapPoint, boxSelection, isNestingMode, isStickyPlacementActive, onPartDragMove, findPartAtPosition, onStickyPlacementMove]);

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanningRef.current && (activeTool === 'pan' || isTemporaryPanRef.current)) {
            isPanningRef.current = false;
            isTemporaryPanRef.current = false;
            return;
        }

        if (isNestingMode && isStickyPlacementActive && e.button === 0) {
            const world = screenToWorld(e.clientX, e.clientY);
            if (world) {
                onStickyPlacementCommit?.({
                    clientPoint: { x: e.clientX, y: e.clientY },
                    worldPoint: world,
                });
            }
            return;
        }

        // Handle part drag end in nesting mode
        if (isNestingMode) {
            onPartDragEnd?.();
        }
        boxSelection.handleMouseUp(e);
    }, [activeTool, boxSelection, isNestingMode, isStickyPlacementActive, onPartDragEnd, onStickyPlacementCommit, screenToWorld]);

    const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (activeTool === 'pan' || isTemporaryPanRef.current) {
            isPanningRef.current = false;
            isTemporaryPanRef.current = false;
        }
        boxSelection.handleMouseLeave(e);
        onEntityHover(null);
    }, [activeTool, boxSelection, onEntityHover]);

    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = viewport.zoom * factor;
        const worldX = (mouseX - viewport.pan.x) / viewport.zoom;
        const worldY = (mouseY - viewport.pan.y) / viewport.zoom;
        setViewport({ zoom: newZoom, pan: { x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom } });
    }, [containerRef, viewport, setViewport]);

    return { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleMouseLeave, screenToWorld };
}
