import React from "react";
import { render } from "@testing-library/react";
import { NestingLayoutItem } from "../NestingLayoutItem";
import type { Plate, NestingPart } from "../../types/NestingTypes";

function createPlate(): Plate {
  return {
    id: "plate-1",
    name: "P1",
    width: 300,
    height: 200,
    margin: 10,
    position: { x: 0, y: 0 },
  };
}

function createPart(overrides: Partial<NestingPart> = {}): NestingPart {
  return {
    id: "part-1",
    entities: [],
    boundingBox: { minX: 0, minY: 0, maxX: 60, maxY: 40 },
    status: "placed",
    plateId: "plate-1",
    position: { x: 40, y: 30 },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    ...overrides,
  };
}

describe("NestingLayoutItem", () => {
  test("renders real contours with mixed process colors", () => {
    const part = createPart({
      entities: [
        {
          id: "poly-cut",
          type: "LWPOLYLINE",
          processCode: "CUT_NORMAL",
          geometry: {
            points: [
              { x: 0, y: 0 },
              { x: 60, y: 0 },
              { x: 60, y: 40 },
              { x: 0, y: 40 },
            ],
            closed: true,
          },
        },
        {
          id: "hole-mark",
          type: "CIRCLE",
          processCode: "MARK",
          geometry: { center: { x: 30, y: 20 }, radius: 10 },
        },
      ],
    });

    const { container } = render(
      <NestingLayoutItem
        plate={createPlate()}
        parts={[part]}
        isSelected={false}
        onSelect={() => undefined}
        onDelete={() => undefined}
        theme="dark"
      />,
    );

    const contourNodes = Array.from(
      container.querySelectorAll<SVGElement>("polyline, polygon"),
    );
    expect(contourNodes.length).toBeGreaterThanOrEqual(2);

    const strokeSet = new Set(
      contourNodes.map((node) => node.getAttribute("stroke") || ""),
    );
    expect(strokeSet.has("#22c55e")).toBe(true);
    expect(strokeSet.has("#22d3ee")).toBe(true);
  });

  test("keeps contour rendering stable under rotate/mirror transforms", () => {
    const part = createPart({
      rotation: 90,
      mirroredX: true,
      entities: [
        {
          id: "arc-slow",
          type: "ARC",
          processCode: "CUT_SLOW",
          geometry: {
            center: { x: 30, y: 20 },
            radius: 18,
            startAngle: 0,
            endAngle: Math.PI,
          },
        },
        {
          id: "line-none",
          type: "LINE",
          processCode: "NO_PROCESS",
          geometry: {
            start: { x: 10, y: 10 },
            end: { x: 50, y: 10 },
          },
        },
      ],
    });

    const { container } = render(
      <NestingLayoutItem
        plate={createPlate()}
        parts={[part]}
        isSelected={true}
        onSelect={() => undefined}
        onDelete={() => undefined}
        theme="light"
      />,
    );

    const contourNodes = Array.from(
      container.querySelectorAll<SVGElement>("polyline, polygon"),
    );
    expect(contourNodes.length).toBeGreaterThanOrEqual(2);

    const strokeSet = new Set(
      contourNodes.map((node) => node.getAttribute("stroke") || ""),
    );
    expect(strokeSet.has("#facc15")).toBe(true);
    expect(strokeSet.has("#ffffff")).toBe(true);
  });
});
