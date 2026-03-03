
import React from 'react';
import { NestingLayoutViewMode, Plate, NestingPart } from '../types/NestingTypes';
import { NestingLayoutItem } from './NestingLayoutItem';
import { applyPlateSelectionFromEvent, getPlatePartsWithFallback } from './nestingLayoutSelection';

interface NestingLayoutsPanelProps {
    plates: Plate[];
    parts: NestingPart[];
    layoutViewMode: NestingLayoutViewMode;
    selectedPlateIds: string[];
    onLayoutViewModeChange: (mode: NestingLayoutViewMode) => void;
    onPlateSelectionChange: (clickedPlateId: string, ids: string[]) => void;
    onAddPlate: () => void;
    onDeletePlate: (id: string) => void;
    theme: 'dark' | 'light';
}

export const NestingLayoutsPanel: React.FC<NestingLayoutsPanelProps> = ({
    plates,
    parts,
    layoutViewMode,
    selectedPlateIds,
    onLayoutViewModeChange,
    onPlateSelectionChange,
    onAddPlate,
    onDeletePlate,
    theme,
}) => {
    const handleSelect = (e: React.MouseEvent, plateId: string) => {
        const nextSelection = applyPlateSelectionFromEvent(
            e,
            plateId,
            selectedPlateIds,
            plates,
            layoutViewMode,
        );
        onPlateSelectionChange(plateId, nextSelection);
    };

    const styles = {
        container: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#333333',
        },
        header: {
            padding: '12px 16px',
            borderBottom: theme === 'dark' ? '1px solid #333' : '1px solid #e5e5e5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? '#252525' : '#f5f5f5',
        },
        headerTitle: {
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        headerActions: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        modeToggleGroup: {
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            overflow: 'hidden',
            border: theme === 'dark' ? '1px solid #444' : '1px solid #d1d5db',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
        },
        modeToggleButton: {
            border: 'none',
            backgroundColor: 'transparent',
            color: theme === 'dark' ? '#d1d5db' : '#4b5563',
            cursor: 'pointer',
            fontSize: '11px',
            lineHeight: 1.2,
            padding: '4px 8px',
            transition: 'all 0.2s',
        },
        modeToggleButtonActive: {
            backgroundColor: '#2563eb',
            color: '#ffffff',
        },
        addButton: {
            backgroundColor: '#4a9eff',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
        },
        list: {
            flex: 1,
            overflowY: 'auto' as const,
            padding: '12px',
        },
        emptyState: {
            color: theme === 'dark' ? '#666' : '#999',
            textAlign: 'center' as const,
            padding: '32px 16px',
            fontSize: '13px',
            backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
            borderRadius: '8px',
            border: theme === 'dark' ? '1px dashed #444' : '1px dashed #ccc',
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>
                    <span>排版</span>
                </div>
                <div style={styles.headerActions}>
                    <div style={styles.modeToggleGroup}>
                        <button
                            type="button"
                            onClick={() => onLayoutViewModeChange('multi')}
                            style={{
                                ...styles.modeToggleButton,
                                ...(layoutViewMode === 'multi' ? styles.modeToggleButtonActive : {}),
                            }}
                        >
                            多排版
                        </button>
                        <button
                            type="button"
                            onClick={() => onLayoutViewModeChange('single')}
                            style={{
                                ...styles.modeToggleButton,
                                ...(layoutViewMode === 'single' ? styles.modeToggleButtonActive : {}),
                            }}
                        >
                            单排版
                        </button>
                    </div>
                    <button
                        onClick={onAddPlate}
                        style={styles.addButton}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a8eef'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a9eff'}
                    >
                        + 添加
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={styles.list}>
                {plates.map(plate => (
                    <NestingLayoutItem
                        key={plate.id}
                        plate={plate}
                        parts={getPlatePartsWithFallback(parts, plate, plates)}
                        isSelected={selectedPlateIds.includes(plate.id)}
                        onSelect={(e) => handleSelect(e, plate.id)}
                        onDelete={() => onDeletePlate(plate.id)}
                        theme={theme}
                    />
                ))}

                {plates.length === 0 && (
                    <div style={styles.emptyState}>
                        No plates added.
                    </div>
                )}
            </div>
        </div>
    );
};
