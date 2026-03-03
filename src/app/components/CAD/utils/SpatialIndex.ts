/**
 * SpatialIndex - Grid-based spatial indexing for efficient entity lookup
 * 
 * Uses a grid-based approach to partition 2D space for O(1) point queries
 * and efficient rectangular range queries.
 */

const DEFAULT_GRID_SIZE = 100; // Grid cell size in world units

export class SpatialIndex {
    private grid = new Map<string, string[]>();
    private cellSize: number;

    constructor(cellSize: number = DEFAULT_GRID_SIZE) {
        this.cellSize = cellSize;
    }

    private getCellKey(x: number, y: number): string {
        const gx = Math.floor(x / this.cellSize);
        const gy = Math.floor(y / this.cellSize);
        return `${gx},${gy}`;
    }

    clear(): void {
        this.grid.clear();
    }

    insert(entityId: string, minX: number, minY: number, maxX: number, maxY: number): void {
        // Safety check for invalid bounding boxes
        if (isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY) ||
            !isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            return;
        }

        const x1 = Math.floor(minX / this.cellSize);
        const y1 = Math.floor(minY / this.cellSize);
        const x2 = Math.floor(maxX / this.cellSize);
        const y2 = Math.floor(maxY / this.cellSize);

        // Limit grid coverage to avoid memory/perf issues with huge entities
        const MAX_GRID_SPAN = 20;
        const capX2 = x2 - x1 > MAX_GRID_SPAN ? x1 + MAX_GRID_SPAN : x2;
        const capY2 = y2 - y1 > MAX_GRID_SPAN ? y1 + MAX_GRID_SPAN : y2;

        for (let x = x1; x <= capX2; x++) {
            for (let y = y1; y <= capY2; y++) {
                const key = `${x},${y}`;
                const cell = this.grid.get(key) || [];
                cell.push(entityId);
                this.grid.set(key, cell);
            }
        }
    }

    query(x: number, y: number): string[] {
        return this.grid.get(this.getCellKey(x, y)) || [];
    }

    queryRect(minX: number, minY: number, maxX: number, maxY: number): Set<string> {
        const result = new Set<string>();
        const x1 = Math.floor(minX / this.cellSize);
        const y1 = Math.floor(minY / this.cellSize);
        const x2 = Math.floor(maxX / this.cellSize);
        const y2 = Math.floor(maxY / this.cellSize);

        for (let x = x1; x <= x2; x++) {
            for (let y = y1; y <= y2; y++) {
                const cell = this.grid.get(`${x},${y}`);
                if (cell) {
                    cell.forEach(id => result.add(id));
                }
            }
        }
        return result;
    }
}

export default SpatialIndex;
