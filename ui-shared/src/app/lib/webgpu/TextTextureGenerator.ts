/**
 * Text Texture Generator
 *
 * Generates WebGPU textures from text using Canvas 2D API.
 * This allows high-quality font rendering in WebGPU by using Canvas
 * to render text, then converting to GPU textures.
 */

export interface TextTextureOptions {
  color?: string; // Text color (hex or named), default: '#FFFFFF'
  fontFamily?: string; // Font family, default: 'Arial, sans-serif'
  fontWeight?: string; // Font weight, default: 'bold'
  padding?: number; // Padding in pixels, default: 4
  backgroundColor?: string; // Background color for better contrast, default: transparent
}

export interface TextTextureResult {
  texture: GPUTexture;
  width: number;
  height: number;
  uvWidth: number; // Normalized width for UV coordinates
  uvHeight: number; // Normalized height for UV coordinates
}

export class TextTextureGenerator {
  constructor(private device: GPUDevice) {}

  /**
   * Generate a WebGPU texture from text
   * @param text Text string to render
   * @param fontSize Font size in pixels (NOT world units, conversion done elsewhere)
   * @param options Rendering options
   * @returns Texture with dimensions and UV coordinates
   */
  async generateTexture(
    text: string,
    fontSize: number,
    options: TextTextureOptions = {}
  ): Promise<TextTextureResult> {
    const {
      color = '#FFFFFF',
      fontFamily = 'Arial, sans-serif',
      fontWeight = 'bold',
      padding = 4,
      backgroundColor,
    } = options;

    // Create canvas for text rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for text texture generation');
    }

    // Configure font for measurement
    const fontString = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.font = fontString;

    // Measure text dimensions
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(fontSize * 1.2); // Account for descenders/ascenders

    // Set canvas size with padding
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Clear and draw background if specified
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw text
    ctx.font = fontString;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(text, padding, padding);

    // Create ImageBitmap from canvas
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(canvas);
    } catch (error) {
      throw new Error(`Failed to create ImageBitmap: ${error}`);
    }

    // Use actual canvas dimensions for texture (not power of 2)
    const textureWidth = canvas.width;
    const textureHeight = canvas.height;

    // Create WebGPU texture
    const texture = this.device.createTexture({
      size: [textureWidth, textureHeight, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Copy bitmap to texture
    this.device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture },
      [textureWidth, textureHeight]
    );

    // Calculate UV dimensions (actual content size vs texture size)
    const uvWidth = canvas.width / textureWidth;
    const uvHeight = canvas.height / textureHeight;

    return {
      texture,
      width: canvas.width,
      height: canvas.height,
      uvWidth,
      uvHeight,
    };
  }

  /**
   * Generate multiple text textures in parallel
   * @param texts Array of text strings with options
   * @returns Array of texture results
   */
  async generateBatch(
    texts: Array<{ text: string; fontSize: number; options?: TextTextureOptions }>
  ): Promise<TextTextureResult[]> {
    const promises = texts.map(({ text, fontSize, options }) =>
      this.generateTexture(text, fontSize, options)
    );
    return Promise.all(promises);
  }

  /**
   * Destroy a texture to free GPU memory
   * @param texture Texture to destroy
   */
  destroyTexture(texture: GPUTexture): void {
    texture.destroy();
  }
}
