/**
 * SnapIndicator - Visual indicator for snap points during drawing
 */

import React from 'react';

import { SnapPoint } from '../hooks/useSnapping';

interface SnapIndicatorProps {
    snapPoint: SnapPoint | null;
    viewport: {
        zoom: number;
        pan: { x: number; y: number };
    };
    isActive: boolean;
}

const SnapIndicator: React.FC<SnapIndicatorProps> = ({
    snapPoint,
    viewport,
    isActive,
}) => {
    if (!snapPoint || !isActive) return null;

    const screenX = snapPoint.x * viewport.zoom + viewport.pan.x;
    const screenY = snapPoint.y * viewport.zoom + viewport.pan.y;

    return (
        <div
            style={{
                position: 'absolute',
                left: screenX - 5,
                top: screenY - 5,
                width: 10,
                height: 10,
                border: '2px solid #fff', // Add white border for contrast
                borderRadius: snapPoint.type === 'midpoint' ? '0' : '50%',
                backgroundColor: '#00FFFF', // Solid Cyan
                pointerEvents: 'none',
                transform: snapPoint.type === 'midpoint' ? 'rotate(45deg)' : 'none',
                zIndex: 100,
                boxShadow: '0 0 4px rgba(0,0,0,0.5)' // Add shadow for depth
            }}
        />
    );
};

export default SnapIndicator;
