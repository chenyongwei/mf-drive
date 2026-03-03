/**
 * Remote Selection Overlay Component
 * 
 * Displays remote users' selected entities on the canvas with their respective colors
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { Entity } from '../../lib/webgpu/EntityToVertices';
import { getEntityBBox } from '../../utils/entityBBox';
import { useViewport } from '../../contexts/ViewportContext';

interface RemoteSelectionOverlayProps {
    entities: Entity[];
}

const styles = {
    overlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none' as const,
        zIndex: 1500,
        overflow: 'hidden' as const,
    },
    selectionBox: (color: string) => ({
        position: 'absolute' as const,
        border: `2px dashed ${color}`,
        backgroundColor: `${color}11`, // Very transparent fill
        pointerEvents: 'none' as const,
        transition: 'all 0.1s ease-out',
        borderRadius: '2px',
    }),
    label: (color: string) => ({
        position: 'absolute' as const,
        top: '-20px',
        left: '0',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: 'bold' as const,
        color: '#ffffff',
        backgroundColor: color,
        borderRadius: '2px',
        whiteSpace: 'nowrap' as const,
        pointerEvents: 'none' as const,
        zIndex: 1501,
    }),
};

const RemoteSelectionOverlay: React.FC<RemoteSelectionOverlayProps> = ({ entities }) => {
    const { t } = useTranslation();
    const { remoteSelections, remoteUsers } = useCollaboration();
    const { viewport } = useViewport();
    const activeViewport = viewport || { zoom: 1, pan: { x: 0, y: 0 } };

    // Create a map of entity ID to its bounding box for quick lookup
    const entityBBoxes = useMemo(() => {
        const map = new Map<string, { minX: number; minY: number; maxX: number; maxY: number }>();
        entities.forEach(entity => {
            try {
                map.set(entity.id, getEntityBBox(entity));
            } catch (e) {
                // Skip entities with invalid geometry
            }
        });
        return map;
    }, [entities]);

    return (
        <div style={styles.overlay}>
            {Array.from(remoteSelections.entries()).map(([userId, entityIds]) => {
                const user = remoteUsers.get(userId);
                if (!user || !entityIds || entityIds.length === 0) return null;

                return entityIds.map(entityId => {
                    const bbox = entityBBoxes.get(entityId);
                    if (!bbox) return null;

                    // Convert world coordinates to screen coordinates
                    const left = bbox.minX * activeViewport.zoom + activeViewport.pan.x;
                    const top = bbox.minY * activeViewport.zoom + activeViewport.pan.y;
                    const width = (bbox.maxX - bbox.minX) * activeViewport.zoom;
                    const height = (bbox.maxY - bbox.minY) * activeViewport.zoom;

                    // Only render if visible on screen (basic optimization)
                    if (left + width < 0 || top + height < 0) return null;

                    return (
                        <div
                            key={`${userId}-${entityId}`}
                            style={{
                                ...styles.selectionBox(user.color),
                                left,
                                top,
                                width,
                                height,
                            }}
                        >
                            {/* Show username for the first selected entity or if only one is selected */}
                            {entityIds[0] === entityId && (
                                <div style={styles.label(user.color)}>
                                    {t('collaboration.selecting', { username: user.username })}
                                </div>
                            )}
                        </div>
                    );
                });
            })}
        </div>
    );
};

export default RemoteSelectionOverlay;
