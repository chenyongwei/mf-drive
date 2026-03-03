/// <reference types="./webgpu" />

import {
  createBuffers as createBuffersImpl,
  createVertexBuffer as createVertexBufferImpl,
  updateBuffer as updateBufferImpl,
  updateTextVertices as updateTextVerticesImpl,
} from "./WebGPUEngine.buffers";
import { createRenderPipelines as createRenderPipelinesImpl } from "./WebGPUEngine.pipeline";
import { renderEngine } from "./WebGPUEngine.render";

const BU = {
  MAP_READ: 0x1,
  MAP_WRITE: 0x2,
  COPY_SRC: 0x4,
  COPY_DST: 0x8,
  INDEX: 0x10,
  VERTEX: 0x20,
  UNIFORM: 0x40,
  STORAGE: 0x80,
  INDIRECT: 0x100,
  QUERY_RESOLVE: 0x200,
};

export interface Vertex {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export class TextQuad {
  texture!: GPUTexture;
  sampler!: GPUSampler;
  vertices!: Float32Array;
  vertexCount!: number;
}

export class WebGPUEngine {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat | null = null;
  private linePipeline: GPURenderPipeline | null = null;
  private trianglePipeline: GPURenderPipeline | null = null;
  private stencilMaskPipeline: GPURenderPipeline | null = null;
  private stencilFillPipeline: GPURenderPipeline | null = null;
  private textPipeline: GPURenderPipeline | null = null;

  private staticVertexBuffer: GPUBuffer | null = null;
  private staticOuterVertexBuffer: GPUBuffer | null = null;
  private staticHoleVertexBuffer: GPUBuffer | null = null;
  private staticVertexCount: number = 0;
  private staticOuterVertexCount: number = 0;
  private staticHoleVertexCount: number = 0;

  private depthStencilTexture: GPUTexture | null = null;

  private overlayVertexBuffer: GPUBuffer | null = null;
  private overlayFillVertexBuffer: GPUBuffer | null = null;
  private overlayVertexCount: number = 0;
  private overlayFillVertexCount: number = 0;

  private textVertexBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private textBindGroupLayout: GPUBindGroupLayout | null = null;

  private textBindGroupCache = new Map<
    string,
    { bindGroup: GPUBindGroup; texture: GPUTexture }
  >();
  private textBindGroupCacheId = 0;

  private maxVertices: number = 50000000;
  private maxFillVertices: number = 50000000;
  private maxTextVertices: number = 1000000;

  private clearColor = { r: 0, g: 0, b: 0, a: 1 };

  constructor(private canvas: HTMLCanvasElement) {}

  getDevice(): GPUDevice | null {
    return this.device;
  }

  async initialize(): Promise<boolean> {
    if (!navigator.gpu) {
      console.warn("WebGPU not supported");
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.warn("No WebGPU adapter found");
        return false;
      }

      this.device = await adapter.requestDevice();
      this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;

      if (!this.device || !this.context) {
        console.warn("Failed to initialize WebGPU");
        return false;
      }

      this.format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: this.format,
        // Use premultiplied alpha so transparent clears can reveal DOM overlays
        // (e.g. nesting plates rendered beneath the WebGPU canvas).
        alphaMode: "premultiplied",
      });

      await this.createRenderPipelines();
      this.createBuffers();
      return true;
    } catch (error) {
      console.error("WebGPU initialization error:", error);
      return false;
    }
  }

  private async createRenderPipelines(): Promise<void> {
    await createRenderPipelinesImpl(this as any);
  }

  private createBuffers(): void {
    createBuffersImpl(this as any, BU);
  }

  private createVertexBuffer(vertexCount: number): GPUBuffer {
    return createVertexBufferImpl(this as any, BU, vertexCount);
  }

  createMatrix(
    zoom: number,
    panX: number,
    panY: number,
    width: number,
    height: number,
  ): Float32Array {
    const matrix = new Float32Array(16);
    matrix[0] = (2.0 * zoom) / width;
    matrix[1] = 0;
    matrix[2] = 0;
    matrix[3] = 0;

    matrix[4] = 0;
    matrix[5] = (-2.0 * zoom) / height;
    matrix[6] = 0;
    matrix[7] = 0;

    matrix[8] = 0;
    matrix[9] = 0;
    matrix[10] = 1;
    matrix[11] = 0;

    matrix[12] = (2.0 * panX) / width - 1;
    matrix[13] = (-2.0 * panY) / height + 1;
    matrix[14] = 0;
    matrix[15] = 1;
    return matrix;
  }

  private updateBuffer(
    buffer: GPUBuffer | null,
    vertices: Vertex[] | Float32Array,
    vertexCount: number,
    maxLimit: number,
    stride: number = 24,
  ): { buffer: GPUBuffer | null; count: number } {
    return updateBufferImpl(this as any, BU, buffer, vertices, vertexCount, maxLimit, stride);
  }

  updateStaticVertices(vertices: Vertex[] | Float32Array, vertexCount: number): void {
    const result = this.updateBuffer(this.staticVertexBuffer, vertices, vertexCount, this.maxVertices);
    this.staticVertexBuffer = result.buffer;
    this.staticVertexCount = result.count;
  }

  updateStaticFillVertices(
    outerVertices: Vertex[] | Float32Array,
    outerCount: number,
    holeVertices: Vertex[] | Float32Array,
    holeCount: number,
  ): void {
    const r1 = this.updateBuffer(this.staticOuterVertexBuffer, outerVertices, outerCount, this.maxFillVertices);
    this.staticOuterVertexBuffer = r1.buffer;
    this.staticOuterVertexCount = r1.count;

    const r2 = this.updateBuffer(this.staticHoleVertexBuffer, holeVertices, holeCount, this.maxFillVertices);
    this.staticHoleVertexBuffer = r2.buffer;
    this.staticHoleVertexCount = r2.count;
  }

  updateOverlayVertices(vertices: Vertex[] | Float32Array, vertexCount: number): void {
    const result = this.updateBuffer(this.overlayVertexBuffer, vertices, vertexCount, this.maxVertices);
    this.overlayVertexBuffer = result.buffer;
    this.overlayVertexCount = result.count;
  }

  updateOverlayFillVertices(vertices: Vertex[] | Float32Array, vertexCount: number): void {
    const result = this.updateBuffer(this.overlayFillVertexBuffer, vertices, vertexCount, this.maxFillVertices);
    this.overlayFillVertexBuffer = result.buffer;
    this.overlayFillVertexCount = result.count;
  }

  updateVertices(vertices: Vertex[], vertexCount: number): void {
    this.updateStaticVertices(vertices, vertexCount);
  }

  updateFillVertices(vertices: Vertex[], vertexCount: number): void {
    this.updateStaticFillVertices(vertices, vertexCount);
  }

  updateTextVertices(vertices: Float32Array, vertexCount: number): void {
    updateTextVerticesImpl(this as any, BU, vertices, vertexCount);
  }

  setBackgroundColor(color: string): void {
    const normalized = color.trim().toLowerCase();
    if (normalized === "transparent") {
      this.clearColor = { r: 0, g: 0, b: 0, a: 0 };
      return;
    }
    if (normalized.startsWith("#")) {
      const hex = normalized.substring(1);
      this.clearColor = {
        r: parseInt(hex.substring(0, 2), 16) / 255,
        g: parseInt(hex.substring(2, 4), 16) / 255,
        b: parseInt(hex.substring(4, 6), 16) / 255,
        a: 1,
      };
      return;
    }
    const rgbaMatch = normalized.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);
    if (rgbaMatch) {
      this.clearColor = {
        r: Math.min(255, Number(rgbaMatch[1])) / 255,
        g: Math.min(255, Number(rgbaMatch[2])) / 255,
        b: Math.min(255, Number(rgbaMatch[3])) / 255,
        a: Math.max(0, Math.min(1, Number(rgbaMatch[4]))),
      };
    }
  }

  render(
    zoom: number,
    panX: number,
    panY: number,
    width: number,
    height: number,
    vertexCount: number,
    fillVertexCount: number = 0,
    textQuads: TextQuad[] = [],
  ): void {
    void vertexCount;
    void fillVertexCount;
    renderEngine(this as any, zoom, panX, panY, width, height, textQuads);
  }

  cleanup(): void {
    this.textBindGroupCache.clear();
    this.uniformBuffer?.destroy();
    this.staticVertexBuffer?.destroy();
    this.staticOuterVertexBuffer?.destroy();
    this.staticHoleVertexBuffer?.destroy();
    this.overlayVertexBuffer?.destroy();
    this.overlayFillVertexBuffer?.destroy();
    this.textVertexBuffer?.destroy();
  }

  ensureDepthStencilTexture(width: number, height: number): void {
    if (!this.device) return;
    if (
      this.depthStencilTexture &&
      this.depthStencilTexture.width === width &&
      this.depthStencilTexture.height === height
    ) {
      return;
    }

    this.depthStencilTexture?.destroy();
    this.depthStencilTexture = this.device.createTexture({
      size: [width, height],
      format: "depth24plus-stencil8",
      usage: 16,
    });
  }
}
