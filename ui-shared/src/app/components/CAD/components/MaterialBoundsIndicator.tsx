/**
 * MaterialBoundsIndicator - Display material dimensions in nesting mode
 */

import React from 'react';

interface MaterialBoundsIndicatorProps {
    materialBounds: {
        width: number;
        height: number;
    };
    isVisible: boolean;
}

const MaterialBoundsIndicator: React.FC<MaterialBoundsIndicatorProps> = ({
    materialBounds,
    isVisible,
}) => {
    if (!isVisible) return null;

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                padding: '8px 12px',
                backgroundColor: 'rgba(42, 42, 42, 0.9)',
                border: '1px solid #4a4a4a',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#888',
            }}
        >
            材料尺寸: {materialBounds.width} × {materialBounds.height} mm
        </div>
    );
};

export default MaterialBoundsIndicator;
