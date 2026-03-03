/**
 * useFileLabels - Hook for managing file bounding boxes and labels
 * 
 * Calculates file bounding boxes with padding and handles label
 * overlap detection with truncation strategies.
 */

import { useMemo } from 'react';
import { Entity } from '../../../lib/webgpu/EntityToVertices';
import { calculateBoundingBox } from '../../../utils/entityBBox';
import { EXPANSION } from '../../../constants/layoutConstants';

export interface FileBox {
    id: string;
    name: string;
    bbox: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}

export interface FileLabel {
    id: string;
    text: string;
    x: number;
    y: number;
    visible: boolean;
    opacity: number;
}

interface UseFileLabelsProps {
    files: { id: string; name: string }[];
    entities: Entity[];
    viewport: {
        zoom: number;
        pan: { x: number; y: number };
    };
}

interface UseFileLabelsResult {
    fileBoxes: FileBox[];
    labels: FileLabel[];
}

export function useFileLabels({
    files,
    entities,
    viewport,
}: UseFileLabelsProps): UseFileLabelsResult {
    // Calculate file bounding boxes with padding
    const fileBoxes = useMemo(() => {
        return files.map(file => {
            const fileEntities = entities.filter(e => e.fileId === file.id);
            const bbox = calculateBoundingBox(fileEntities);
            if (!bbox) return null;

            // Keep display frame consistent with layout frame expansion.
            const PADDING = EXPANSION;

            return {
                id: file.id,
                name: file.name,
                bbox: {
                    minX: bbox.minX - PADDING,
                    minY: bbox.minY - PADDING,
                    maxX: bbox.maxX + PADDING,
                    maxY: bbox.maxY + PADDING
                }
            };
        }).filter((fb): fb is FileBox => fb !== null);
    }, [files, entities]);

    // Calculate labels with overlap detection
    const labels = useMemo(() => {
        const rects: { x1: number; y1: number; x2: number; y2: number }[] = [];
        const { zoom, pan } = viewport;
        const charWidth = 7; // Approx width per character at 12px

        const isOverlapping = (rect: { x1: number; y1: number; x2: number; y2: number }) => {
            for (const r of rects) {
                if (!(rect.x2 < r.x1 || rect.x1 > r.x2 || rect.y2 < r.y1 || rect.y1 > r.y2)) {
                    return true;
                }
            }
            return false;
        };

        return fileBoxes.map(fb => {
            const screenX = fb.bbox.minX * zoom + pan.x;
            const screenY = fb.bbox.minY * zoom + pan.y;

            // Calculate occupied space for full name
            const fullWidth = fb.name.length * charWidth;
            const fullRect = {
                x1: screenX,
                y1: screenY - 20,
                x2: screenX + fullWidth,
                y2: screenY
            };

            // Always show label regardless of overlap
            rects.push(fullRect);
            return {
                id: fb.id,
                text: fb.name,
                x: screenX,
                y: screenY - 5,
                visible: true,
                opacity: zoom < 0.2 ? (zoom - 0.05) / 0.15 : 1
            };
        });
    }, [fileBoxes, viewport]);

    return { fileBoxes, labels };
}

export default useFileLabels;
