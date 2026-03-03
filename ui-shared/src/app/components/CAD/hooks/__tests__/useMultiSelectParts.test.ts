/**
 * Unit tests for useMultiSelectParts hook
 */

import { renderHook, act } from "@testing-library/react";
import { useMultiSelectParts } from "../useMultiSelectParts";
import { NestingPart, Point } from "../../types/NestingTypes";

describe("useMultiSelectParts", () => {
  const mockParts: NestingPart[] = [
    {
      id: "part-1",
      position: { x: 100, y: 100 },
      rotation: 0,
      mirroredX: false,
      mirroredY: false,
      boundingBox: { minX: 0, minY: 0, maxX: 50, maxY: 50 },
      entities: [],
      status: "unplaced",
      plateId: null,
    },
    {
      id: "part-2",
      position: { x: 200, y: 100 },
      rotation: 0,
      mirroredX: false,
      mirroredY: false,
      boundingBox: { minX: 0, minY: 0, maxX: 50, maxY: 50 },
      entities: [],
      status: "unplaced",
      plateId: null,
    },
    {
      id: "part-3",
      position: { x: 300, y: 100 },
      rotation: 0,
      mirroredX: false,
      mirroredY: false,
      boundingBox: { minX: 0, minY: 0, maxX: 50, maxY: 50 },
      entities: [],
      status: "unplaced",
      plateId: null,
    },
  ];

  describe("selection", () => {
    it("should initialize with no selection", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      expect(result.current.selectedPartIds).toEqual([]);
    });

    it("should select a single part", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      act(() => {
        result.current.togglePartSelection("part-1");
      });

      expect(result.current.selectedPartIds.includes("part-1")).toBe(true);
    });

    it("should select multiple parts", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      act(() => {
        result.current.togglePartSelection("part-1", true);
        result.current.togglePartSelection("part-2", true);
      });

      expect(result.current.selectedPartIds.includes("part-1")).toBe(true);
      expect(result.current.selectedPartIds.includes("part-2")).toBe(true);
    });

    it("should deselect a part", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      act(() => {
        result.current.togglePartSelection("part-1");
      });
      expect(result.current.selectedPartIds.includes("part-1")).toBe(true);

      act(() => {
        result.current.togglePartSelection("part-1", true);
      });
      expect(result.current.selectedPartIds.includes("part-1")).toBe(false);
    });

    it("should clear all selections", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      act(() => {
        result.current.togglePartSelection("part-1", true);
        result.current.togglePartSelection("part-2", true);
      });
      expect(result.current.selectedPartIds.length).toBe(2);

      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedPartIds.length).toBe(0);
    });

    it("should select all parts", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedPartIds.length).toBe(mockParts.length);
    });

    it("should get bounding box of selected parts", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      act(() => {
        result.current.togglePartSelection("part-1", true);
        result.current.togglePartSelection("part-2", true);
      });

      const bbox = result.current.selectionBoundingBox;
      expect(bbox).toBeDefined();
      expect(bbox!.minX).toBeLessThan(bbox!.maxX);
      expect(bbox!.minY).toBeLessThan(bbox!.maxY);
    });

    it("should return null for bounding box when no parts selected", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      const bbox = result.current.selectionBoundingBox;
      expect(bbox).toBeNull();
    });
  });

  describe("box selection", () => {
    it("should start box selection", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      const startPoint: Point = { x: 50, y: 50 };

      act(() => {
        result.current.startBoxSelection(startPoint);
      });

      expect(result.current.isBoxSelecting).toBe(true);
    });

    it("should update box selection", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      const startPoint: Point = { x: 50, y: 50 };
      const endPoint: Point = { x: 150, y: 150 };

      act(() => {
        result.current.startBoxSelection(startPoint);
        result.current.updateBoxSelection(endPoint);
      });

      expect(result.current.isBoxSelecting).toBe(true);
    });

    it("should end box selection and select contained parts", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      const startPoint: Point = { x: 50, y: 50 };
      const endPoint: Point = { x: 150, y: 150 };

      act(() => {
        result.current.startBoxSelection(startPoint);
        result.current.updateBoxSelection(endPoint);
      });

      act(() => {
        result.current.completeBoxSelection();
      });

      expect(result.current.isBoxSelecting).toBe(false);
      // part-1 at (100, 100) should be selected
      expect(result.current.selectedPartIds.includes("part-1")).toBe(true);
    });

    it("should include parts that intersect box boundary", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
        }),
      );

      // First select part-1
      act(() => {
        result.current.togglePartSelection("part-1");
      });

      const startPoint: Point = { x: 150, y: 50 };
      const endPoint: Point = { x: 250, y: 150 };

      // Then box select with Ctrl to add part-2
      act(() => {
        result.current.startBoxSelection(startPoint);
        result.current.updateBoxSelection(endPoint);
      });

      act(() => {
        result.current.completeBoxSelection();
      });

      expect(result.current.selectedPartIds.includes("part-1")).toBe(true);
      expect(result.current.selectedPartIds.includes("part-2")).toBe(true);
    });
  });

  describe("selection state callbacks", () => {
    it("should call onSelectionChange when selection changes", () => {
      const onSelectionChange = jest.fn();

      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
          onSelectionChange,
        }),
      );

      act(() => {
        result.current.togglePartSelection("part-1");
      });

      expect(onSelectionChange).toHaveBeenCalledWith(["part-1"]);
    });
  });

  describe("controlled mode", () => {
    it("should read selectedPartIds from controlled props", () => {
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
          selectedPartIds: ["part-2"],
        }),
      );

      expect(result.current.selectedPartIds).toEqual(["part-2"]);
    });

    it("should emit selection changes without mutating controlled state", () => {
      const onSelectionChange = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectParts({
          parts: mockParts,
          selectedPartIds: ["part-2"],
          onSelectionChange,
        }),
      );

      act(() => {
        result.current.togglePartSelection("part-1", true);
      });

      expect(result.current.selectedPartIds).toEqual(["part-2"]);
      expect(onSelectionChange).toHaveBeenCalledWith(["part-2", "part-1"]);
    });
  });
});
