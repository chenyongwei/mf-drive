export interface Canvas2DRenderOptions {
    selectedEntityIds?: Set<string>;
    hoveredEntityId?: string | null;
    partsForFilling?: any[];
    selectedPartIds?: string[];
    selectedPartId?: string | null;
}

interface PartGeometry {
    type?: string;
    geometry?: any;
}

interface FillPart {
    id?: string;
    color?: unknown;
    entities?: PartGeometry[];
    position?: { x: number; y: number };
    rotation?: number;
    mirroredX?: boolean;
    mirroredY?: boolean;
    boundingBox?: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}

export function parseCanvasColor(color: unknown, theme: 'dark' | 'light'): string {
    if (typeof color === 'number') {
        const colors: Record<number, string> = {
            1: '#ff0000',
            2: '#ffff00',
            3: '#00ff00',
            4: '#00ffff',
            5: '#0000ff',
            6: '#ff00ff',
            7: theme === 'dark' ? '#ffffff' : '#000000',
            8: '#808080',
        };
        return colors[color] || (theme === 'dark' ? '#ffffff' : '#000000');
    }
    if (typeof color === 'string') {
        if (color === 'CHANNEL_1') return 'rgba(255, 255, 255, 0.6)';
        if (color === 'CHANNEL_2') return 'rgba(255, 0, 0, 0.6)';
        if (color === 'CHANNEL_3') return 'rgba(0, 255, 255, 0.6)';
        if (color === 'CHANNEL_4') return 'rgba(255, 255, 0, 0.6)';
        return color;
    }
    return theme === 'dark' ? '#ffffff' : '#000000';
}

export function renderPartFills(
    ctx: CanvasRenderingContext2D,
    parts: FillPart[],
    _options: Canvas2DRenderOptions | undefined,
    resolveColor: (color: unknown) => string,
): void {
    if (parts.length === 0) {
        return;
    }

    parts.forEach((part) => {
        if (!part.entities || !part.boundingBox) {
            return;
        }

        const fillColor = resolveColor(part.color || '#ffffff');

        ctx.save();

        const pivot = {
            x: (part.boundingBox.minX + part.boundingBox.maxX) / 2,
            y: (part.boundingBox.minY + part.boundingBox.maxY) / 2,
        };

        if (part.position) {
            ctx.translate(part.position.x, part.position.y);
        }

        ctx.translate(pivot.x, pivot.y);

        if (part.rotation) {
            ctx.rotate((part.rotation * Math.PI) / 180);
        }

        if (part.mirroredX || part.mirroredY) {
            ctx.scale(part.mirroredX ? -1 : 1, part.mirroredY ? -1 : 1);
        }

        ctx.translate(-pivot.x, -pivot.y);

        ctx.beginPath();
        part.entities.forEach((entity) => {
            const type = (entity.type || '').toUpperCase();
            if ((type === 'LWPOLYLINE' || type === 'POLYLINE') && entity.geometry?.points) {
                const points = entity.geometry.points;
                if (points.length > 0) {
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i += 1) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    ctx.closePath();
                }
                return;
            }

            if (type === 'CIRCLE') {
                const { center, radius } = entity.geometry || {};
                if (center && radius) {
                    ctx.moveTo(center.x + radius, center.y);
                    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
                    ctx.closePath();
                }
                return;
            }

            if (type === 'ELLIPSE') {
                const { center, majorAxis, ratio, majorAxisEndPoint } = entity.geometry || {};
                const axis = majorAxis || majorAxisEndPoint;
                if (center && axis) {
                    const radiusX = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
                    const radiusY = radiusX * (ratio || entity.geometry.minorAxisRatio || 1);
                    const rotation = Math.atan2(axis.y, axis.x);
                    ctx.ellipse(center.x, center.y, radiusX, radiusY, rotation, 0, 2 * Math.PI);
                    ctx.closePath();
                }
                return;
            }

            if (type === 'SPLINE') {
                const splinePoints = entity.geometry?.controlPoints || entity.geometry?.points;
                if (splinePoints && splinePoints.length > 1) {
                    ctx.moveTo(splinePoints[0].x, splinePoints[0].y);
                    for (let i = 1; i < splinePoints.length; i += 1) {
                        ctx.lineTo(splinePoints[i].x, splinePoints[i].y);
                    }
                    ctx.closePath();
                }
            }
        });

        ctx.fillStyle = fillColor;
        ctx.fill('evenodd');
        ctx.restore();
    });
}
