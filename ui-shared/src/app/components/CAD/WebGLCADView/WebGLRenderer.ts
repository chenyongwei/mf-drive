import { ICADRenderer } from '../types/renderer';
import { Entity, convertEntitiesToTypedArray } from '../../../lib/webgpu/EntityToVertices';
import { syncStaticBuffers, updateDynamicBuffer } from './WebGLRenderer.buffer-utils';
import { drawFill, drawHighlights, drawLines } from './WebGLRenderer.draw-utils';
import { buildFillGeometry, createFillSignature } from './WebGLRenderer.fill-utils';
import { createMatrix, createWebGLProgram, parseBackgroundColor } from './WebGLRenderer.gl-utils';
import type {
  FillDrawCommand,
  FillPart,
  RenderOptions,
  StaticBufferRecord,
  StaticFileBufferPayload,
  ThemeMode,
  UpdateBuffersPayload,
} from './WebGLRenderer.types';

/** WebGL renderer that draws colored lines and filled parts for CAD entities */
export class WebGLRenderer implements ICADRenderer {
  readonly type = 'WebGL';
  private gl: WebGLRenderingContext | null = null;
  private program!: WebGLProgram;
  private overlayVertexBuffer!: WebGLBuffer;
  private fillVertexBuffer!: WebGLBuffer;
  private dynamicVertexBuffer: WebGLBuffer | null = null;
  private viewport = { zoom: 1, panX: 0, panY: 0 };
  private size = { width: 800, height: 600 };
  private lastEntities: Entity[] = [];
  private lastTheme: ThemeMode = 'dark';
  private lastOptions: RenderOptions = {};
  private bgColor = '#000000';
  private staticBuffers = new Map<string, StaticBufferRecord>();
  private dynamicVertexCount = 0;
  private fillSignature: string | null = null;
  private fillDrawCommands: FillDrawCommand[] = [];
  private fillVertexCount = 0;
  private telemetry = { lastUploadMs: 0, lastVertexCount: 0 };

  async init(canvas: HTMLCanvasElement): Promise<void> {
    const gl = canvas.getContext('webgl', { stencil: true, alpha: true, antialias: true });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.program = createWebGLProgram(gl);

    const overlayVertexBuffer = gl.createBuffer();
    const fillVertexBuffer = gl.createBuffer();
    const dynamicVertexBuffer = gl.createBuffer();
    if (!overlayVertexBuffer || !fillVertexBuffer || !dynamicVertexBuffer) {
      throw new Error('WebGL buffer allocation failed');
    }

    this.overlayVertexBuffer = overlayVertexBuffer;
    this.fillVertexBuffer = fillVertexBuffer;
    this.dynamicVertexBuffer = dynamicVertexBuffer;
    gl.useProgram(this.program);
  }

  updateBuffers(payload: UpdateBuffersPayload, theme: ThemeMode = 'dark', options?: RenderOptions): void {
    this.lastTheme = theme;
    this.lastOptions = options ?? {};
    if (payload.allEntities) this.lastEntities = payload.allEntities;
    if (!this.gl) return;

    if (payload.staticFileBuffers) {
      this.syncStaticBuffers(payload.staticFileBuffers);
    } else if (this.staticBuffers.size > 0) {
      this.clearStaticBuffers();
    }

    this.updateDynamicBuffer(payload.dynamicEntities ?? payload.allEntities ?? [], theme);
    this.ensureFillBuffer(
      this.lastOptions.partsForFilling ?? [],
      theme,
      this.lastOptions.invalidPartIds,
    );
    this.drawCurrentFrame();
  }

  render(entities: Entity[], theme: ThemeMode = 'dark', options?: RenderOptions): void {
    const typed = convertEntitiesToTypedArray(entities, theme);
    this.updateBuffers(
      {
        staticFileBuffers: [
          {
            fileId: '__legacy__',
            vertexCount: typed.length / 6,
            entityCount: entities.length,
            buffer: typed,
            signature: `legacy-${entities.length}`,
            dirty: true,
            visible: true,
          },
        ],
        dynamicEntities: [],
        allEntities: entities,
      },
      theme,
      options,
    );
  }

  setViewport(zoom: number, panX: number, panY: number): void {
    this.updateViewport(zoom, panX, panY);
  }

  updateViewport(zoom: number, panX: number, panY: number): void {
    this.viewport = { zoom, panX, panY };
    this.drawCurrentFrame();
  }

  resize(width: number, height: number): void {
    this.size = { width, height };
    if (this.gl && this.gl.canvas instanceof HTMLCanvasElement) {
      this.gl.canvas.width = width;
      this.gl.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
    this.drawCurrentFrame();
  }

  dispose(): void {
    const gl = this.gl;
    if (!gl) return;

    gl.deleteBuffer(this.overlayVertexBuffer);
    gl.deleteBuffer(this.fillVertexBuffer);
    if (this.dynamicVertexBuffer) gl.deleteBuffer(this.dynamicVertexBuffer);
    this.staticBuffers.forEach((record) => gl.deleteBuffer(record.buffer));
    this.staticBuffers.clear();
    gl.deleteProgram(this.program);
  }

  setBackgroundColor(color: string): void {
    this.bgColor = color;
    this.drawCurrentFrame();
  }

  getStats(): { staticBuffers: number; lastUploadMs: number; fillVertices: number } {
    return {
      staticBuffers: this.staticBuffers.size,
      lastUploadMs: this.telemetry.lastUploadMs,
      fillVertices: this.fillVertexCount,
    };
  }

  private syncStaticBuffers(staticFileBuffers: StaticFileBufferPayload[]): void {
    if (!this.gl) return;
    const uploadStart = performance.now();
    const uploadedVertices = syncStaticBuffers(this.gl, this.staticBuffers, staticFileBuffers);
    if (uploadedVertices > 0) {
      this.recordTelemetry(performance.now() - uploadStart, uploadedVertices);
    }
  }

  private clearStaticBuffers(): void {
    if (!this.gl) return;
    this.staticBuffers.forEach((record) => this.gl?.deleteBuffer(record.buffer));
    this.staticBuffers.clear();
  }

  private updateDynamicBuffer(entities: Entity[], theme: ThemeMode): void {
    if (!this.gl) {
      this.dynamicVertexCount = 0;
      return;
    }
    this.dynamicVertexCount = updateDynamicBuffer(this.gl, this.dynamicVertexBuffer, entities, theme);
  }

  private ensureFillBuffer(
    parts: FillPart[],
    theme: ThemeMode,
    invalidPartIds: Set<string> | undefined,
  ): void {
    if (!this.gl) return;
    if (parts.length === 0) {
      this.fillVertexCount = 0;
      this.fillDrawCommands = [];
      this.fillSignature = 'empty';
      return;
    }

    const signature = createFillSignature(parts, invalidPartIds);
    if (signature === this.fillSignature) return;

    const geometry = buildFillGeometry(parts, theme, invalidPartIds);
    if (geometry.vertexCount === 0) {
      this.fillVertexCount = 0;
      this.fillDrawCommands = [];
      this.fillSignature = signature;
      return;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fillVertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, geometry.data, this.gl.STATIC_DRAW);
    this.fillVertexCount = geometry.vertexCount;
    this.fillDrawCommands = geometry.drawCommands;
    this.fillSignature = signature;
  }

  private recordTelemetry(uploadMs: number, vertexCount: number): void {
    this.telemetry.lastUploadMs = uploadMs;
    this.telemetry.lastVertexCount = vertexCount;
    (window as { __CAD_PERF__?: Record<string, unknown> }).__CAD_PERF__ = {
      lastUploadMs: uploadMs,
      lastVertexCount: vertexCount,
      timestamp: Date.now(),
    };
  }

  private drawCurrentFrame(): void {
    const gl = this.gl;
    if (!gl) return;

    gl.useProgram(this.program);
    gl.viewport(0, 0, this.size.width, this.size.height);
    gl.colorMask(true, true, true, true);

    const clearColor = parseBackgroundColor(this.bgColor, this.lastTheme);
    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    const uTransform = gl.getUniformLocation(this.program, 'uTransform');
    if (uTransform) {
      const matrix = createMatrix(
        this.viewport.zoom,
        this.viewport.panX,
        this.viewport.panY,
        this.size.width,
        this.size.height,
      );
      gl.uniformMatrix4fv(uTransform, false, matrix);
    }

    drawFill(gl, this.program, this.fillVertexBuffer, this.fillVertexCount, this.fillDrawCommands);
    drawLines(gl, this.program, this.staticBuffers, this.dynamicVertexBuffer, this.dynamicVertexCount);
    drawHighlights(
      gl,
      this.program,
      this.overlayVertexBuffer,
      this.lastEntities,
      this.lastTheme,
      this.lastOptions,
      this.viewport.zoom,
    );
  }
}
