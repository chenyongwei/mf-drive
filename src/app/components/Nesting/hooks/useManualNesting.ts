import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CollisionDetectionEngine, Part, Point } from '../../../lib/webgpu/CollisionDetectionEngine';
import { Entity } from '../../../lib/webgpu/EntityToVertices';
import type {
    DragPosition,
    NestedPart,
    UseManualNestingProps,
} from './useManualNesting.types';

export type {
    Material,
    NestedPart,
    Viewport,
    DragPosition,
    UseManualNestingProps,
} from './useManualNesting.types';

export function useManualNesting({
    material,
    parts,
    viewport,
    onPartsChange,
    onUtilizationChange,
    containerRef,
}: UseManualNestingProps) {
    // Collision detection engine
    const collisionEngineRef = useRef<CollisionDetectionEngine | null>(null);

    // RAF throttling
    const rafIdRef = useRef<number | null>(null);
    const pendingMoveRef = useRef<{ x: number; y: number } | null>(null);

    // Dragging state
    const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
    const dragStateRef = useRef<{
        partId: string;
        startX: number;
        startY: number;
        initialPosition: Point;
        part: NestedPart;
    } | null>(null);

    const convertToCollisionPart = (part: NestedPart): Part => ({
        id: part.id,
        outerContour: part.outerContour,
        innerContours: part.innerContours,
        boundingBox: part.boundingBox,
        position: part.position,
        rotation: part.rotation,
    });

    // Initialize collision engine
    useEffect(() => {
        const engine = new CollisionDetectionEngine({
            width: material.width + 1000,
            height: material.height + 1000,
        });
        parts.forEach(part => engine.addPart(convertToCollisionPart(part)));
        collisionEngineRef.current = engine;
        return () => { collisionEngineRef.current = null; };
    }, [material.width, material.height]);

    // Update collision engine when parts change
    useEffect(() => {
        if (!collisionEngineRef.current || dragPosition) return;
        parts.forEach(part => {
            collisionEngineRef.current!.updatePartTransform(part.id, part.position, part.rotation);
        });

        // Calculate utilization
        if (material && parts.length) {
            const materialArea = material.width * material.height;
            const partsArea = parts.reduce((sum, part) => {
                const bbox = part.boundingBox;
                return sum + (bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY);
            }, 0);
            onUtilizationChange?.((partsArea / materialArea) * 100);
        } else {
            onUtilizationChange?.(0);
        }
    }, [parts, dragPosition, material, onUtilizationChange]);


    // Transform entities helper - memoized per entity
    const transformEntities = useCallback((entities: Entity[], position: Point, rotation: number, fileId?: string): Entity[] => {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const transformPoint = (p: { x: number; y: number }) => ({
            x: cos * p.x - sin * p.y + position.x,
            y: sin * p.x + cos * p.y + position.y,
        });

        return entities.map(entity => {
            const geometry = entity.geometry;
            if (!geometry) return { ...entity, fileId: fileId || entity.fileId };

            return {
                ...entity,
                fileId: fileId || entity.fileId,
                geometry: {
                    ...geometry,
                    points: geometry.points?.map(transformPoint),
                    start: geometry.start ? transformPoint(geometry.start) : undefined,
                    end: geometry.end ? transformPoint(geometry.end) : undefined,
                    center: geometry.center ? transformPoint(geometry.center) : undefined,
                },
            };
        });
    }, []);

    // Handle mouse down (start drag)
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - viewport.pan.x) / viewport.zoom;
        const worldY = (e.clientY - rect.top - viewport.pan.y) / viewport.zoom;

        // Find clicked part
        const clickedPart = parts.find(part => {
            const bbox = part.boundingBox;
            return (
                worldX >= bbox.minX + part.position.x &&
                worldX <= bbox.maxX + part.position.x &&
                worldY >= bbox.minY + part.position.y &&
                worldY <= bbox.maxY + part.position.y
            );
        });

        if (clickedPart) {
            dragStateRef.current = {
                partId: clickedPart.id,
                startX: e.clientX,
                startY: e.clientY,
                initialPosition: { ...clickedPart.position },
                part: clickedPart,
            };
            setDragPosition({ partId: clickedPart.id, position: clickedPart.position });
        }
    }, [viewport, parts, containerRef]);

    // Handle drag with RAF throttling
    useEffect(() => {
        if (!dragPosition || !dragStateRef.current) return;

        const processDragUpdate = () => {
            if (pendingMoveRef.current && dragStateRef.current) {
                const { startX, startY, initialPosition } = dragStateRef.current;
                const { x: clientX, y: clientY } = pendingMoveRef.current;

                const newPosition: Point = {
                    x: initialPosition.x + (clientX - startX) / viewport.zoom,
                    y: initialPosition.y + (clientY - startY) / viewport.zoom,
                };

                setDragPosition({ partId: dragStateRef.current.partId, position: newPosition });
                pendingMoveRef.current = null;
            }
            rafIdRef.current = null;
        };

        const handleMouseMove = (e: MouseEvent) => {
            pendingMoveRef.current = { x: e.clientX, y: e.clientY };
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(processDragUpdate);
            }
        };

        const handleMouseUp = () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }

            if (!dragStateRef.current || !dragPosition) return;

            const { partId, part } = dragStateRef.current;
            const finalPosition = dragPosition.position;

            // Validate final position
            let shouldCommit = true;
            const bbox = part.boundingBox;
            const outsideMaterial =
                finalPosition.x + bbox.minX < 0 ||
                finalPosition.x + bbox.maxX > material.width ||
                finalPosition.y + bbox.minY < 0 ||
                finalPosition.y + bbox.maxY > material.height;

            if (outsideMaterial) {
                shouldCommit = false;
            } else if (collisionEngineRef.current) {
                const result = collisionEngineRef.current.checkPolygonCollision(
                    partId, finalPosition, part.rotation, true, [partId]
                );
                if (result?.hasCollision) shouldCommit = false;
            }

            if (shouldCommit) {
                onPartsChange?.(parts.map(p => p.id === partId ? { ...p, position: finalPosition } : p));
            }

            dragStateRef.current = null;
            setDragPosition(null);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [dragPosition, viewport.zoom, material.width, material.height, parts, onPartsChange]);

    // Rotate part
    const rotatePart = useCallback((partId: string, deltaAngle: number) => {
        const part = parts.find(p => p.id === partId);
        if (!part) return;
        const newRotation = part.rotation + deltaAngle;
        if (collisionEngineRef.current) {
            const result = collisionEngineRef.current.checkPolygonCollision(
                partId, part.position, newRotation, true, [partId]
            );
            if (result.hasCollision) return;
        }
        onPartsChange?.(parts.map(p => p.id === partId ? { ...p, rotation: newRotation } : p));
    }, [parts, onPartsChange]);

    // CACHED: Static parts entities (pre-transformed, excluding dragged part)
    const staticPartsEntities = useMemo(() => {
        return parts
            .filter(part => part.id !== dragPosition?.partId)
            .flatMap(part => transformEntities(part.entities, part.position, part.rotation, part.id));
    }, [parts, dragPosition?.partId, transformEntities]);

    // CACHED: Material entities (never change during drag)
    const materialEntities = useMemo(() => {
        const entities: Entity[] = [{
            id: 'material-outer',
            type: 'POLYLINE',
            color: 7,
            geometry: {
                points: [
                    { x: 0, y: 0 }, { x: material.width, y: 0 },
                    { x: material.width, y: material.height }, { x: 0, y: material.height }, { x: 0, y: 0 },
                ],
                closed: true,
            },
        }];
        material.innerContours?.forEach((contour, index) => {
            entities.push({
                id: `material-inner-${index}`,
                type: 'POLYLINE',
                color: 4,
                geometry: { points: [...contour.points, contour.points[0]], closed: true },
            });
        });
        return entities;
    }, [material]);

    // DYNAMIC: Only the dragged part entities (updated on every frame)
    const draggedPartEntities = useMemo(() => {
        if (!dragPosition) return [];
        const part = parts.find(p => p.id === dragPosition.partId);
        if (!part) return [];
        return transformEntities(part.entities, dragPosition.position, part.rotation, part.id);
    }, [dragPosition, parts, transformEntities]);

    // Combine all wireframe entities
    const allEntities = useMemo(() => {
        return [...materialEntities, ...staticPartsEntities, ...draggedPartEntities];
    }, [materialEntities, staticPartsEntities, draggedPartEntities]);

    // FILL data - only updates when parts prop changes (not during drag!)
    const partsForFilling = useMemo(() => {
        return parts.map(part => ({
            id: part.id,
            entities: transformEntities(part.entities, part.position, part.rotation, part.id),
            color: part.channel,
        }));
    }, [parts, transformEntities]);

    return {
        allEntities,
        partsForFilling,
        handleMouseDown,
        rotatePart,
        dragPosition
    };
}
