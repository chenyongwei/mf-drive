import { ICADRenderer } from '../types/renderer';
import { Entity, convertEntitiesToTypedArray } from '../../../lib/webgpu/EntityToVertices';
import { WebGPUEngine } from '../../../lib/webgpu/WebGPUEngine';
import {
  buildOverlayFillVertexData,
  buildStaticFillBuffers,
  buildStaticVertexData,
  RenderOptions,
} from './WebGPURenderer.helpers';

type RendererOptions = RenderOptions & {
  partsForFilling?: any[];
  partDragPreview?: { partId: string; offset: { x: number; y: number } };
};

export class WebGPURenderer implements ICADRenderer {
  readonly type = 'WebGPU';

  private engine: WebGPUEngine | null = null;

  private canvas: HTMLCanvasElement | null = null;

  private lastEntities: Entity[] = [];

  private lastOptions: RenderOptions = {};

  private viewport = { zoom: 1, panX: 0, panY: 0 };

  private size = { width: 800, height: 600 };

  private lastTheme: 'dark' | 'light' = 'dark';

  private lastPartsForFilling: any[] = [];

  private isStaticDirty = false;

  private isOverlayDirty = false;

  private isOverlayFillDirty = false;

  private isStaticFillDirty = false;

  private staticVertexData: Float32Array | null = null;

  private overlayVertexData: Float32Array | null = null;

  private overlayFillVertexData: Float32Array | null = null;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.engine = new WebGPUEngine(canvas);
    const success = await this.engine.initialize();
    if (!success) {
      throw new Error('WebGPU initialization failed');
    }
  }

  updateBuffers(
    payload: {
      staticFileBuffers?: Array<{
        fileId: string;
        vertexCount: number;
        entityCount: number;
        buffer: Float32Array;
        signature: string;
        dirty: boolean;
        visible: boolean;
      }>;
      dynamicEntities?: Entity[];
      previewEntities?: Entity[];
      allEntities?: Entity[];
    },
    theme: 'dark' | 'light' = 'dark',
    options?: RendererOptions,
  ): void {
    const allEntities = payload.allEntities || payload.dynamicEntities || [];
    this.render(allEntities, theme, {
      ...options,
      previewEntities: payload.previewEntities || [],
    });
  }

  render(
    entities: Entity[],
    theme: 'dark' | 'light' = 'dark',
    options?: RendererOptions,
  ): void {
    const optionsChanged =
      this.lastOptions.selectedEntityIds !== options?.selectedEntityIds ||
      this.lastOptions.hoveredEntityId !== options?.hoveredEntityId ||
      this.lastOptions.invalidPartIds !== options?.invalidPartIds;

    const entitiesChanged = this.lastEntities !== entities;
    const themeChanged = this.lastTheme !== theme;
    const partsChanged =
      this.lastPartsForFilling !== options?.partsForFilling ||
      this.lastOptions.invalidPartIds !== options?.invalidPartIds;
    const previewChanged = this.lastOptions.previewEntities !== options?.previewEntities;

    this.lastEntities = entities;
    this.lastTheme = theme;
    this.lastOptions = options || {};
    this.lastPartsForFilling = options?.partsForFilling || [];

    if (!this.engine) return;

    if (entitiesChanged || themeChanged) {
      this.updateStaticVertices(entities, theme);
    }

    if (partsChanged || themeChanged) {
      this.updateStaticFillVertices(
        this.lastPartsForFilling,
        theme,
        options?.invalidPartIds,
      );
    }

    if (optionsChanged || themeChanged || previewChanged || this.isOverlayDirty) {
      this.updateOverlayVertices(options?.previewEntities || [], theme);
    }

    if (this.isStaticDirty && this.staticVertexData) {
      this.engine.updateStaticVertices(
        this.staticVertexData,
        this.staticVertexData.length / 6,
      );
      this.isStaticDirty = false;
    }

    if (this.isOverlayDirty) {
      this.engine.updateOverlayVertices(
        this.overlayVertexData || new Float32Array(0),
        this.overlayVertexData ? this.overlayVertexData.length / 6 : 0,
      );
      this.isOverlayDirty = false;
    }

    if (this.isOverlayFillDirty) {
      this.engine.updateOverlayFillVertices(
        this.overlayFillVertexData || new Float32Array(0),
        this.overlayFillVertexData ? this.overlayFillVertexData.length / 6 : 0,
      );
      this.isOverlayFillDirty = false;
    }

    this.draw(theme);
  }

  private updateStaticVertices(entities: Entity[], theme: 'dark' | 'light'): void {
    this.staticVertexData = buildStaticVertexData(entities, this.lastPartsForFilling, theme);
    this.isStaticDirty = true;
  }

  private updateStaticFillVertices(
    parts: any[],
    theme: 'dark' | 'light',
    invalidPartIds?: Set<string>,
  ): void {
    const { outerData, holeData, outerCount, holeCount } = buildStaticFillBuffers(
      parts,
      theme,
      invalidPartIds,
    );

    if (this.engine) {
      this.engine.updateStaticFillVertices(outerData, outerCount, holeData, holeCount);
    }

    this.isStaticFillDirty = true;
  }

  private updateOverlayVertices(
    previewEntities: Entity[],
    theme: 'dark' | 'light',
  ): void {
    this.overlayFillVertexData = buildOverlayFillVertexData(
      this.lastEntities,
      this.lastOptions,
      theme,
      this.viewport.zoom,
    );
    this.isOverlayFillDirty = true;

    this.overlayVertexData = previewEntities.length > 0
      ? convertEntitiesToTypedArray(previewEntities, theme)
      : null;
    this.isOverlayDirty = true;
  }

  setViewport(zoom: number, panX: number, panY: number): void {
    const zoomChanged = this.viewport.zoom !== zoom;
    this.viewport = { zoom, panX, panY };

    if (zoomChanged && (this.lastOptions.selectedEntityIds?.size || this.lastOptions.hoveredEntityId)) {
      this.updateOverlayVertices(this.lastOptions.previewEntities || [], this.lastTheme);
    }

    this.draw();
  }

  resize(width: number, height: number): void {
    this.size = { width, height };
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.draw(this.lastTheme);
  }

  dispose(): void {
    if (this.engine) {
      this.engine.cleanup();
      this.engine = null;
    }
    this.staticVertexData = null;
    this.overlayVertexData = null;
    this.overlayFillVertexData = null;
  }

  setBackgroundColor(color: string): void {
    this.engine?.setBackgroundColor(color);
    this.draw(this.lastTheme);
  }

  private draw(theme: 'dark' | 'light' = 'dark'): void {
    if (!this.engine) return;

    this.engine.render(
      this.viewport.zoom,
      this.viewport.panX,
      this.viewport.panY,
      this.size.width,
      this.size.height,
      0,
    );
  }
}
