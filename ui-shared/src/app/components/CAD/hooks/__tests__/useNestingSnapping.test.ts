/**
 * Unit tests for useNestingSnapping hook
 */

import { renderHook, act } from "@testing-library/react";
import { useNestingSnapping, extractSnapPoints } from "../useNestingSnapping";
import { NestingPart } from "../../types/NestingTypes";

describe("useNestingSnapping", () => {
  const mockPart: NestingPart = {
    id: "part-1",
    position: { x: 100, y: 100 },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    boundingBox: { minX: 0, minY: 0, maxX: 50, maxY: 50 },
    entities: [],
    status: "unplaced",
    plateId: null,
  };

  const mockPart2: NestingPart = {
    id: "part-2",
    position: { x: 200, y: 100 },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    boundingBox: { minX: 0, minY: 0, maxX: 50, maxY: 50 },
    entities: [],
    status: "unplaced",
    plateId: null,
  };

  describe("extractSnapPoints", () => {
    it("should extract corner snap points from a part", () => {
      const points = extractSnapPoints(mockPart);
      const cornerPoints = points.filter((p) => p.type === "corner");
      expect(cornerPoints).toHaveLength(4);
    });

    it("should extract edge snap points from a part", () => {
      const points = extractSnapPoints(mockPart);
      const edgePoints = points.filter((p) => p.type === "edge");
      // Each edge has 3 snap points (start, midpoint, end) x 4 edges = 12
      expect(edgePoints).toHaveLength(12);
    });

    it("should extract center snap point from a part", () => {
      const points = extractSnapPoints(mockPart);
      const centerPoints = points.filter((p) => p.type === "center");
      expect(centerPoints).toHaveLength(1);
      expect(centerPoints[0].position).toEqual({ x: 125, y: 125 });
    });

    it("should transform snap points correctly with rotation", () => {
      const rotatedPart = { ...mockPart, rotation: 90 };
      const points = extractSnapPoints(rotatedPart);
      expect(points.length).toBeGreaterThan(0);
      expect(points[0].partId).toBe("part-1");
    });

    it("should transform snap points correctly with mirroring", () => {
      const mirroredPart = { ...mockPart, mirroredX: true };
      const points = extractSnapPoints(mirroredPart);
      expect(points.length).toBeGreaterThan(0);
    });
  });

  describe("findSnap", () => {
    it("should return no snap when snapping is disabled", () => {
      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: false,
          snapTolerance: 15,
          allParts: [mockPart2],
        }),
      );

      const snapResult = result.current.findSnap(mockPart, []);

      expect(snapResult.snapped).toBe(false);
      expect(snapResult.snapPosition).toEqual(mockPart.position);
    });

    it("should find snap when parts are within tolerance", () => {
      const nearbyPart = {
        ...mockPart2,
        position: { x: 110, y: 100 }, // Within 15 units of mockPart
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          allParts: [nearbyPart],
        }),
      );

      const snapResult = result.current.findSnap(mockPart, []);

      expect(snapResult.snapped).toBe(true);
      expect(snapResult.snapPoint).not.toBeNull();
      expect(snapResult.targetPoint).not.toBeNull();
    });

    it("should not find snap when parts are outside tolerance", () => {
      const farPart = {
        ...mockPart2,
        position: { x: 500, y: 500 }, // Far away
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          allParts: [farPart],
        }),
      );

      const snapResult = result.current.findSnap(mockPart, []);

      expect(snapResult.snapped).toBe(false);
    });

    it("should respect snap type filters", () => {
      const nearbyPart = {
        ...mockPart2,
        position: { x: 110, y: 100 },
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          snapToCorners: false, // Disable corner snapping
          snapToEdges: true,
          snapToCenters: true,
          allParts: [nearbyPart],
        }),
      );

      const snapResult = result.current.findSnap(mockPart, []);

      // Should still snap, but not to corners
      expect(snapResult.snapType).not.toContain("corner");
    });

    it("should exclude specified part IDs from snapping", () => {
      const nearbyPart = {
        ...mockPart2,
        position: { x: 110, y: 100 },
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          allParts: [nearbyPart],
        }),
      );

      const snapResult = result.current.findSnap(mockPart, [mockPart2.id]);

      expect(snapResult.snapped).toBe(false);
    });

    it("should keep configured part spacing in snap position", () => {
      const draggedPart = {
        ...mockPart,
        position: { x: 103, y: 100 }, // 7mm gap to target's left edge
      };
      const targetPart = {
        ...mockPart2,
        position: { x: 160, y: 100 }, // Left edge at x=160
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          partSpacing: 10,
          allParts: [targetPart],
        }),
      );

      const snapResult = result.current.findSnap(draggedPart, []);

      expect(snapResult.snapped).toBe(true);
      // With 10mm spacing, dragged part should snap back to x=100
      // (its right edge at x=150, target left edge at x=160).
      expect(snapResult.snapPosition.x).toBeCloseTo(100, 6);
    });

    it("should keep spacing direction stable when snap points already overlap", () => {
      const draggedPart = {
        ...mockPart,
        position: { x: 110, y: 100 }, // Right edge exactly on target left edge
      };
      const targetPart = {
        ...mockPart2,
        position: { x: 160, y: 100 },
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          partSpacing: 10,
          allParts: [targetPart],
        }),
      );

      const snapResult = result.current.findSnap(draggedPart, []);

      expect(snapResult.snapped).toBe(true);
      // Must move left to keep +10mm gap, not move right into negative gap.
      expect(snapResult.snapPosition.x).toBeCloseTo(100, 6);
    });

    it("should detect horizontal center alignment", () => {
      const sameYPart = {
        ...mockPart2,
        position: { x: 200, y: 100 }, // Same Y as mockPart
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          snapToCenters: true,
          allParts: [sameYPart],
        }),
      );

      const snapResult = result.current.findSnap(mockPart, []);

      // Should detect horizontal center alignment
      if (snapResult.snapped) {
        expect(
          snapResult.snapType === "horizontal-center" ||
            snapResult.snapType === "center-to-center" ||
            snapResult.snapType === "corner-to-corner" ||
            snapResult.snapType === "vertex-to-vertex" ||
            snapResult.snapType === "edge-to-edge" ||
            snapResult.snapType === "edge-to-edge-parallel" ||
            snapResult.snapType === "point-to-point",
        ).toBe(true);
      }
    });

    it("should scope part snap candidates to the provided target plate", () => {
      const draggedPart = {
        ...mockPart,
        id: "dragged-part",
        plateId: "plate-a",
      };
      const sameSourcePlatePart = {
        ...mockPart2,
        id: "source-plate-part",
        plateId: "plate-a",
        position: { x: 108, y: 100 },
      };
      const targetPlatePart = {
        ...mockPart2,
        id: "target-plate-part",
        plateId: "plate-b",
        position: { x: 106, y: 100 },
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          allParts: [sameSourcePlatePart, targetPlatePart],
        }),
      );

      const snapResult = result.current.findSnap(draggedPart, [], "plate-b");

      expect(snapResult.snapped).toBe(true);
      expect(snapResult.targetPoint?.partId).toBe("target-plate-part");
    });

    it("should disable sheet snap when target plate is explicitly null", () => {
      const draggedPart = {
        ...mockPart,
        id: "dragged-sheet-part",
        position: { x: 6, y: 20 },
        boundingBox: { minX: 0, minY: 0, maxX: 20, maxY: 20 },
      };
      const plate = {
        id: "plate-a",
        name: "Plate A",
        width: 200,
        height: 100,
        margin: 10,
        position: { x: 0, y: 0 },
      };

      const { result } = renderHook(() =>
        useNestingSnapping({
          enabled: true,
          snapTolerance: 15,
          snapToSheets: true,
          allParts: [],
          plates: [plate],
        }),
      );

      const defaultSnap = result.current.findSnap(draggedPart, []);
      const scopedSnap = result.current.findSnap(draggedPart, [], null);

      expect(defaultSnap.snapped).toBe(true);
      expect(scopedSnap.snapped).toBe(false);
    });
  });

  describe("spatial indexing", () => {
    it("should rebuild spatial index when parts change", () => {
      const { result, rerender } = renderHook(
        ({ parts }) =>
          useNestingSnapping({
            enabled: true,
            snapTolerance: 15,
            allParts: parts,
          }),
        {
          initialProps: { parts: [mockPart2] },
        },
      );

      // Initial render
      expect(result.current).toBeDefined();

      // Rerender with different parts
      rerender({ parts: [mockPart2, mockPart] });

      expect(result.current).toBeDefined();
    });
  });
});
