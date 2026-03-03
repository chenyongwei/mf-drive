// src/pages/UniversalCADViewTest/components/Canvas2DCADView/Canvas2DRenderer.ts
import { ICADRenderer } from '../types/renderer';
import { Entity } from '../../../lib/webgpu/EntityToVertices';
import {
    parseCanvasColor,
    renderPartFills,
    type Canvas2DRenderOptions,
} from './Canvas2DRenderer.layers';

/**
 * CPU-based Canvas 2D renderer for maximum compatibility.
 * Used when neither WebGPU nor WebGL is available (e.g. headless environments).
 */
export class Canvas2DRenderer implements ICADRenderer {
    readonly type = 'Canvas2D';
    private ctx!: CanvasRenderingContext2D;
    private canvas!: HTMLCanvasElement;
    private viewport = { zoom: 1, panX: 0, panY: 0 };
    private size = { width: 800, height: 600 };
    private lastEntities: Entity[] = [];
    private lastTheme: 'dark' | 'light' = 'dark';
    private bgColor: string = '#000000';
    public lastPartsForFilling: any[] = [];
    private lastOptions: Canvas2DRenderOptions = {};
    private isTransparentBackground(color: string): boolean {
        const normalized = color.trim().toLowerCase();
        if (normalized === 'transparent') return true;
        const rgbaMatch = normalized.match(/^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/);
        return !!rgbaMatch && Number(rgbaMatch[1]) === 0;
    }

    async init(canvas: HTMLCanvasElement): Promise<void> {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D not supported');
        this.ctx = ctx;

        // Initial setup
        this.resize(canvas.width, canvas.height);
    }

    render(entities: Entity[], theme: 'dark' | 'light' = 'dark', options?: Canvas2DRenderOptions): void {
        const ctx = this.ctx;
        if (!ctx) return;

        this.lastEntities = entities;
        this.lastTheme = theme;
        this.lastOptions = options || {};

        // Store for testing/debugging
        this.lastPartsForFilling = options?.partsForFilling || [];
        const partsForFilling = this.lastPartsForFilling;

        // Expose renderer for testing
        if (typeof window !== 'undefined') {
            (window as any).__DEBUG_RENDERER__ = this;
            (this as any).worldToScreen = (x: number, y: number) => {
                return {
                    x: x * this.viewport.zoom + this.viewport.panX,
                    y: y * this.viewport.zoom + this.viewport.panY
                };
            };
        }

        // Apply selection/hover state to entities
        const entitiesWithState = entities.map(entity => {
            const isSelected = options?.selectedEntityIds?.has(entity.id) || false;
            const isHovered = options?.hoveredEntityId === entity.id;

            if (entity.isSelected === isSelected && entity.isHovered === isHovered) {
                return entity;
            }

            return {
                ...entity,
                isSelected,
                isHovered,
            };
        });

        // Clear canvas with standard background
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.size.width, this.size.height);
        if (!this.isTransparentBackground(this.bgColor)) {
            ctx.fillStyle = this.bgColor;
            ctx.fillRect(0, 0, this.size.width, this.size.height);
        }

        // Save state before transform
        ctx.save();

        // Apply viewport transform
        // Canvas transform: translate(panX, panY) -> scale(zoom, zoom)
        // Note: Y-axis in Canvas2D is down, but in our CAD system (and WebGL) it might be up.
        // Usually CAD Y is up. To flip Y, we translate to bottom and scale Y by -1?
        // Let's check how WebGPUEngine handles it.
        // WebGPUEngine matrix:
        // matrix[5] = (-2.0 * zoom) / height; // Flip Y axis
        // This implies screen coordinate 0 is top, height is bottom?
        // No, standard WebGPU NDC is -1 bottom, 1 top.
        // If we want world Y+ to be up on screen:
        // Screen Y = Height - (WorldY * Zoom + PanY) ?

        // Let's stick to simple transform first matching the inputs:
        // ScreenX = WorldX * Zoom + PanX
        // ScreenY = WorldY * Zoom + PanY
        // NOTE: If Pan/Zoom are already in screen pixels relative to origin.

        ctx.translate(this.viewport.panX, this.viewport.panY);
        ctx.scale(this.viewport.zoom, this.viewport.zoom);

        const parseColor = (color: unknown): string => parseCanvasColor(color, theme);

        // 1. Render Part Fills (Bottom Layer)
        renderPartFills(ctx, partsForFilling, options, parseColor);

        // Render entities
        // Currently supports: LINE, CIRCLE, ARC, LWPOLYLINE, SPLINE, ELLIPSE
        ctx.lineWidth = 1 / this.viewport.zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';



        const getStrokeStyle = (entity: Entity) => {
            if (entity.isSelected) return '#4A9EFF';
            if (entity.isHovered) return '#ffff00'; // Pure Yellow
            // Part style should override source strokeColor so recognized parts are visually obvious.
            const color = entity.isPart
                ? (entity.partColor || 3)
                : (entity.strokeColor || entity.color);
            return parseColor(color);
        };

        entitiesWithState.forEach(entity => {
            ctx.beginPath();
            const type = (entity.type || '').toUpperCase();

            // Setup stroke style and width
            ctx.strokeStyle = getStrokeStyle(entity);
            if (entity.isHovered || entity.isSelected) {
                ctx.lineWidth = (entity.isHovered ? 2.5 : 2.0) / this.viewport.zoom;
            } else {
                ctx.lineWidth = 1.0 / this.viewport.zoom;
            }

            let isClosed = false;

            if (type === 'LINE' && entity.geometry?.start && entity.geometry?.end) {
                ctx.moveTo(entity.geometry.start.x, entity.geometry.start.y);
                ctx.lineTo(entity.geometry.end.x, entity.geometry.end.y);
            } else if ((type === 'CIRCLE' || type === 'ARC') && entity.geometry?.center && entity.geometry?.radius) {
                const startAngle = entity.geometry.startAngle ?? 0;
                const endAngle = entity.geometry.endAngle ?? 2 * Math.PI;
                ctx.arc(
                    entity.geometry.center.x,
                    entity.geometry.center.y,
                    entity.geometry.radius,
                    startAngle,
                    endAngle
                );
                // Circle is closed if full 2PI (approx) or type is CIRCLE
                if (type === 'CIRCLE') isClosed = true;
            } else if ((type === 'LWPOLYLINE' || type === 'POLYLINE') && entity.geometry?.points) {
                const points = entity.geometry.points;
                if (points.length > 0) {
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    if (entity.geometry.isClosed || entity.geometry.closed) {
                        ctx.closePath();
                        isClosed = true;
                    }
                }
            } else if (type === 'SPLINE' && (entity.geometry?.controlPoints || entity.geometry?.points)) {
                const splinePoints = entity.geometry.controlPoints || entity.geometry.points;
                if (splinePoints && splinePoints.length > 1) {
                    ctx.moveTo(splinePoints[0].x, splinePoints[0].y);
                    for (let i = 1; i < splinePoints.length; i++) {
                        ctx.lineTo(splinePoints[i].x, splinePoints[i].y);
                    }
                    if (entity.geometry.isClosed || entity.geometry.closed) {
                        ctx.closePath(); // Ensure it closes for fill
                        isClosed = true;
                    }
                }
            } else if (type === 'ELLIPSE' && entity.geometry?.center) {
                const { center, majorAxis, ratio, startAngle, endAngle, majorAxisEndPoint } = entity.geometry;
                const axis = majorAxis || majorAxisEndPoint;

                if (center && axis) {
                    const radiusX = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
                    const radiusY = radiusX * (ratio || entity.geometry.minorAxisRatio || 1);
                    const rotation = Math.atan2(axis.y, axis.x);

                    ctx.ellipse(
                        center.x,
                        center.y,
                        radiusX,
                        radiusY,
                        rotation,
                        startAngle || 0,
                        (endAngle !== undefined) ? endAngle : 2 * Math.PI
                    );

                    const delta = ((endAngle !== undefined ? endAngle : 2 * Math.PI) - (startAngle || 0));
                    if (Math.abs(Math.abs(delta) - 2 * Math.PI) < 0.01) {
                        isClosed = true;
                    }
                }
            }



            ctx.stroke();
        });

        ctx.restore();

        // Debug indicator for 2D mode
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Renderer: Canvas2D (${entities.length} entities)`, 10, 20);
        ctx.fillText(`Zoom: ${this.viewport.zoom.toFixed(2)} Pan: ${this.viewport.panX.toFixed(0)},${this.viewport.panY.toFixed(0)}`, 10, 35);
    }

    setViewport(zoom: number, panX: number, panY: number): void {
        this.viewport = { zoom, panX, panY };
        this.render(this.lastEntities, this.lastTheme, this.lastOptions);
    }

    resize(width: number, height: number): void {
        this.size = { width, height };
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        this.render(this.lastEntities, this.lastTheme, this.lastOptions);
    }

    dispose(): void {
        // Nothing to clean up for Context2D
    }

    setBackgroundColor(color: string): void {
        this.bgColor = color;
        this.render(this.lastEntities, this.lastTheme, this.lastOptions);
    }

}
