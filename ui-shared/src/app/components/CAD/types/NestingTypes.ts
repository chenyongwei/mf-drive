/**
 * Nesting Types
 */

import { Entity } from '../../../lib/webgpu/EntityToVertices';

export interface Point {
    x: number;
    y: number;
}

export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface Plate {
    id: string;
    name: string;
    width: number;
    height: number;
    margin: number; // Inner margin in mm
    position: Point; // Position on the canvas
}

export interface NestingConfiguration {
    partSpacing: number; // Gap between parts in mm
    rotationStep: number; // Rotation increment in degrees (e.g., 90, 45, 1)
    fineRotationStep: number; // Q/E increment
    snappingEnabled: boolean; // Enable smart snap when dragging
    snapTolerance: number; // Snap capture distance in mm
    showDistanceGuides: boolean; // Show blue distance guide line
    distanceGuideMaxDistance: number; // Max distance-guide capture range in mm
    commonEdgeEnabled: boolean; // Enable common-edge toolpath optimization
    stickToEdge: boolean; // Snap to sheet edge
    penetrationMode: boolean; // Allow parts to overlap or cross sheet boundaries
}

export type NestingLayoutViewMode = 'multi' | 'single';

export type NestingProcessOperation = 'add' | 'delete';

export interface NestingProcessUsageStat {
    count: number;
    lastUsedAt: number;
}

export interface NestingProcessToolbarPrefs {
    primaryActionByOperation: Partial<Record<NestingProcessOperation, string>>;
    favorites: string[];
    usageStats: Record<string, NestingProcessUsageStat>;
}

export type NestingPartStatus = 'unplaced' | 'placed';

export interface NestingPart {
    id: string;
    sourcePartId?: string;
    instanceIndex?: number;
    instanceCount?: number;
    fileId?: string; // Original file ID
    name?: string;

    // Geometry
    entities: Entity[];
    boundingBox: BoundingBox;

    // State
    status: NestingPartStatus;
    plateId: string | null; // ID of the plate if placed

    // Transform (relative to plate if placed, or absolute if unplaced/in-lists)
    position: Point;
    rotation: number;
    mirroredX?: boolean;
    mirroredY?: boolean;

    // Cached for collision
    simplifiedContour?: Point[];
}
