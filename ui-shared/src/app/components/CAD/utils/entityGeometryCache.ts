import { Entity, convertEntitiesToTypedArray } from "../../../lib/webgpu/EntityToVertices";
import { BoundingBox } from "../types/BoundingBox";
import { getEntityBBox } from "../../../utils/entityBBox";

export interface GeometryCacheOptions {
  theme: "dark" | "light";
  zoom?: number;
  detailScale?: number;
  viewportBounds?: BoundingBox | null;
  cullMargin?: number;
  force?: boolean;
}

export interface GeometryCacheGroup {
  fileId: string;
  entities: Entity[];
}

export interface CachedGeometryResult {
  fileId: string;
  vertexCount: number;
  entityCount: number;
  signature: string;
  buffer: Float32Array;
  dirty: boolean;
  visible: boolean;
}

interface CacheEntry {
  signature: string;
  theme: "dark" | "light";
  buffer: Float32Array;
  vertexCount: number;
  entityCount: number;
  boundingBox: BoundingBox | null;
}

/**
 * EntityGeometryCache caches typed arrays for static CAD entities on a per-file basis
 * so we only rebuild/upload WebGL buffers when the underlying geometry actually changes.
 */
export class EntityGeometryCache {
  private cache = new Map<string, CacheEntry>();
  private entitySignatureCache = new WeakMap<Entity, string>();

  build(
    groups: GeometryCacheGroup[],
    options: GeometryCacheOptions,
  ): CachedGeometryResult[] {
    const results: CachedGeometryResult[] = [];
    const activeKeys = new Set<string>();

    for (const group of groups) {
      activeKeys.add(group.fileId);
      const signature = this.createSignature(group.entities);
      const cached = this.cache.get(group.fileId);
      const needsRebuild =
        options.force ||
        !cached ||
        cached.signature !== signature ||
        cached.theme !== options.theme;

      let entry = cached;
      if (needsRebuild) {
        const buffer = convertEntitiesToTypedArray(group.entities, options.theme, {
          detailScale: options.detailScale,
        });
        entry = {
          signature,
          theme: options.theme,
          buffer,
          vertexCount: buffer.length / 6,
          entityCount: group.entities.length,
          boundingBox: this.calculateBoundingBox(group.entities),
        };
        this.cache.set(group.fileId, entry);
      }

      if (!entry) {
        continue;
      }

      const visible = this.isVisible(
        entry.boundingBox,
        options.viewportBounds,
        options.cullMargin ?? 0,
      );

      results.push({
        fileId: group.fileId,
        signature: entry.signature,
        vertexCount: entry.vertexCount,
        entityCount: entry.entityCount,
        buffer: entry.buffer,
        dirty: needsRebuild,
        visible,
      });
    }

    // prune stale entries
    for (const key of Array.from(this.cache.keys())) {
      if (!activeKeys.has(key)) {
        this.cache.delete(key);
      }
    }

    return results;
  }

  private createSignature(entities: Entity[]): string {
    if (entities.length === 0) return "empty";
    let hash = 0;
    for (const entity of entities) {
      hash = this.hashString(this.getEntitySignature(entity), hash);
    }
    return hash.toString(16);
  }

  private getEntitySignature(entity: Entity): string {
    if (entity.versionToken) {
      return `${entity.id ?? "?"}|${entity.versionToken}`;
    }
    const cached = this.entitySignatureCache.get(entity);
    if (cached) return cached;

    const serialized = JSON.stringify({
      id: entity.id,
      type: entity.type,
      layer: entity.layer,
      color: entity.color,
      strokeColor: entity.strokeColor,
      geometry: entity.geometry,
    });
    const signature = `${entity.id ?? "?"}|${this.hashString(serialized)}`;
    this.entitySignatureCache.set(entity, signature);
    return signature;
  }

  private calculateBoundingBox(entities: Entity[]): BoundingBox | null {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const entity of entities) {
      try {
        const bbox = getEntityBBox(entity);
        minX = Math.min(minX, bbox.minX);
        minY = Math.min(minY, bbox.minY);
        maxX = Math.max(maxX, bbox.maxX);
        maxY = Math.max(maxY, bbox.maxY);
      } catch {
        // ignore entities without geometry
      }
    }

    if (!isFinite(minX) || !isFinite(minY)) {
      return null;
    }

    return { minX, minY, maxX, maxY };
  }

  private isVisible(
    bbox: BoundingBox | null,
    viewport: BoundingBox | null | undefined,
    margin: number,
  ): boolean {
    if (!bbox || !viewport) return true;
    return !(
      bbox.maxX < viewport.minX - margin ||
      bbox.minX > viewport.maxX + margin ||
      bbox.maxY < viewport.minY - margin ||
      bbox.minY > viewport.maxY + margin
    );
  }

  private hashString(value: string, seed = 0): number {
    let hash = seed || 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
