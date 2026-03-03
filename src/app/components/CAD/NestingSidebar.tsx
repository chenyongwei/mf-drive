/**
 * Nesting Sidebar Component
 * 
 * Manages the list of plates, allows add/remove, and handles selection.
 */

import React from 'react';
import { Plate, NestingPart } from './types/NestingTypes';
import { NestingLayoutItem } from './components/NestingLayoutItem';
import { applyPlateSelectionFromEvent, getPlatePartsWithFallback } from './components/nestingLayoutSelection';

interface NestingSidebarProps {
    plates: Plate[];
    parts: NestingPart[];
    selectedPlateIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onAddPlate: () => void;
    onDeletePlate: (id: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const NestingSidebar: React.FC<NestingSidebarProps> = ({
    plates,
    parts,
    selectedPlateIds,
    onSelectionChange,
    onAddPlate,
    onDeletePlate,
    isOpen,
    onToggle,
}) => {
    const handleSelect = (e: React.MouseEvent, plateId: string) => {
        const nextSelection = applyPlateSelectionFromEvent(
            e,
            plateId,
            selectedPlateIds,
            plates,
            'multi',
        );
        onSelectionChange(nextSelection);
    };

    return (
        <div
            style={{
                width: isOpen ? '280px' : '40px',
                height: '100%',
                backgroundColor: '#202020',
                borderLeft: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 900 // Below modals
            }}
        >
            {/* Toggle Tab */}
            <div
                onClick={onToggle}
                style={{
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderBottom: '1px solid #333',
                    color: '#888',
                    flexShrink: 0,
                    width: isOpen ? '100%' : '40px',
                }}
            >
                {isOpen ? '›' : '‹'}
            </div>

            {/* Content (Hidden when collapsed) */}
            <div style={{
                flex: 1,
                display: isOpen ? 'flex' : 'none',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>排版</span>
                    <button
                        onClick={onAddPlate}
                        style={{
                            backgroundColor: '#4a9eff',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        + 添加
                    </button>
                </div>

                {/* List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    paddingBottom: '80px' // Space for bottom actions if needed
                }}>
                    {plates.map(plate => (
                        <NestingLayoutItem
                            key={plate.id}
                            plate={plate}
                            parts={getPlatePartsWithFallback(parts, plate, plates)}
                            isSelected={selectedPlateIds.includes(plate.id)}
                            onSelect={(e) => handleSelect(e, plate.id)}
                            onDelete={() => onDeletePlate(plate.id)}
                        />
                    ))}

                    {plates.length === 0 && (
                        <div style={{
                            color: '#666',
                            textAlign: 'center',
                            padding: '20px 0',
                            fontSize: '13px'
                        }}>
                            No plates added.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NestingSidebar;
