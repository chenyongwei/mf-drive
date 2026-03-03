/**
 * Nesting Panel Component
 *
 * Side panel for managing:
 * 1. Plates (Add/Remove)
 * 2. Unplaced parts list
 * 3. Nesting configuration (gaps, rotation step)
 */

import React from 'react';
import { Plate, NestingPart, NestingConfiguration } from './types/NestingTypes';

interface NestingPanelProps {
    plates: Plate[];
    parts: NestingPart[];
    config: NestingConfiguration;
    onAddPlate: () => void;
    onRemovePlate: (id: string) => void;
    onConfigChange: (config: NestingConfiguration) => void;
    onPlateUpdate: (plate: Plate) => void;
}

const styles = {
    container: {
        padding: '16px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px',
    },
    section: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
    },
    sectionTitle: {
        fontSize: '14px',
        fontWeight: 'bold' as const,
        borderBottom: '1px solid #444',
        paddingBottom: '4px',
        marginBottom: '8px',
    },
    plateItem: {
        backgroundColor: '#333',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '8px',
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px',
    },
    input: {
        backgroundColor: '#222',
        border: '1px solid #444',
        color: '#fff',
        padding: '4px',
        borderRadius: '2px',
        width: '60px',
    },
    button: {
        backgroundColor: '#4a9eff',
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%',
    },
    removeButton: {
        backgroundColor: 'transparent',
        color: '#ff6b6b',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '0 4px',
    },
    partItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        backgroundColor: '#333',
        borderRadius: '4px',
        cursor: 'grab',
        marginBottom: '4px',
    },
    partColor: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
    },
};

const NestingPanel: React.FC<NestingPanelProps> = ({
    plates,
    parts,
    config,
    onAddPlate,
    onRemovePlate,
    onConfigChange,
    onPlateUpdate,
}) => {
    const unplacedParts = parts.filter(p => p.status === 'unplaced');

    const handlePlateChange = (plate: Plate, field: keyof Plate, value: number) => {
        onPlateUpdate({
            ...plate,
            [field]: value,
        });
    };

    return (
        <div style={styles.container}>
            {/* Configuration Section */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>⚙️ 设置</div>
                <div style={styles.row}>
                    <label>零件间距 (mm)</label>
                    <input
                        type="number"
                        style={styles.input}
                        value={config.partSpacing}
                        onChange={(e) => onConfigChange({ ...config, partSpacing: Number(e.target.value) })}
                    />
                </div>
                <div style={styles.row}>
                    <label>旋转步长 (°)</label>
                    <select
                        style={styles.input}
                        value={config.rotationStep}
                        onChange={(e) => onConfigChange({ ...config, rotationStep: Number(e.target.value) })}
                    >
                        <option value="90">90°</option>
                        <option value="45">45°</option>
                        <option value="15">15°</option>
                        <option value="1">1°</option>
                    </select>
                </div>
            </div>

            {/* Plates Section */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>📋 板材 ({plates.length})</div>
                {plates.map(plate => (
                    <div key={plate.id} style={styles.plateItem}>
                        <div style={styles.row}>
                            <span style={{ fontWeight: 'bold' }}>{plate.name}</span>
                            <button
                                style={styles.removeButton}
                                onClick={() => onRemovePlate(plate.id)}
                                title="删除板材"
                            >
                                ×
                            </button>
                        </div>
                        <div style={styles.row}>
                            <label>尺寸 (W×H)</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                    type="number"
                                    style={{ ...styles.input, width: '50px' }}
                                    value={plate.width}
                                    onChange={(e) => handlePlateChange(plate, 'width', Number(e.target.value))}
                                />
                                <span>×</span>
                                <input
                                    type="number"
                                    style={{ ...styles.input, width: '50px' }}
                                    value={plate.height}
                                    onChange={(e) => handlePlateChange(plate, 'height', Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div style={styles.row}>
                            <label>边距 (mm)</label>
                            <input
                                type="number"
                                style={styles.input}
                                value={plate.margin}
                                onChange={(e) => handlePlateChange(plate, 'margin', Number(e.target.value))}
                            />
                        </div>
                    </div>
                ))}
                <button style={styles.button} onClick={onAddPlate}>
                    + 添加板材
                </button>
            </div>

            {/* Unplaced Parts Section */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>📦 待排零件 ({unplacedParts.length})</div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {unplacedParts.map(part => (
                        <div key={part.id} style={styles.partItem}>
                            {/* Simplified Drag Source - actual drag handled by canvas interactions usually,
                  but here we might want list-to-canvas drag. 
                  For now, we just list them. They appear at default pos on canvas if unplaced? 
                  
                  Actually, unplaced parts should probably be visible in a "staging area" on canvas 
                  OR we assume they are just available to be dragged from a palette.
                  
                  Given the requirement "support drag and drop part on plates", it implies move from somewhere to plate.
                  If they are "unplaced", they might be floating outside plates.
               */}
                            <span>{part.name || part.id.slice(0, 8)}</span>
                        </div>
                    ))}
                    {unplacedParts.length === 0 && (
                        <div style={{ color: '#888', textAlign: 'center', fontSize: '12px' }}>
                            所有零件已放置
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NestingPanel;
