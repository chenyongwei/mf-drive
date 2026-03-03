import React from 'react';
import { Entity } from '../../../lib/webgpu/EntityToVertices';
import { Viewport } from '../types/CADCanvasTypes';

interface DimensionOverlayProps {
    entities: Entity[];
    viewport: Viewport;
    theme: 'dark' | 'light';
}

export const DimensionOverlay: React.FC<DimensionOverlayProps> = ({
    entities,
    viewport,
    theme
}) => {
    const dimensionEntities = entities.filter(e => e.type === 'DIMENSION' || e.type === 'dimension');

    if (dimensionEntities.length === 0) return null;

    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    const lineColor = theme === 'dark' ? '#ffffff' : '#000000';

    // Constant screen size for text/arrows or zoom-independent?
    // Usually dimensions scale with zoom in CAD (they get smaller as you zoom out), 
    // BUT annotations might be desired to remain readable. 
    // Standard CAD behavior: Geometry parts (lines) scale with zoom. Text scales with zoom.
    // So we draw in world coordinates.

    // However, for "Arrow heads" and "Text size", they often have a fixed "Model Space" size.
    // I'll assume a base text size in model units.
    // If I want them to be readable always, I should scale them by 1/zoom.
    // "Drawing Dimensions manually dragging generated" suggests standard CAD dimensioning.
    // Let's stick to world coordinates for position, but maybe scale visual elements (arrows/text) 
    // to be readable if zoom is extreme? No, AutoCAD dimensions have a flexible scale.
    // I'll use a fixed world unit size for now, say height 10mm (or whatever units).
    // Or I can use screen-space size if I want dynamic readability.
    // Given PartDimensionsOverlay uses screen-space scaling (12/zoom), I'll do similar here for consistency.

    const screenFontSize = 12;
    const worldFontSize = screenFontSize / viewport.zoom;
    const arrowSize = 10 / viewport.zoom;
    const extensionOffset = 5 / viewport.zoom;

    return (
        <g
            transform={`translate(${viewport.pan.x}, ${viewport.pan.y}) scale(${viewport.zoom})`}
            style={{ pointerEvents: 'none' }}
        >
            {dimensionEntities.map(entity => {
                const geo = entity.geometry;
                if (!geo || !geo.start || !geo.end || !geo.textPoint) return null;

                const start = geo.start;
                const end = geo.end;
                const textPoint = geo.textPoint; // Logic: defines the "height" of the dimension line

                // Calculate vector along the measurement
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len === 0) return null;

                const u = { x: dx / len, y: dy / len }; // Unit vector along line
                const v = { x: -u.y, y: u.x }; // Perpendicular vector

                // Project textPoint onto line to get offset distance
                // Vector from start to textPoint
                const dtx = textPoint.x - start.x;
                const dty = textPoint.y - start.y;

                // Dot product with v to get distance perpendicular
                const offsetDist = dtx * v.x + dty * v.y;

                // Dimension line points
                const p1 = { x: start.x + v.x * offsetDist, y: start.y + v.y * offsetDist };
                const p2 = { x: end.x + v.x * offsetDist, y: end.y + v.y * offsetDist };

                return (
                    <g key={entity.id}>
                        {/* Extension Lines */}
                        <line
                            x1={start.x} y1={start.y}
                            x2={start.x + v.x * (offsetDist + (offsetDist > 0 ? extensionOffset : -extensionOffset))}
                            y2={start.y + v.y * (offsetDist + (offsetDist > 0 ? extensionOffset : -extensionOffset))}
                            stroke={lineColor}
                            strokeWidth={1 / viewport.zoom}
                            opacity={0.5}
                        />
                        <line
                            x1={end.x} y1={end.y}
                            x2={end.x + v.x * (offsetDist + (offsetDist > 0 ? extensionOffset : -extensionOffset))}
                            y2={end.y + v.y * (offsetDist + (offsetDist > 0 ? extensionOffset : -extensionOffset))}
                            stroke={lineColor}
                            strokeWidth={1 / viewport.zoom}
                            opacity={0.5}
                        />

                        {/* Dimension Line */}
                        <line
                            x1={p1.x} y1={p1.y}
                            x2={p2.x} y2={p2.y}
                            stroke={lineColor}
                            strokeWidth={1 / viewport.zoom}
                        />

                        {/* Arrows (Simple lines for now) */}
                        {/* We could use markers but manual lines are easier to control with React */}
                        {/* Arrow at P1 pointing to P2? No, arrows point OUTWARDS usually or INWARDS depending on space. Assume Out -> In */}

                        {/* Actually, let's just draw simple tick marks or circles for endpoints as it's easier */}
                        <circle cx={p1.x} cy={p1.y} r={2 / viewport.zoom} fill={lineColor} />
                        <circle cx={p2.x} cy={p2.y} r={2 / viewport.zoom} fill={lineColor} />

                        {/* Text */}
                        <text
                            x={textPoint.x}
                            y={textPoint.y}
                            fill={textColor}
                            fontSize={worldFontSize}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={(() => {
                                let angle = Math.atan2(dy, dx) * 180 / Math.PI;
                                if (angle > 90 || angle < -90) angle += 180;
                                return `rotate(${angle}, ${textPoint.x}, ${textPoint.y})`;
                            })()}
                            style={{ paintOrder: 'stroke', stroke: theme === 'dark' ? '#000' : '#fff', strokeWidth: 3 / viewport.zoom }}
                        >
                            {geo.text || (Math.round(len * 100) / 100)}
                        </text>
                    </g>
                );
            })}
        </g>
    );
};
