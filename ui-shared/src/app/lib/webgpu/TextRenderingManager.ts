/**
 * Text Rendering Manager
 *
 * Manages the generation of textured quads for text rendering in WebGPU.
 * Converts text labels into vertex arrays with position and UV coordinates.
 */

import { TextTextureCache, TextTextureOptions } from './TextTextureCache';

export interface TextLabel {
  x: number; // World X coordinate (left edge)
  y: number; // World Y coordinate (baseline position)
  text: string;
  height: number; // Text height in WORLD UNITS (mm)
  color: string; // Text color
}

export interface TextQuad {
  texture: GPUTexture;
  sampler: GPUSampler;
  vertices: Float32Array; // Position (x,y) + UV (u,v) per vertex
  vertexCount: number;
}

export class TextRenderingManager {
  private textureCache: TextTextureCache;
  private sampler: GPUSampler;

  constructor(
    private device: GPUDevice,
    textureCache: TextTextureCache
  ) {
    this.textureCache = textureCache;

    // Create sampler for text textures
    this.sampler = device.createSampler({
      magFilter: 'linear', // Smooth scaling when zoomed in
      minFilter: 'linear', // Smooth scaling when zoomed out
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
  }

  /**
   * Process text labels and generate textured quads
   * @param labels Text labels to render
   * @param zoom Current viewport zoom level
   * @returns Array of textured quads ready for rendering
   */
  async processTextLabels(
    labels: TextLabel[],
    zoom: number
  ): Promise<TextQuad[]> {
    const quads: TextQuad[] = [];

    for (const label of labels) {
      // Convert world height to pixel font size
      const fontSize = Math.max(12, label.height * zoom);

      // Generate or get cached texture
      const textureResult = await this.textureCache.getTexture(
        label.text,
        fontSize,
        {
          color: label.color,
          fontWeight: 'bold',
          padding: 4,
        }
      );

      // Create textured quad vertices
      const vertices = this.createTextQuadVertices(
        label.x,
        label.y,
        textureResult.width,
        textureResult.height,
        textureResult.uvWidth,
        textureResult.uvHeight,
        fontSize
      );

      quads.push({
        texture: textureResult.texture,
        sampler: this.sampler,
        vertices,
        vertexCount: 6, // 2 triangles = 6 vertices
      });
    }

    return quads;
  }

  /**
   * Create vertex array for a text quad (2 triangles)
   * @param x World X coordinate (left edge)
   * @param y World Y coordinate (baseline position, need to flip to top-left)
   * @param textureWidth Texture width in pixels
   * @param textureHeight Texture height in pixels
   * @param uvWidth Normalized U width (0-1)
   * @param uvHeight Normalized V height (0-1)
   * @param fontSize Font size in pixels (for position adjustment)
   * @returns Float32Array of vertices (6 vertices * 4 floats = 24 floats)
   *
   * Vertex format: [x, y, u, v] per vertex
   */
  private createTextQuadVertices(
    x: number,
    y: number,
    textureWidth: number,
    textureHeight: number,
    uvWidth: number,
    uvHeight: number,
    fontSize: number
  ): Float32Array {
    // Adjust Y: input is baseline, but we render from top-left
    // For text, baseline to ascender height is approximately 0.8 * fontSize
    const baselineToTop = fontSize * 0.8;
    const topY = y - baselineToTop;

    // Quad vertices (2 triangles = 6 vertices)
    // Triangle 1: top-left, top-right, bottom-left
    // Triangle 2: top-right, bottom-right, bottom-left
    const vertices = new Float32Array([
      // Triangle 1
      x, topY, 0, 0, // Top-left
      x + textureWidth, topY, uvWidth, 0, // Top-right
      x, topY + textureHeight, 0, uvHeight, // Bottom-left
      // Triangle 2
      x + textureWidth, topY, uvWidth, 0, // Top-right
      x + textureWidth, topY + textureHeight, uvWidth, uvHeight, // Bottom-right
      x, topY + textureHeight, 0, uvHeight, // Bottom-left
    ]);

    return vertices;
  }

  /**
   * Combine multiple text quads into a single vertex buffer
   * Useful for batch rendering
   * @param quads Array of text quads
   * @returns Combined vertex array and texture groups
   */
  combineQuads(quads: TextQuad[]): {
    allVertices: Float32Array;
    textureGroups: Array<{ texture: GPUTexture; sampler: GPUSampler; vertexOffset: number; vertexCount: number }>;
  } {
    const totalVertices = quads.reduce((sum, quad) => sum + quad.vertexCount, 0);
    const allVertices = new Float32Array(totalVertices * 4); // 4 floats per vertex

    const textureGroups: Array<{
      texture: GPUTexture;
      sampler: GPUSampler;
      vertexOffset: number;
      vertexCount: number;
    }> = [];

    let vertexOffset = 0;

    for (const quad of quads) {
      // Copy vertices to combined buffer
      allVertices.set(quad.vertices, vertexOffset * 4);

      // Record texture group for batch rendering
      textureGroups.push({
        texture: quad.texture,
        sampler: quad.sampler,
        vertexOffset: vertexOffset,
        vertexCount: quad.vertexCount,
      });

      vertexOffset += quad.vertexCount;
    }

    return {
      allVertices,
      textureGroups,
    };
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    // Sampler will be destroyed automatically when device is destroyed
    // Texture cache has its own cleanup method
  }
}
