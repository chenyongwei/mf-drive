import React, { useMemo } from 'react';
import { NestingPart } from '../types/NestingTypes';
import { Viewport } from '../types/CADCanvasTypes';

interface PartDimensionsOverlayProps {
    parts: NestingPart[];
    viewport: Viewport;
    theme: 'dark' | 'light';
    visible?: boolean;
}

export const PartDimensionsOverlay: React.FC<PartDimensionsOverlayProps> = ({
    parts,
    viewport,
    theme,
    visible = true
}) => {
    if (!visible || parts.length === 0) return null;

    const textColor = theme === 'dark' ? '#aaaaaa' : '#555555';
    const lineColor = theme === 'dark' ? 'rgba(170, 170, 170, 0.5)' : 'rgba(85, 85, 85, 0.5)';
    const fontSize = Math.max(10, 12 / viewport.zoom); // Minimum legible size or scaled? Actually geometry dimensions should scale with zoom, so constant in world units? No, text usually stays constant screen size in some CADs, but for 'overlay' attached to geometry, it looks better if it scales with view OR stays constant.
    // Let's make it relatively constant Screen Size, so it's readable.
    const screenFontSize = 12;
    const worldFontSize = screenFontSize / viewport.zoom;

    const offset = 5 / viewport.zoom;

    return (
        <g
            transform={`translate(${viewport.pan.x}, ${viewport.pan.y}) scale(${viewport.zoom})`}
            style={{ pointerEvents: 'none' }}
        >
            {parts.map(part => {
                const { minX, minY, maxX, maxY } = part.boundingBox;
                const width = maxX - minX;
                const height = maxY - minY;

                // If part is too small on screen, don't show dimensions
                if (width * viewport.zoom < 30 || height * viewport.zoom < 30) return null;

                const midX = (minX + maxX) / 2;
                const midY = (minY + maxY) / 2;

                // Format numbers to decent precision
                const widthText = Math.round(width * 10) / 10;
                const heightText = Math.round(height * 10) / 10;

                return (
                    <g key={`dim-${part.id}`}>
                        {/* Width (Bottom) */}
                        <line
                            x1={minX} y1={maxY + offset}
                            x2={maxX} y2={maxY + offset}
                            stroke={lineColor}
                            strokeWidth={1 / viewport.zoom}
                        />
                        <text
                            x={midX}
                            y={maxY + offset + worldFontSize + 2 / viewport.zoom}
                            fill={textColor}
                            fontSize={worldFontSize}
                            textAnchor="middle"
                            dominantBaseline="auto" // Default baseline
                        >
                            {widthText}
                        </text>

                        {/* Height (Right) */}
                        <line
                            x1={maxX + offset} y1={minY}
                            x2={maxX + offset} y2={maxY}
                            stroke={lineColor}
                            strokeWidth={1 / viewport.zoom}
                        />
                        <text
                            x={maxX + offset + 2 / viewport.zoom}
                            y={midY}
                            fill={textColor}
                            fontSize={worldFontSize}
                            textAnchor="start"
                            dominantBaseline="middle"
                            transform={`rotate(90, ${maxX + offset + worldFontSize / 2}, ${midY})`} // Rotate text 90deg
                        >
                            {heightText}
                        </text>
                    </g>
                );
            })}
        </g>
    );
};
