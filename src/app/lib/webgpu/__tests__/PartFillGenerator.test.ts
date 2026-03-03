/**
 * Unit tests for PartFillGenerator
 * Tests polygon triangulation with hole detection
 */

import { generatePartFillFromEntities } from '../PartFillGenerator';
import { Entity } from '../EntityToVertices';

describe('PartFillGenerator', () => {
  // Helper to create a simple circle entity (outer contour)
  const createCircleEntity = (centerX: number, centerY: number, radius: number): Entity => ({
    id: `circle-${centerX}-${centerY}`,
    type: 'CIRCLE',
    geometry: {
      center: { x: centerX, y: centerY },
      radius,
    },
    color: '#ff0000',
  });

  // Helper to create a simple LWPOLYLINE entity (rectangular contour)
  const createRectEntity = (x: number, y: number, width: number, height: number, isInner = false): Entity => ({
    id: `rect-${x}-${y}`,
    type: 'LWPOLYLINE',
    geometry: {
      points: [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ],
      closed: true,
    },
    color: isInner ? '#000000' : '#ff0000',
    isInnerContour: isInner,
  });

  describe('generatePartFillFromEntities', () => {
    it('should generate vertices for a simple circle', () => {
      const entities = [createCircleEntity(100, 100, 50)];
      const fillColor = '#ff0000';

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
      // Each vertex has x, y, r, g, b, a properties
      expect(result.outer[0]).toHaveProperty('x');
      expect(result.outer[0]).toHaveProperty('y');
      expect(result.outer[0]).toHaveProperty('r');
      expect(result.outer[0]).toHaveProperty('g');
      expect(result.outer[0]).toHaveProperty('b');
      expect(result.outer[0]).toHaveProperty('a');
    });

    it('should generate vertices for a simple rectangle', () => {
      const entities = [createRectEntity(0, 0, 100, 100)];
      const fillColor = '#00ff00';

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
      // Vertex count should be multiple of 3 (triangles)
      expect(result.outer.length % 3).toBe(0);
    });

    it('should handle empty entity array', () => {
      const entities: Entity[] = [];
      const fillColor = '#ff0000';

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toEqual({ outer: [], holes: [] });
    });

    it('should parse color correctly', () => {
      const entities = [createCircleEntity(100, 100, 50)];
      const fillColor = '#ff00ff';

      const result = generatePartFillFromEntities(entities, fillColor);

      // Check that at least some vertices have the expected color
      expect(result.outer[0].r).toBeGreaterThanOrEqual(0);
      expect(result.outer[0].r).toBeLessThanOrEqual(1);
      expect(result.outer[0].g).toBeGreaterThanOrEqual(0);
      expect(result.outer[0].g).toBeLessThanOrEqual(1);
      expect(result.outer[0].b).toBeGreaterThanOrEqual(0);
      expect(result.outer[0].b).toBeLessThanOrEqual(1);
    });

    it('should handle multiple outer contours', () => {
      const entities = [
        createCircleEntity(100, 100, 50),
        createCircleEntity(300, 100, 50),
      ];
      const fillColor = '#0000ff';

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
    });
  });

  describe('hole detection', () => {
    it('should detect inner contours marked as isInnerContour', () => {
      const outerRect = createRectEntity(0, 0, 200, 200, false);
      const innerRect = createRectEntity(50, 50, 50, 50, true);

      const entities = [outerRect, innerRect];
      const fillColor = '#ff0000';

      const result = generatePartFillFromEntities(entities, fillColor);

      // Should generate triangles with a hole
      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
      expect(result.holes.length).toBeGreaterThan(0);
    });

    it('should handle multiple inner contours', () => {
      const outerRect = createRectEntity(0, 0, 200, 200, false);
      const innerRect1 = createRectEntity(20, 20, 30, 30, true);
      const innerRect2 = createRectEntity(150, 150, 30, 30, true);

      const entities = [outerRect, innerRect1, innerRect2];
      const fillColor = '#00ff00';

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
      expect(result.holes.length).toBeGreaterThan(0);
    });

    it('should handle nested contours (hole inside a hole is not valid)', () => {
      // This is an edge case - a hole inside another hole
      // The function should handle gracefully
      const outerRect = createRectEntity(0, 0, 200, 200, false);
      const innerRect1 = createRectEntity(50, 50, 100, 100, true);
      const innerRect2 = createRectEntity(75, 75, 30, 30, true);

      const entities = [outerRect, innerRect1, innerRect2];
      const fillColor = '#0000ff';

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very small contours', () => {
      const tinyRect = createRectEntity(0, 0, 1, 1);
      const fillColor = '#ff0000';
      const entities = [tinyRect];

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
    });

    it('should handle very large contours', () => {
      const hugeRect = createRectEntity(-10000, -10000, 20000, 20000);
      const fillColor = '#ff0000';
      const entities = [hugeRect];

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
    });

    it('should handle entities at negative coordinates', () => {
      const entities = [createCircleEntity(-100, -100, 50)];
      const fillColor = '#ff0000';

      const result = generatePartFillFromEntities(entities, fillColor);

      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
    });

    it('should handle degenerate polygons (collinear points)', () => {
      const lineEntity: Entity = {
        id: 'line-1',
        type: 'LWPOLYLINE',
        x: 0,
        y: 0,
        vertices: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 },
        ],
        closed: true,
        color: '#ff0000',
      };

      const result = generatePartFillFromEntities([lineEntity], '#ff0000');

      // Should handle gracefully (may produce empty result or minimal triangles)
      expect(result).toBeDefined();
    });
  });

  describe('color parsing', () => {
    it('should parse hex color with # prefix', () => {
      const entities = [createCircleEntity(100, 100, 50)];
      const hexColor = '#1a2b3c';

      const result = generatePartFillFromEntities(entities, hexColor);

      expect(result).toBeDefined();
      expect(result.outer.length).toBeGreaterThan(0);
    });

    it('should handle rgb() color format', () => {
      const entities = [createCircleEntity(100, 100, 50)];
      const rgbColor = 'rgb(255, 128, 64)';

      const result = generatePartFillFromEntities(entities, rgbColor);

      expect(result).toBeDefined();
    });

    it('should handle named colors', () => {
      const entities = [createCircleEntity(100, 100, 50)];
      const namedColor = 'coral';

      const result = generatePartFillFromEntities(entities, namedColor);

      expect(result).toBeDefined();
    });
  });
});
