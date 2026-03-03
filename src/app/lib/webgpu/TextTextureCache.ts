/**
 * Text Texture Cache
 *
 * LRU (Least Recently Used) cache for text textures to prevent
 * redundant texture generation and improve performance.
 */

import { TextTextureGenerator, TextTextureOptions, TextTextureResult } from './TextTextureGenerator';

interface CacheEntry {
  texture: GPUTexture;
  width: number;
  height: number;
  uvWidth: number;
  uvHeight: number;
  lastAccess: number; // Timestamp for LRU eviction
}

export class TextTextureCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = []; // Track access order for LRU

  constructor(
    private generator: TextTextureGenerator,
    private maxSize: number = 100
  ) {}

  /**
   * Generate cache key from text and options
   */
  private getCacheKey(text: string, fontSize: number, options: TextTextureOptions): string {
    const opts = {
      color: options.color || '#FFFFFF',
      fontFamily: options.fontFamily || 'Arial, sans-serif',
      fontWeight: options.fontWeight || 'bold',
      padding: options.padding || 4,
      backgroundColor: options.backgroundColor || 'transparent',
    };
    return JSON.stringify({ text, fontSize, opts });
  }

  /**
   * Get or create texture with caching
   * @param text Text string
   * @param fontSize Font size in pixels
   * @param options Rendering options
   * @returns Texture result
   */
  async getTexture(
    text: string,
    fontSize: number,
    options: TextTextureOptions = {}
  ): Promise<TextTextureResult> {
    const key = this.getCacheKey(text, fontSize, options);

    // Check cache
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.lastAccess = Date.now();

      // Update access order (move to end = most recently used)
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);

      return {
        texture: entry.texture,
        width: entry.width,
        height: entry.height,
        uvWidth: entry.uvWidth,
        uvHeight: entry.uvHeight,
      };
    }

    // Generate new texture
    const result = await this.generator.generateTexture(text, fontSize, options);

    // Add to cache
    this.cache.set(key, {
      texture: result.texture,
      width: result.width,
      height: result.height,
      uvWidth: result.uvWidth,
      uvHeight: result.uvHeight,
      lastAccess: Date.now(),
    });
    this.accessOrder.push(key);

    // Evict oldest if cache is full
    if (this.cache.size > this.maxSize) {
      this.evictOldest();
    }

    return result;
  }

  /**
   * Evict least recently used entry
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) return;

    // Get oldest key (first in access order array)
    const oldestKey = this.accessOrder[0];
    const entry = this.cache.get(oldestKey);

    if (entry) {
      // Destroy GPU texture to free memory
      this.generator.destroyTexture(entry.texture);
    }

    // Remove from cache
    this.cache.delete(oldestKey);
    this.accessOrder.shift();
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    // Destroy all textures
    for (const entry of this.cache.values()) {
      this.generator.destroyTexture(entry.texture);
    }

    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if cache contains key
   */
  has(text: string, fontSize: number, options: TextTextureOptions = {}): boolean {
    const key = this.getCacheKey(text, fontSize, options);
    return this.cache.has(key);
  }

  /**
   * Remove specific entry from cache
   */
  remove(text: string, fontSize: number, options: TextTextureOptions = {}): boolean {
    const key = this.getCacheKey(text, fontSize, options);
    const entry = this.cache.get(key);

    if (entry) {
      this.generator.destroyTexture(entry.texture);
      this.cache.delete(key);

      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return true;
    }

    return false;
  }

  /**
   * Cleanup method (call when component unmounts)
   */
  destroy(): void {
    this.clear();
  }
}
