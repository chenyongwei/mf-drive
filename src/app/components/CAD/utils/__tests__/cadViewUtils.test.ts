import { describe, expect, test } from "vitest";
import {
  getEffectiveEntities,
  getEffectiveToolpathOverlaySegments,
} from "../cadViewUtils";
import type { Entity } from "../../../../lib/webgpu/EntityToVertices";
import type { ToolpathOverlaySegment } from "../../types/CADCanvasTypes";
import type { NestingPart } from "../../types/NestingTypes";

function lineEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: "line-1",
    type: "LINE",
    geometry: {
      start: { x: 0, y: 0 },
      end: { x: 10, y: 0 },
    },
    ...overrides,
  };
}

function nestingPart(overrides: Partial<NestingPart> = {}): NestingPart {
  return {
    id: "part-1",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    status: "placed",
    plateId: "plate-1",
    position: { x: 0, y: 0 },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    ...overrides,
  };
}

function toolpathSegment(
  overrides: Partial<ToolpathOverlaySegment> = {},
): ToolpathOverlaySegment {
  return {
    segmentId: "seg-1",
    kind: "CUT",
    from: { x: 0, y: 0 },
    to: { x: 10, y: 0 },
    contourId: "part-1-outer",
    ...overrides,
  };
}

describe("getEffectiveEntities", () => {
  test("translates dragged part entities matched by partIds", () => {
    const entities: Entity[] = [
      lineEntity({ id: "part-1-e1", partIds: ["part-1"] }),
      lineEntity({
        id: "part-2-e1",
        partIds: ["part-2"],
        geometry: { start: { x: 5, y: 5 }, end: { x: 15, y: 5 } },
      }),
    ];
    const parts: NestingPart[] = [nestingPart({ id: "part-1", position: { x: 10, y: 20 } })];

    const result = getEffectiveEntities(
      entities,
      null,
      true,
      { partId: "part-1", position: { x: 16, y: 27 }, isValid: true },
      parts,
    );

    expect(result[0].geometry?.start).toEqual({ x: 6, y: 7 });
    expect(result[0].geometry?.end).toEqual({ x: 16, y: 7 });
    expect(result[1].geometry?.start).toEqual({ x: 5, y: 5 });
    expect(result[1].geometry?.end).toEqual({ x: 15, y: 5 });
  });

  test("translates dragged part entities matched by mapped fileId", () => {
    const entities: Entity[] = [
      lineEntity({
        id: "e-file-map",
        fileId: "standalone-part-3",
        geometry: { start: { x: 3, y: 4 }, end: { x: 13, y: 4 } },
      }),
    ];
    const parts: NestingPart[] = [
      nestingPart({
        id: "part-3",
        position: { x: 2, y: 1 },
        entities: [lineEntity({ id: "part-3-local", fileId: "standalone-part-3" })],
      }),
    ];

    const result = getEffectiveEntities(
      entities,
      null,
      true,
      { partId: "part-3", position: { x: 7, y: 6 }, isValid: true },
      parts,
    );

    expect(result[0].geometry?.start).toEqual({ x: 8, y: 9 });
    expect(result[0].geometry?.end).toEqual({ x: 18, y: 9 });
  });

  test("translates entities by target part entity-id membership", () => {
    const untaggedInner = lineEntity({
      id: "inner-random-uuid",
      geometry: { start: { x: 2, y: 3 }, end: { x: 7, y: 3 } },
    });
    const entities: Entity[] = [untaggedInner];
    const parts: NestingPart[] = [
      nestingPart({
        id: "part-9",
        position: { x: 4, y: 8 },
        entities: [untaggedInner],
      }),
    ];

    const result = getEffectiveEntities(
      entities,
      null,
      true,
      { partId: "part-9", position: { x: 9, y: 10 }, isValid: true },
      parts,
    );

    expect(result[0].geometry?.start).toEqual({ x: 11, y: 13 });
    expect(result[0].geometry?.end).toEqual({ x: 16, y: 13 });
  });

  test("rebuilds part entities from drag preview so inner and outer contours both follow", () => {
    const outerLocal = lineEntity({
      id: "part-7-outer",
      geometry: { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
    });
    const innerLocal = lineEntity({
      id: "part-7-inner",
      isInnerContour: true,
      geometry: { start: { x: 2, y: 2 }, end: { x: 6, y: 2 } },
    });
    const nonPartEntity = lineEntity({
      id: "plate-outline",
      geometry: { start: { x: -100, y: -100 }, end: { x: 100, y: -100 } },
    });

    const staleEntities: Entity[] = [
      lineEntity({
        id: "part-7-outer",
        geometry: { start: { x: 10, y: 20 }, end: { x: 20, y: 20 } },
      }),
      lineEntity({
        id: "part-7-inner",
        isInnerContour: true,
        geometry: { start: { x: 12, y: 22 }, end: { x: 16, y: 22 } },
      }),
      nonPartEntity,
    ];

    const parts: NestingPart[] = [
      nestingPart({
        id: "part-7",
        position: { x: 10, y: 20 },
        entities: [outerLocal, innerLocal],
      }),
    ];

    const result = getEffectiveEntities(
      staleEntities,
      null,
      true,
      { partId: "part-7", position: { x: 15, y: 25 }, isValid: true },
      parts,
    );

    const outer = result.find((entity) => entity.id === "part-7-outer");
    const inner = result.find((entity) => entity.id === "part-7-inner");
    const plate = result.find((entity) => entity.id === "plate-outline");

    expect(outer?.geometry?.start).toEqual({ x: 15, y: 25 });
    expect(outer?.geometry?.end).toEqual({ x: 25, y: 25 });
    expect(inner?.geometry?.start).toEqual({ x: 17, y: 27 });
    expect(inner?.geometry?.end).toEqual({ x: 21, y: 27 });
    expect(plate?.geometry?.start).toEqual({ x: -100, y: -100 });
    expect(plate?.geometry?.end).toEqual({ x: 100, y: -100 });
  });
});

describe("getEffectiveToolpathOverlaySegments", () => {
  test("translates dragged part toolpath segments by contourId", () => {
    const segments: ToolpathOverlaySegment[] = [
      toolpathSegment({
        segmentId: "seg-p1",
        contourId: "part-1-outer",
        from: { x: 10, y: 20 },
        to: { x: 20, y: 20 },
      }),
      toolpathSegment({
        segmentId: "seg-p2",
        contourId: "part-2-outer",
        from: { x: 30, y: 40 },
        to: { x: 40, y: 40 },
      }),
    ];
    const parts: NestingPart[] = [
      nestingPart({ id: "part-1", position: { x: 10, y: 20 } }),
      nestingPart({ id: "part-2", position: { x: 0, y: 0 } }),
    ];

    const result = getEffectiveToolpathOverlaySegments(
      segments,
      { partId: "part-1", position: { x: 16, y: 27 }, isValid: true },
      parts,
    );

    expect(result[0].from).toEqual({ x: 16, y: 27 });
    expect(result[0].to).toEqual({ x: 26, y: 27 });
    expect(result[1].from).toEqual({ x: 30, y: 40 });
    expect(result[1].to).toEqual({ x: 40, y: 40 });
  });

  test("translates dragged part toolpath segments by explicit partId", () => {
    const segments: ToolpathOverlaySegment[] = [
      toolpathSegment({
        segmentId: "seg-explicit",
        partId: "part-x",
        contourId: undefined,
        from: { x: 5, y: 8 },
        to: { x: 7, y: 9 },
      }),
    ];
    const parts: NestingPart[] = [nestingPart({ id: "part-x", position: { x: 1, y: 2 } })];

    const result = getEffectiveToolpathOverlaySegments(
      segments,
      { partId: "part-x", position: { x: 4, y: 6 }, isValid: true },
      parts,
    );

    expect(result[0].from).toEqual({ x: 8, y: 12 });
    expect(result[0].to).toEqual({ x: 10, y: 13 });
  });

  test("keeps RAPID segments connected during drag preview", () => {
    const segments: ToolpathOverlaySegment[] = [
      toolpathSegment({
        segmentId: "rapid-1",
        kind: "RAPID",
        contourId: undefined,
        from: { x: 0, y: 0 },
        to: { x: 10, y: 10 },
      }),
      toolpathSegment({
        segmentId: "cut-1",
        kind: "CUT",
        contourId: "part-1-outer",
        from: { x: 10, y: 10 },
        to: { x: 20, y: 10 },
      }),
      toolpathSegment({
        segmentId: "rapid-2",
        kind: "RAPID",
        contourId: undefined,
        from: { x: 20, y: 10 },
        to: { x: 30, y: 30 },
      }),
      toolpathSegment({
        segmentId: "cut-2",
        kind: "CUT",
        contourId: "part-2-outer",
        from: { x: 30, y: 30 },
        to: { x: 40, y: 30 },
      }),
    ];
    const parts: NestingPart[] = [
      nestingPart({ id: "part-1", position: { x: 10, y: 20 } }),
      nestingPart({ id: "part-2", position: { x: 0, y: 0 } }),
    ];

    const result = getEffectiveToolpathOverlaySegments(
      segments,
      { partId: "part-1", position: { x: 15, y: 23 }, isValid: true },
      parts,
    );

    expect(result.find((segment) => segment.segmentId === "cut-1")?.from).toEqual({
      x: 15,
      y: 13,
    });
    expect(result.find((segment) => segment.segmentId === "cut-1")?.to).toEqual({
      x: 25,
      y: 13,
    });
    expect(result.find((segment) => segment.segmentId === "rapid-1")?.from).toEqual({
      x: 0,
      y: 0,
    });
    expect(result.find((segment) => segment.segmentId === "rapid-1")?.to).toEqual({
      x: 15,
      y: 13,
    });
    expect(result.find((segment) => segment.segmentId === "rapid-2")?.from).toEqual({
      x: 25,
      y: 13,
    });
    expect(result.find((segment) => segment.segmentId === "rapid-2")?.to).toEqual({
      x: 30,
      y: 30,
    });
  });
});
