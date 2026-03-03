import React from "react";
import { render } from "@testing-library/react";
import { SelectedPartHatchOverlay } from "../SelectedPartHatchOverlay";
import type { NestingPart } from "../../types/NestingTypes";

function createPart(id: string, offsetX = 0): NestingPart {
  return {
    id,
    entities: [
      {
        id: `${id}-outer`,
        type: "LWPOLYLINE",
        geometry: {
          points: [
            { x: offsetX + 0, y: 0 },
            { x: offsetX + 100, y: 0 },
            { x: offsetX + 100, y: 60 },
            { x: offsetX + 0, y: 60 },
          ],
          closed: true,
        },
      },
      {
        id: `${id}-hole`,
        type: "CIRCLE",
        geometry: {
          center: { x: offsetX + 50, y: 30 },
          radius: 12,
        },
      },
    ],
    boundingBox: {
      minX: offsetX + 0,
      minY: 0,
      maxX: offsetX + 100,
      maxY: 60,
    },
    status: "placed",
    plateId: "plate-1",
    position: { x: 0, y: 0 },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    color: "#ef4444",
  };
}

describe("SelectedPartHatchOverlay", () => {
  test("renders hatch only for selected parts", () => {
    const part = createPart("part-1");
    const { container, rerender } = render(
      <svg>
        <SelectedPartHatchOverlay
          parts={[part]}
          selectedPartIds={["part-1"]}
          theme="dark"
        />
      </svg>,
    );

    expect(container.querySelectorAll("path").length).toBe(1);

    rerender(
      <svg>
        <SelectedPartHatchOverlay
          parts={[part]}
          selectedPartIds={[]}
          theme="dark"
        />
      </svg>,
    );

    expect(container.querySelectorAll("path").length).toBe(0);
  });

  test("renders one hatch path per selected part in multi-select", () => {
    const partA = createPart("part-a", 0);
    const partB = createPart("part-b", 140);

    const { container } = render(
      <svg>
        <SelectedPartHatchOverlay
          parts={[partA, partB]}
          selectedPartIds={["part-a", "part-b"]}
          theme="light"
        />
      </svg>,
    );

    const hatchPaths = container.querySelectorAll("path");
    expect(hatchPaths.length).toBe(2);
  });

  test("uses evenodd path for parts with inner holes", () => {
    const part = createPart("part-hole");
    const { container } = render(
      <svg>
        <SelectedPartHatchOverlay
          parts={[part]}
          selectedPartIds={["part-hole"]}
          theme="dark"
        />
      </svg>,
    );

    const hatchPath = container.querySelector("path");
    expect(hatchPath).not.toBeNull();
    expect(hatchPath?.getAttribute("fill-rule")).toBe("evenodd");

    const d = hatchPath?.getAttribute("d") ?? "";
    const moveCount = (d.match(/M /g) || []).length;
    expect(moveCount).toBeGreaterThanOrEqual(2);
  });
});
