/**
 * FileBoundingBoxOverlay - SVG overlay for file bounding boxes and labels
 */

import React from 'react';
import { FileBox, FileLabel } from '../hooks/useFileLabels';

import { useCommonFeature } from '../../../contexts/FeatureFlagContext';
import { CommonFeature } from '@dxf-fix/shared';

interface FileBoundingBoxOverlayProps {
    fileBoxes: FileBox[];
    labels: FileLabel[];
    viewport: {
        zoom: number;
        pan: { x: number; y: number };
    };
    theme: 'dark' | 'light';
}

const FileBoundingBoxOverlay: React.FC<FileBoundingBoxOverlayProps> = ({
    fileBoxes,
    labels,
    viewport,
    theme,
}) => {
    const labelColor = theme === 'dark' ? '#aaa' : '#666';
    const boxColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

    // Feature flags
    const showBorder = useCommonFeature(CommonFeature.BOUNDING_BOX);
    const showName = useCommonFeature(CommonFeature.NAME_LABEL);

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 5,
            }}
        >
            <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                {fileBoxes.map(fb => {
                    const { bbox } = fb;
                    const screenX = bbox.minX * viewport.zoom + viewport.pan.x;
                    const screenY = bbox.minY * viewport.zoom + viewport.pan.y;
                    const screenW = (bbox.maxX - bbox.minX) * viewport.zoom;
                    const screenH = (bbox.maxY - bbox.minY) * viewport.zoom;
                    const label = labels.find(l => l.id === fb.id);

                    return (
                        <g key={fb.id}>
                            {showBorder && (
                                <rect
                                    x={screenX}
                                    y={screenY}
                                    width={screenW}
                                    height={screenH}
                                    fill="none"
                                    stroke={boxColor}
                                    strokeWidth="1"
                                    strokeDasharray="5,5"
                                />
                            )}
                            {showName && label && label.visible && viewport.zoom > 0.05 && (
                                <text
                                    x={label.x}
                                    y={label.y}
                                    fill={labelColor}
                                    fontSize="12px"
                                    fontFamily="sans-serif"
                                    style={{
                                        opacity: label.opacity,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {label.text}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default FileBoundingBoxOverlay;
