
import React, { useMemo } from 'react';
import { Plate, NestingPart } from '../types/NestingTypes';
import type { Entity } from '../../../lib/webgpu/EntityToVertices';
import type { Transformation } from '@dxf-fix/shared/utils/geometry';
import { transformEntity } from '../../../utils/entityTransform';
import {
    resolveProcessCode,
    resolveProcessStrokeColor,
} from '../../../layouts/CADPageLayout/CADPageLayout.file-utils';

interface NestingLayoutItemProps {
    plate: Plate;
    parts: NestingPart[]; // Parts placed on THIS plate
    isSelected: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    theme?: 'dark' | 'light';
}

export const NestingLayoutItem: React.FC<NestingLayoutItemProps> = ({
    plate,
    parts,
    isSelected,
    onSelect,
    onDelete,
    theme = 'dark',
}) => {
    type Point = { x: number; y: number };
    type ThumbnailContour = {
        id: string;
        points: Point[];
        closed: boolean;
        stroke: string;
    };

    const normalizeAngleToRadians = (angle: number): number => {
        if (!Number.isFinite(angle)) return 0;
        return Math.abs(angle) > Math.PI * 2 + 1e-6 ? (angle * Math.PI) / 180 : angle;
    };

    const toPoint = (value: unknown): Point | null => {
        if (!value || typeof value !== 'object') return null;
        const candidate = value as { x?: unknown; y?: unknown };
        const x = Number(candidate.x);
        const y = Number(candidate.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return { x, y };
    };

    const toPoints = (value: unknown): Point[] => {
        if (!Array.isArray(value)) return [];
        return value.map((point) => toPoint(point)).filter((point): point is Point => Boolean(point));
    };

    const buildPartTransformations = (part: NestingPart): Transformation[] => {
        const pivot = {
            x: (part.boundingBox.minX + part.boundingBox.maxX) / 2,
            y: (part.boundingBox.minY + part.boundingBox.maxY) / 2,
        };
        const transformations: Transformation[] = [];

        if (part.mirroredX || part.mirroredY) {
            transformations.push({
                type: 'scale',
                scale: {
                    sx: part.mirroredX ? -1 : 1,
                    sy: part.mirroredY ? -1 : 1,
                },
                origin: pivot,
            });
        }

        if (part.rotation !== 0) {
            transformations.push({
                type: 'rotate',
                rotation: {
                    angle: (part.rotation * Math.PI) / 180,
                    origin: pivot,
                },
            });
        }

        if (part.position.x !== 0 || part.position.y !== 0) {
            transformations.push({
                type: 'translate',
                translation: { dx: part.position.x, dy: part.position.y },
            });
        }

        return transformations;
    };

    const sampleCircle = (center: Point, radius: number, segments = 48): Point[] => {
        if (radius <= 0) return [];
        const points: Point[] = [];
        for (let i = 0; i <= segments; i += 1) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle),
            });
        }
        return points;
    };

    const sampleArc = (
        center: Point,
        radius: number,
        startAngle: number,
        endAngle: number,
        segments = 36,
    ): Point[] => {
        if (radius <= 0) return [];
        let normalizedStart = normalizeAngleToRadians(startAngle);
        let normalizedEnd = normalizeAngleToRadians(endAngle);
        if (normalizedEnd <= normalizedStart) {
            normalizedEnd += Math.PI * 2;
        }
        const span = normalizedEnd - normalizedStart;
        const segmentCount = Math.max(8, Math.ceil((span / (Math.PI * 2)) * segments));
        const points: Point[] = [];
        for (let i = 0; i <= segmentCount; i += 1) {
            const t = i / segmentCount;
            const angle = normalizedStart + span * t;
            points.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle),
            });
        }
        return points;
    };

    const sampleEllipse = (
        center: Point,
        majorAxis: Point,
        ratio: number,
        startAngle: number,
        endAngle: number,
        segments = 48,
    ): Point[] => {
        const radiusX = Math.sqrt(majorAxis.x * majorAxis.x + majorAxis.y * majorAxis.y);
        if (!Number.isFinite(radiusX) || radiusX <= 0) return [];
        const radiusY = radiusX * ratio;
        const rotation = Math.atan2(majorAxis.y, majorAxis.x);
        let normalizedStart = normalizeAngleToRadians(startAngle);
        let normalizedEnd = normalizeAngleToRadians(endAngle);
        if (normalizedEnd <= normalizedStart) {
            normalizedEnd += Math.PI * 2;
        }
        const span = normalizedEnd - normalizedStart;
        const segmentCount = Math.max(12, Math.ceil((span / (Math.PI * 2)) * segments));
        const points: Point[] = [];
        for (let i = 0; i <= segmentCount; i += 1) {
            const t = i / segmentCount;
            const angle = normalizedStart + span * t;
            const localX = radiusX * Math.cos(angle);
            const localY = radiusY * Math.sin(angle);
            const rotatedX = localX * Math.cos(rotation) - localY * Math.sin(rotation);
            const rotatedY = localX * Math.sin(rotation) + localY * Math.cos(rotation);
            points.push({ x: center.x + rotatedX, y: center.y + rotatedY });
        }
        return points;
    };

    const contourFromEntity = (entity: Entity): { points: Point[]; closed: boolean } | null => {
        const type = String(entity.type ?? '').toUpperCase();
        const geometry = (entity.geometry ?? {}) as Record<string, unknown>;

        if (type === 'LINE') {
            const start = toPoint(geometry.start);
            const end = toPoint(geometry.end);
            if (!start || !end) return null;
            return { points: [start, end], closed: false };
        }

        if (type === 'LWPOLYLINE' || type === 'POLYLINE') {
            const points = toPoints(geometry.points);
            if (points.length < 2) return null;
            const closed = Boolean(geometry.closed ?? geometry.isClosed);
            return { points, closed };
        }

        if (type === 'CIRCLE') {
            const center = toPoint(geometry.center);
            const radius = Number(geometry.radius);
            if (!center || !Number.isFinite(radius)) return null;
            return { points: sampleCircle(center, radius), closed: true };
        }

        if (type === 'ARC') {
            const center = toPoint(geometry.center);
            const radius = Number(geometry.radius);
            const startAngle = Number(geometry.startAngle ?? geometry.startangle ?? 0);
            const endAngle = Number(geometry.endAngle ?? geometry.endangle ?? 0);
            if (!center || !Number.isFinite(radius) || !Number.isFinite(startAngle) || !Number.isFinite(endAngle)) {
                return null;
            }
            return { points: sampleArc(center, radius, startAngle, endAngle), closed: false };
        }

        if (type === 'SPLINE') {
            const points = toPoints(geometry.points ?? geometry.controlPoints);
            if (points.length < 2) return null;
            const closed = Boolean(geometry.closed ?? geometry.isClosed);
            return { points, closed };
        }

        if (type === 'ELLIPSE') {
            const center = toPoint(geometry.center);
            const axis = toPoint(geometry.majorAxis ?? geometry.majorAxisEndPoint);
            const ratio = Number(geometry.ratio ?? geometry.minorAxisRatio ?? 1);
            const startAngle = Number(geometry.startAngle ?? 0);
            const endAngle = Number(geometry.endAngle ?? Math.PI * 2);
            if (!center || !axis || !Number.isFinite(ratio) || ratio <= 0) return null;
            const points = sampleEllipse(center, axis, ratio, startAngle, endAngle);
            let span = normalizeAngleToRadians(endAngle) - normalizeAngleToRadians(startAngle);
            if (span <= 0) span += Math.PI * 2;
            const closed = Math.abs(span - Math.PI * 2) < 1e-3;
            return { points, closed };
        }

        return null;
    };

    // Calculate utilization and other stats
    const stats = useMemo(() => {
        const plateArea = plate.width * plate.height;
        let partsArea = 0;

        // Better approximation: Use the bounding box of the part entities
        parts.forEach(p => {
            const w = p.boundingBox.maxX - p.boundingBox.minX;
            const h = p.boundingBox.maxY - p.boundingBox.minY;
            partsArea += w * h * 0.7; // 0.7 factor for non-rectangular shapes
        });

        const utilization = plateArea > 0 ? (partsArea / plateArea) * 100 : 0;
        return {
            utilization: utilization.toFixed(1),
            count: parts.length
        };
    }, [plate, parts]);

    const thumbnailContours = useMemo(() => {
        const contours: ThumbnailContour[] = [];

        parts.forEach((part) => {
            const transformations = buildPartTransformations(part);
            const transformedEntities = Array.isArray(part.entities)
                ? part.entities.map((entity) =>
                    transformations.length > 0 ? transformEntity(entity, transformations) : entity,
                )
                : [];

            transformedEntities.forEach((entity, index) => {
                const contour = contourFromEntity(entity);
                if (!contour || contour.points.length < 2) return;
                const points = contour.points.map((point) => ({
                    x: point.x - plate.position.x,
                    y: point.y - plate.position.y,
                }));
                const processCode = resolveProcessCode(
                    entity as unknown as Record<string, unknown>,
                    part as unknown as Record<string, unknown>,
                );
                contours.push({
                    id: `${part.id}-${String(entity.id ?? index)}`,
                    points,
                    closed: contour.closed,
                    stroke: resolveProcessStrokeColor(processCode),
                });
            });
        });

        return contours;
    }, [parts, plate.position.x, plate.position.y]);

    // Generate SVG Thumbnail
    const thumbnail = useMemo(() => {
        const padding = 10;
        const viewBox = `${-padding} ${-padding} ${plate.width + padding * 2} ${plate.height + padding * 2}`;

        // Thumbnail colors need to work on both backgrounds or be consistent
        // We'll keep a dark-ish aesthetic for the thumbnail itself as it represents the canvas usually
        const thumbBg = theme === 'dark' ? '#1e1e1e' : '#f0f0f0';
        const plateFill = theme === 'dark' ? '#333' : '#fff';
        const plateStroke = theme === 'dark' ? '#555' : '#ccc';

        return (
            <svg
                viewBox={viewBox}
                style={{ width: '100%', height: '100%', backgroundColor: thumbBg }}
            >
                {/* Plate Boundary */}
                <rect
                    x={0} y={0}
                    width={plate.width} height={plate.height}
                    fill={plateFill}
                    stroke={plateStroke}
                    strokeWidth={2}
                />

                {/* Part contours */}
                {thumbnailContours.map((contour) => {
                    const points = contour.points.map((point) => `${point.x},${point.y}`).join(' ');
                    if (!points) return null;
                    if (contour.closed) {
                        return (
                            <polygon
                                key={contour.id}
                                points={points}
                                fill="none"
                                stroke={contour.stroke}
                                strokeWidth={1.2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        );
                    }
                    return (
                        <polyline
                            key={contour.id}
                            points={points}
                            fill="none"
                            stroke={contour.stroke}
                            strokeWidth={1.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    );
                })}
            </svg>
        );
    }, [plate, theme, thumbnailContours]);

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            padding: '8px',
            marginBottom: '8px',
            borderRadius: '6px',
            backgroundColor: isSelected ? '#3b82f6' : (theme === 'dark' ? '#2a2a2a' : '#ffffff'),
            border: isSelected ? '1px solid #60a5fa' : (theme === 'dark' ? '1px solid #444' : '1px solid #ddd'),
            cursor: 'pointer',
            color: isSelected ? 'white' : (theme === 'dark' ? '#ddd' : '#333'),
            transition: 'all 0.2s',
            position: 'relative' as const,
            boxShadow: theme === 'dark' ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
        },
        headerSubtitle: {
            opacity: 0.8,
            color: isSelected ? 'rgba(255,255,255,0.9)' : (theme === 'dark' ? '#aaa' : '#666')
        },
        stats: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            opacity: 0.8,
            color: isSelected ? 'rgba(255,255,255,0.9)' : (theme === 'dark' ? '#aaa' : '#666')
        },
        deleteBtn: {
            position: 'absolute' as const,
            top: '4px',
            right: '4px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(0,0,0,0.1)',
            color: isSelected ? '#fff' : (theme === 'dark' ? '#ccc' : '#666'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
        }
    };

    return (
        <div
            onClick={onSelect}
            style={styles.container}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>{plate.name}</span>
                <span style={styles.headerSubtitle}>{plate.width}x{plate.height}</span>
            </div>

            {/* Thumbnail */}
            <div style={{
                height: '80px',
                marginBottom: '8px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
            }}>
                {thumbnail}
            </div>

            {/* Footer Stats */}
            <div style={styles.stats}>
                <span>Parts: {stats.count}</span>
                <span>Util: {stats.utilization}%</span>
            </div>

            {/* Delete/Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(e);
                }}
                title="Delete Plate"
                style={styles.deleteBtn}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
            >
                ×
            </button>
        </div>
    );
};
