import { useState, useEffect, useMemo, useCallback } from 'react';
import { getTiles } from '../../services/api';
import { Entity } from '../../lib/webgpu/WebGPURenderer';
import { ChannelType } from '../../lib/webgpu/PartFillGenerator';
import { useEdit } from '../../contexts/EditContext';
import {
    collectProjectedLayoutEntities,
} from '../../utils/layoutProjection';
import type {
    FileEntities,
    ImportedFile,
    TiledLayout,
} from './usePartConversion.types';

export type {
    ImportedFile,
    TiledLayout,
    FileEntities,
} from './usePartConversion.types';

export function usePartConversion(
    files: ImportedFile[],
    selectedFileIds: Set<string>,
    tiledLayout: TiledLayout[]
) {
    const [fileEntities, setFileEntities] = useState<Map<string, FileEntities>>(new Map());
    const { setOnEntitiesUpdated, editState } = useEdit();

    useEffect(() => {
        setOnEntitiesUpdated((updatedEntities: any[], deletedEntityIds: string[]) => {
            setFileEntities(prev => {
                const newMap = new Map(prev);
                updatedEntities.forEach(updatedEntity => {
                    const fileId = (updatedEntity as any).fileId;
                    if (fileId && newMap.has(fileId)) {
                        const fileEnts = newMap.get(fileId)!;
                        const index = fileEnts.entities.findIndex((e: any) => e.id === updatedEntity.id);
                        if (index !== -1) {
                            fileEnts.entities[index] = updatedEntity;
                        }
                    }
                });

                deletedEntityIds.forEach(deletedId => {
                    newMap.forEach((fileEnts, fileId) => {
                        const index = fileEnts.entities.findIndex((e: any) => e.id === deletedId);
                        if (index !== -1) {
                            fileEnts.entities.splice(index, 1);
                        }
                    });
                });

                return newMap;
            });
        });
    }, [setOnEntitiesUpdated]);

    useEffect(() => {
        const loadFileEntities = async () => {
            const selectedFiles = files.filter(f =>
                selectedFileIds.has(f.id) && f.status === 'ready' && f.bbox
            );

            for (const file of selectedFiles) {
                if (fileEntities.get(file.id)?.loaded) continue;

                try {
                    setFileEntities(prev => {
                        const next = new Map(prev);
                        next.set(file.id, { fileId: file.id, entities: [], loaded: false, loading: true });
                        return next;
                    });

                    const zoomLevel = 0;
                    const viewport = {
                        xMin: -1e9,
                        yMin: -1e9,
                        xMax: 1e9,
                        yMax: 1e9
                    };

                    const data = await getTiles(file.id, viewport, zoomLevel);
                    const entities = data.tiles?.[0]?.entities || [];

                    setFileEntities(prev => {
                        const next = new Map(prev);
                        next.set(file.id, { fileId: file.id, entities, loaded: true, loading: false });
                        return next;
                    });

                } catch (error) {
                    console.error(`Failed to load entities for file ${file.name}:`, error);
                    setFileEntities(prev => {
                        const next = new Map(prev);
                        next.set(file.id, { fileId: file.id, entities: [], loaded: false, loading: false });
                        return next;
                    });
                }
            }
        };

        loadFileEntities();
    }, [selectedFileIds, files]);

    const entities = useMemo((): Entity[] => {
        const allEntities: Entity[] = [];

        tiledLayout.forEach((layout) => {
            const projected = collectProjectedLayoutEntities({
                layout,
                files,
                fileEntities,
                selectedFileIds,
                createEntity: (entity): Entity => ({
                    id: String(entity.id),
                    type: entity.type,
                    color: Number(entity.color || 3),
                    isPart: true,
                    isSelected: editState.selectedEntityIds.has(String(entity.id)),
                    isHovered: editState.hoverEntityId === String(entity.id),
                    fileId: layout.fileId,
                }),
            });
            if (!projected) return;

            allEntities.push(projected.frameEntity, ...projected.projectedEntities);
        });

        return allEntities;
    }, [tiledLayout, files, fileEntities, selectedFileIds, editState.selectedEntityIds, editState.hoverEntityId]);

    const partsForFilling = useMemo(() => {
        const allParts: Array<{ id: string; entities: Entity[]; color: string }> = [];

        tiledLayout.forEach((layout) => {
            const file = files.find(f => f.id === layout.fileId);
            if (!file || !file.parts || file.parts.length === 0) return;

            const fileEntitiesData = fileEntities.get(layout.fileId);
            if (!fileEntitiesData || !fileEntitiesData.loaded) return;

            const scaleX = layout.scale;
            const scaleY = layout.scale;
            const offsetX = layout.position.x;
            const offsetY = layout.position.y;

            file.parts.forEach((part: any, partIndex: number) => {
                const partEntities = fileEntitiesData.entities.filter((e: any) =>
                    e.partId === part.id || e.partId === `${partIndex}`
                );

                if (partEntities.length > 0) {
                    const transformedEntities = partEntities.map((e: Entity): Entity => {
                        const transformed = { ...e };

                        if (transformed.geometry) {
                            if (transformed.geometry.points) {
                                transformed.geometry.points = transformed.geometry.points.map((p: any) => ({
                                    x: (p.x) * scaleX + offsetX,
                                    y: -(p.y) * scaleY + offsetY,
                                }));
                            }
                            if (transformed.geometry.start) {
                                transformed.geometry.start = {
                                    x: (transformed.geometry.start.x) * scaleX + offsetX,
                                    y: -(transformed.geometry.start.y) * scaleY + offsetY,
                                };
                            }
                            if (transformed.geometry.end) {
                                transformed.geometry.end = {
                                    x: (transformed.geometry.end.x) * scaleX + offsetX,
                                    y: -(transformed.geometry.end.y) * scaleY + offsetY,
                                };
                            }
                            if (transformed.geometry.center) {
                                transformed.geometry.center = {
                                    x: (transformed.geometry.center.x) * scaleX + offsetX,
                                    y: -(transformed.geometry.center.y) * scaleY + offsetY,
                                };
                            }
                        }
                        return transformed;
                    });

                    let partColor = ChannelType.CHANNEL_1;
                    if (part.channel) {
                        partColor = part.channel;
                    } else if (part.properties?.cutChannel) {
                        const channelMap: Record<number, ChannelType> = {
                            1: ChannelType.CHANNEL_1,
                            2: ChannelType.CHANNEL_2,
                            3: ChannelType.CHANNEL_3,
                            4: ChannelType.CHANNEL_4,
                        };
                        partColor = channelMap[part.properties.cutChannel] || ChannelType.CHANNEL_1;
                    }

                    allParts.push({
                        id: `${layout.fileId}-${part.id || partIndex}`,
                        entities: transformedEntities,
                        color: partColor,
                    });
                }
            });
        });

        return allParts;
    }, [tiledLayout, files, fileEntities]);

    return {
        entities,
        partsForFilling,
        fileEntities,
    };
}
