import React from "react";
import { render } from "@testing-library/react";
import { handleDragEnd } from "../usePartNesting.drag.end";
import { createPlacementHelpers } from "../usePartNesting.placement";
import type { DragPreview } from "../usePartNesting.types";
import type { NestingPart, Plate, Point } from "../../types/NestingTypes";
import { NestingPlacementStatusOverlay } from "../../components/NestingPlacementStatusOverlay";

const plate: Plate = {
  id: "plate-1",
  name: "P1",
  width: 100,
  height: 100,
  margin: 10,
  position: { x: 0, y: 0 },
};

function createPart(overrides: Partial<NestingPart> = {}): NestingPart {
  return {
    id: "part-1",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 20, maxY: 20 },
    status: "unplaced",
    plateId: null,
    position: { x: 20, y: 20 },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    ...overrides,
  };
}

function createHelpers(stickToEdge: boolean, parts: NestingPart[]) {
  return createPlacementHelpers({
    parts,
    plates: [plate],
    collisionEngine: null,
    partSpacing: 0,
    stickToEdge,
  });
}

function createDragPreview(
  partId: string,
  position: Point,
  boundaryState: DragPreview["boundaryState"],
): DragPreview {
  const hasBoundaryInterference =
    boundaryState === "inside_forbidden_band" || boundaryState === "cross_boundary";
  return {
    partId,
    position,
    isValid: !hasBoundaryInterference,
    hasCollision: false,
    hasSpacingInterference: false,
    hasBoundaryInterference,
    hasMarginInterference: hasBoundaryInterference,
    boundaryState,
    boundaryReason: boundaryState === "inside_placeable" ? "none" : boundaryState,
    targetPlateId: null,
    snapResult: null,
  };
}

type DragEndArgs = Parameters<typeof handleDragEnd>[0];

function runDragEndWithDefaults(
  part: NestingPart,
  dragPreview: DragPreview,
  helpers: ReturnType<typeof createPlacementHelpers>,
  overrides: Partial<DragEndArgs> = {},
): NestingPart[] | null {
  let updatedParts: NestingPart[] | null = null;

  const args: DragEndArgs = {
    draggingPartId: part.id,
    dragPreview,
    parts: [part],
    partSpacing: 0,
    checkCollision: () => false,
    checkSpacingInterference: () => false,
    classifyPlacementBoundary: helpers.classifyPlacementBoundary,
    clampPositionToPlateBounds: helpers.clampPositionToPlateBounds,
    checkMarginInterference: helpers.checkMarginInterference,
    resolveNearestValidPosition: () => null,
    findPlateForPart: helpers.findPlateForPart,
    stickToEdge: false,
    updateParts: (next) => {
      updatedParts = next;
    },
    lastValidDragPositionRef: { current: null },
    originalPositionRef: { current: part.position },
    setDraggingPartId: () => undefined,
    setDragStartPosition: () => undefined,
    setDragOffset: () => undefined,
    setCurrentSnap: () => undefined,
    setDragPreview: () => undefined,
    ...overrides,
  };

  handleDragEnd(args);
  return updatedParts;
}

describe("usePartNesting placement boundary behavior", () => {
  it("stickToEdge=false: fully inside inner margin zone is placeable", () => {
    const part = createPart();
    const helpers = createHelpers(false, [part]);
    const result = helpers.classifyPlacementBoundary(part, { x: 30, y: 30 }, 0);

    expect(result.state).toBe("inside_placeable");
    expect(result.reason).toBe("none");
    expect(result.targetPlate?.id).toBe("plate-1");
  });

  it("stickToEdge=false: margin band is forbidden and drag end clamps inward", () => {
    const part = createPart();
    const helpers = createHelpers(false, [part]);

    const preDrop = helpers.classifyPlacementBoundary(part, { x: 2, y: 20 }, 0);
    expect(preDrop.state).toBe("inside_forbidden_band");

    const updated = runDragEndWithDefaults(
      part,
      createDragPreview(part.id, { x: 2, y: 20 }, "inside_forbidden_band"),
      helpers,
      {
        stickToEdge: false,
        lastValidDragPositionRef: { current: { x: 35, y: 35 } },
      },
    );

    expect(updated).not.toBeNull();
    const moved = updated!.find((item) => item.id === part.id)!;
    expect(moved.position).toEqual({ x: 10, y: 20 });
    expect(moved.status).toBe("placed");
    expect(moved.plateId).toBe("plate-1");
  });

  it("stickToEdge=false: cross outer boundary is illegal and normalized to legal inside/outside", () => {
    const part = createPart();
    const helpers = createHelpers(false, [part]);

    const preDrop = helpers.classifyPlacementBoundary(part, { x: 85, y: 20 }, 0);
    expect(preDrop.state).toBe("cross_boundary");

    const updated = runDragEndWithDefaults(
      part,
      createDragPreview(part.id, { x: 85, y: 20 }, "cross_boundary"),
      helpers,
      {
        stickToEdge: false,
        lastValidDragPositionRef: { current: { x: 25, y: 25 } },
      },
    );

    expect(updated).not.toBeNull();
    const moved = updated!.find((item) => item.id === part.id)!;
    expect(moved.position).toEqual({ x: 70, y: 20 });
    expect(
      moved.status === "placed" || moved.status === "unplaced",
    ).toBe(true);
  });

  it("stickToEdge=true: inside outer frame is placeable even in margin band", () => {
    const part = createPart();
    const helpers = createHelpers(true, [part]);
    const result = helpers.classifyPlacementBoundary(part, { x: 2, y: 20 }, 0);

    expect(result.state).toBe("inside_placeable");
    expect(result.reason).toBe("none");
    expect(result.targetPlate?.id).toBe("plate-1");
  });

  it("stickToEdge=true: cross outer boundary is illegal", () => {
    const part = createPart();
    const helpers = createHelpers(true, [part]);
    const result = helpers.classifyPlacementBoundary(part, { x: 85, y: 20 }, 0);

    expect(result.state).toBe("cross_boundary");
    expect(result.reason).toBe("cross_boundary");
  });

  it("rotation-aware boundary check prevents rotated drag drop from crossing sheet edge", () => {
    const part = createPart({ rotation: 45, position: { x: 20, y: 20 } });
    const helpers = createHelpers(false, [part]);

    const preDrop = helpers.classifyPlacementBoundary(part, { x: 78, y: 50 }, 0);
    expect(preDrop.state).toBe("cross_boundary");

    const updated = runDragEndWithDefaults(
      part,
      createDragPreview(part.id, { x: 78, y: 50 }, "cross_boundary"),
      helpers,
      {
        stickToEdge: false,
      },
    );

    expect(updated).not.toBeNull();
    const moved = updated!.find((item) => item.id === part.id)!;
    expect(moved.position.x).toBeCloseTo(65.86, 2);
    expect(moved.position.y).toBeCloseTo(50, 2);
    expect(moved.status).toBe("placed");
  });

  it("keeps committed drag preview after drop to avoid toolpath flashback", () => {
    const part = createPart();
    const helpers = createHelpers(false, [part]);
    const setDragPreview = jest.fn();

    runDragEndWithDefaults(
      part,
      createDragPreview(part.id, { x: 30, y: 30 }, "inside_placeable"),
      helpers,
      {
        setDragPreview,
      },
    );

    expect(setDragPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        partId: part.id,
        position: { x: 30, y: 30 },
        isValid: true,
      }),
    );
    expect(setDragPreview).not.toHaveBeenCalledWith(null);
  });

  it("classification respects world bbox offsets when minX/minY are not zero", () => {
    const part = createPart({
      boundingBox: { minX: -5, minY: -3, maxX: 15, maxY: 17 },
    });
    const helpers = createHelpers(false, [part]);

    const inside = helpers.classifyPlacementBoundary(part, { x: 15, y: 13 }, 0);
    expect(inside.state).toBe("inside_placeable");

    const forbidden = helpers.classifyPlacementBoundary(part, { x: 12, y: 13 }, 0);
    expect(forbidden.state).toBe("inside_forbidden_band");
  });

  it("after boundary correction, collision conflicts resolve via nearest legal or fallback", () => {
    const part = createPart();
    const helpers = createHelpers(false, [part]);
    const resolveNearestValidPosition = jest.fn(() => ({ x: 42, y: 20 }));
    const checkCollision = jest.fn((_id: string, pos: Point) => pos.x === 10);

    const updated = runDragEndWithDefaults(
      part,
      createDragPreview(part.id, { x: 2, y: 20 }, "inside_forbidden_band"),
      helpers,
      {
        stickToEdge: false,
        checkCollision,
        resolveNearestValidPosition,
        lastValidDragPositionRef: { current: { x: 35, y: 35 } },
      },
    );

    expect(resolveNearestValidPosition).toHaveBeenCalled();
    expect(updated).not.toBeNull();
    const moved = updated!.find((item) => item.id === part.id)!;
    expect(moved.position).toEqual({ x: 42, y: 20 });
  });

  it("falls back to last valid position when nearest legal candidate is still invalid", () => {
    const part = createPart();
    const helpers = createHelpers(false, [part]);
    const resolveNearestValidPosition = jest.fn(() => ({ x: 10, y: 20 }));
    const checkCollision = jest.fn((_id: string, pos: Point) => pos.x === 10);

    const updated = runDragEndWithDefaults(
      part,
      createDragPreview(part.id, { x: 2, y: 20 }, "inside_forbidden_band"),
      helpers,
      {
        stickToEdge: false,
        checkCollision,
        resolveNearestValidPosition,
        lastValidDragPositionRef: { current: { x: 33, y: 35 } },
      },
    );

    expect(resolveNearestValidPosition).toHaveBeenCalled();
    expect(updated).not.toBeNull();
    const moved = updated!.find((item) => item.id === part.id)!;
    expect(moved.position).toEqual({ x: 33, y: 35 });
  });

  it("status overlay text and tone stay consistent with boundary state", () => {
    const { rerender, getByText, container } = render(
      React.createElement(NestingPlacementStatusOverlay, {
        visible: true,
        theme: "light",
        boundaryState: "inside_placeable",
      }),
    );

    expect(getByText("板内可放")).toBeTruthy();
    const firstBorder = (container.firstChild as HTMLElement).style.border;

    rerender(
      React.createElement(NestingPlacementStatusOverlay, {
        visible: true,
        theme: "light",
        boundaryState: "cross_boundary",
        hasCollision: true,
        hasSpacingInterference: true,
      }),
    );

    expect(getByText("跨边界")).toBeTruthy();
    expect(getByText("(存在碰撞 / 间距不足)")).toBeTruthy();
    const secondBorder = (container.firstChild as HTMLElement).style.border;
    expect(secondBorder).not.toBe(firstBorder);

    rerender(
      React.createElement(NestingPlacementStatusOverlay, {
        visible: true,
        theme: "light",
        boundaryState: "inside_placeable",
        isCopyPreview: true,
        copyRemainingCount: 2,
      }),
    );

    expect(getByText("拷贝件")).toBeTruthy();
    expect(getByText("(余量 2)")).toBeTruthy();
  });
});
