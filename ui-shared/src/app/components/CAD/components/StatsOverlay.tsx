import React, { useState, useEffect } from 'react';

interface StatsOverlayProps {
    rendererType: string;
    fps: number;
    entitiesCount: number;
    selectedCount: number;
    theme?: 'dark' | 'light';
    utilization?: number;
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({
    rendererType,
    fps,
    entitiesCount,
    selectedCount,
    theme = 'dark',
    utilization,
}) => {
    const isDark = theme === 'dark';

    const styles: Record<string, React.CSSProperties> = {
        container: {
            position: 'absolute',
            top: 60,
            right: 10,
            padding: '8px 12px',
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)',
            color: isDark ? '#ffffff' : '#333333',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 100,
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '120px',
        },
        item: {
            display: 'flex',
            justifyContent: 'space-between',
        },
        label: {
            opacity: 0.7,
        },
        value: {
            fontWeight: 'bold',
            color: rendererType === 'WebGPU' ? '#4caf50' : '#2196f3',
        },
        fps: {
            color: fps > 50 ? '#4caf50' : fps > 30 ? '#ffeb3b' : '#f44336',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.item}>
                <span style={styles.label}>Renderer</span>
                <span style={styles.value}>{rendererType}</span>
            </div>
            <div style={styles.item}>
                <span style={styles.label}>FPS</span>
                <span style={{ ...styles.value, ...styles.fps }}>{Math.round(fps)}</span>
            </div>
            <div style={styles.item}>
                <span style={styles.label}>Entities</span>
                <span style={styles.value}>{entitiesCount}</span>
            </div>
            <div style={styles.item}>
                <span style={styles.label}>Selected</span>
                <span style={styles.value}>{selectedCount}</span>
            </div>
            {utilization !== undefined && (
                <div style={styles.item}>
                    <span style={styles.label}>Utilization</span>
                    <span style={{ ...styles.value, color: '#4caf50' }}>{utilization.toFixed(1)}%</span>
                </div>
            )}
        </div>
    );
};

export default StatsOverlay;
