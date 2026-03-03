import { BoundingBox, Part } from './CollisionDetectionEngine.types';

export class SpatialGrid {
  private grid: Map<string, Set<string>> = new Map();

  constructor(
    private width: number,
    private height: number,
    private cellSize: number,
  ) {
    void this.width;
    void this.height;
  }

  private getCellsForBoundingBox(bbox: BoundingBox): string[] {
    const cells: Set<string> = new Set();

    const minCellX = Math.floor(bbox.minX / this.cellSize);
    const maxCellX = Math.floor(bbox.maxX / this.cellSize);
    const minCellY = Math.floor(bbox.minY / this.cellSize);
    const maxCellY = Math.floor(bbox.maxY / this.cellSize);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        cells.add(`${x},${y}`);
      }
    }

    return Array.from(cells);
  }

  addPart(part: Part): void {
    const worldBBox = {
      minX: part.boundingBox.minX + part.position.x,
      minY: part.boundingBox.minY + part.position.y,
      maxX: part.boundingBox.maxX + part.position.x,
      maxY: part.boundingBox.maxY + part.position.y,
    };
    const cells = this.getCellsForBoundingBox(worldBBox);

    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey)!.add(part.id);
    }
  }

  removePart(partId: string): void {
    for (const cell of this.grid.values()) {
      cell.delete(partId);
    }
  }

  updatePart(part: Part): void {
    this.removePart(part.id);
    this.addPart(part);
  }

  query(bbox: BoundingBox): string[] {
    const cells = this.getCellsForBoundingBox(bbox);
    const partIds = new Set<string>();

    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey);
      if (!cell) continue;
      for (const id of cell) {
        partIds.add(id);
      }
    }

    return Array.from(partIds);
  }
}
