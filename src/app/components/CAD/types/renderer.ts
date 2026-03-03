// src/pages/UniversalCADViewTest/components/types/renderer.ts
export interface ICADRenderer {
  /** Initialise the renderer with a canvas element */
  init(canvas: HTMLCanvasElement): Promise<void>;

  /** Render a list of entities */
  render(
    entities: import("../../../lib/webgpu/EntityToVertices").Entity[],
    theme?: "dark" | "light",
    options?: {
      selectedEntityIds?: Set<string>;
      hoveredEntityId?: string | null;
      partsForFilling?: any[];
      selectedPartIds?: string[];
      selectedPartId?: string | null;
      previewEntities?: import("../../../lib/webgpu/EntityToVertices").Entity[];
      /** Drag preview for real-time visual offset (partId + offset) */
      partDragPreview?: { partId: string; offset: { x: number; y: number } };
      invalidPartIds?: Set<string>;
    },
  ): void;

  /** Optimised buffer update pathway */
  updateBuffers?(
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
      dynamicEntities?: import("../../../lib/webgpu/EntityToVertices").Entity[];
      previewEntities?: import("../../../lib/webgpu/EntityToVertices").Entity[];
      allEntities?: import("../../../lib/webgpu/EntityToVertices").Entity[];
    },
    theme?: "dark" | "light",
    options?: {
      selectedEntityIds?: Set<string>;
      hoveredEntityId?: string | null;
      partsForFilling?: any[];
      selectedPartIds?: string[];
      selectedPartId?: string | null;
      partDragPreview?: { partId: string; offset: { x: number; y: number } };
      invalidPartIds?: Set<string>;
    },
  ): void;

  /** Resize the drawing surface */
  resize(width: number, height: number): void;

  /** Release GPU/WebGL resources */
  dispose(): void;

  /** Update viewport parameters */
  setViewport(zoom: number, panX: number, panY: number): void;

  /** New viewport update hook without forcing buffer rebuild */
  updateViewport?(zoom: number, panX: number, panY: number): void;

  /** Renderer type identifier */
  readonly type: "WebGPU" | "WebGL" | "Canvas2D";

  /** Set background color (hex string) */
  setBackgroundColor?(color: string): void;

  /** Optional stats hook */
  getStats?(): { staticBuffers: number; lastUploadMs?: number } | undefined;
}
