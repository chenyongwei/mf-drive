/**
 * Parallel Edge Highlight Component
 *
 * Renders yellow interference hints between part boundaries.
 * The highlight is shown only when there is real interference:
 * - spacing > 0: boundary distance < spacing
 * - overlap collision: always highlighted (including spacing = 0)
 */

import React, { useMemo } from 'react';
import {
    ParallelEdgePair,
    findParallelEdges,
    PartForEdgeDetection,
} from '../utils/ParallelEdgeDetection';

// ============================================================================
// Constants
// ============================================================================

const HIGHLIGHT_COLOR = '#FFFF00'; // Bright yellow
const HIGHLIGHT_WIDTH = 3; // 3 pixels as specified
const MAX_DISTANCE_FOR_HIGHLIGHT = 15; // Search window for candidate parallel edges
const INTERFERENCE_EPSILON = 1e-3;
const OVERLAP_HIGHLIGHT_DISTANCE = 1.5;
const MAX_HIGHLIGHT_PAIRS = 2;

// ============================================================================
// Props
// ============================================================================

interface ParallelEdgeHighlightProps {
    /** The part currently being dragged */
    draggedPartId: string | null;
    /** All parts in the scene */
    parts: PartForEdgeDetection[];
    /** Part spacing setting */
    spacing?: number;
    /** Whether the dragged part is in a valid position (no collision) */
    isValidPosition?: boolean;
    /** Whether the dragged part currently collides with another part */
    hasCollision?: boolean;
    /** Whether the dragged part currently violates spacing constraints */
    hasSpacingInterference?: boolean;
    /** Last known valid drag position for the dragged part */
    fallbackPosition?: { x: number; y: number } | null;
    /** Current theme */
    theme?: 'dark' | 'light';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Renders parallel edge highlights only when there is real spacing interference.
 */
export const ParallelEdgeHighlight: React.FC<ParallelEdgeHighlightProps> = ({
    draggedPartId,
    parts,
    spacing = 0,
    isValidPosition = true,
    hasCollision = false,
    hasSpacingInterference = false,
    fallbackPosition: _fallbackPosition = null,
    theme = 'dark',
}) => {
    const highlightedPairs = useMemo(() => {
        if (!draggedPartId) {
            return [];
        }

        const draggedPart = parts.find(p => p.id === draggedPartId);
        if (!draggedPart) {
            return [];
        }

        const otherParts = parts.filter(p => p.id !== draggedPartId);
        const searchDistance = MAX_DISTANCE_FOR_HIGHLIGHT + Math.max(0, spacing);
        const parallelCandidates = findParallelEdges(
            draggedPart,
            otherParts,
            searchDistance,
            { limit: 8 },
        );
        const minimumRequiredGap = Math.max(0, spacing);
        const hasRealInterference = hasCollision || hasSpacingInterference;
        if (!hasRealInterference && isValidPosition) {
            return [];
        }

        const keyForPair = (pair: ParallelEdgePair) => [
            pair.edge1.partId,
            pair.edge1.start.x.toFixed(3),
            pair.edge1.start.y.toFixed(3),
            pair.edge1.end.x.toFixed(3),
            pair.edge1.end.y.toFixed(3),
            pair.edge2.partId,
            pair.edge2.start.x.toFixed(3),
            pair.edge2.start.y.toFixed(3),
            pair.edge2.end.x.toFixed(3),
            pair.edge2.end.y.toFixed(3),
        ].join('|');

        const violatingCandidates = parallelCandidates.filter((pair) => {
            const violatesSpacing =
                minimumRequiredGap > INTERFERENCE_EPSILON &&
                pair.distance + INTERFERENCE_EPSILON < minimumRequiredGap;
            const violatesOverlap =
                hasCollision &&
                pair.distance <= OVERLAP_HIGHLIGHT_DISTANCE + INTERFERENCE_EPSILON;
            return violatesSpacing || violatesOverlap;
        });

        const deduped = new Map<string, ParallelEdgePair>();
        for (const pair of violatingCandidates) {
            const key = keyForPair(pair);
            if (!deduped.has(key)) {
                deduped.set(key, pair);
            }
        }

        return Array.from(deduped.values())
            .sort((a, b) => a.distance - b.distance)
            .slice(0, MAX_HIGHLIGHT_PAIRS);
    }, [
        draggedPartId,
        parts,
        spacing,
        isValidPosition,
        hasCollision,
        hasSpacingInterference,
    ]);

    if (highlightedPairs.length === 0) {
        return null;
    }

    return (
        <g className="parallel-edge-highlight" pointerEvents="none">
            {highlightedPairs.map((pair, index) => (
                <EdgePairHighlight key={index} pair={pair} theme={theme} />
            ))}
        </g>
    );
};

// ============================================================================
// Sub-component for edge pair
// ============================================================================

interface EdgePairHighlightProps {
    pair: ParallelEdgePair;
    theme: 'dark' | 'light';
}

const EdgePairHighlight: React.FC<EdgePairHighlightProps> = ({ pair, theme }) => {
    const { edge1, edge2 } = pair;

    const color = theme === 'light' ? '#FF0000' : HIGHLIGHT_COLOR; // Red for light mode, Yellow for dark


    return (
        <>
            {/* Glow effect - slightly wider behind */}
            <line
                x1={edge1.start.x}
                y1={edge1.start.y}
                x2={edge1.end.x}
                y2={edge1.end.y}
                stroke={color}
                strokeWidth={HIGHLIGHT_WIDTH + 2}
                strokeLinecap="round"
                opacity={0.4}
            />
            <line
                x1={edge2.start.x}
                y1={edge2.start.y}
                x2={edge2.end.x}
                y2={edge2.end.y}
                stroke={color}
                strokeWidth={HIGHLIGHT_WIDTH + 2}
                strokeLinecap="round"
                opacity={0.4}
            />

            {/* Main highlight lines */}
            <line
                x1={edge1.start.x}
                y1={edge1.start.y}
                x2={edge1.end.x}
                y2={edge1.end.y}
                stroke={color}
                strokeWidth={HIGHLIGHT_WIDTH}
                strokeLinecap="round"
            />
            <line
                x1={edge2.start.x}
                y1={edge2.start.y}
                x2={edge2.end.x}
                y2={edge2.end.y}
                stroke={color}
                strokeWidth={HIGHLIGHT_WIDTH}
                strokeLinecap="round"
            />
        </>
    );
};

export default ParallelEdgeHighlight;
