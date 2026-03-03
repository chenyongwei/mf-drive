import {
  buildFillGeometry,
  createFillSignature,
} from "../WebGLRenderer.fill-utils";

type FillPart = Parameters<typeof buildFillGeometry>[0][number];

const RED = [1, 0, 0];
const MAGENTA = [1, 0, 1];
const GREEN = [0, 1, 0];

function createSquarePart(id: string, color: string, offsetX = 0): FillPart {
  return {
    id,
    color,
    position: { x: offsetX, y: 0 },
    rotation: 0,
    mirroredX: false,
    mirroredY: false,
    boundingBox: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    entities: [
      {
        id: `${id}-outline`,
        type: "LWPOLYLINE",
        geometry: {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          closed: true,
        },
      },
    ],
  };
}

function hasColor(
  data: Float32Array,
  target: [number, number, number],
  epsilon = 1e-5,
): boolean {
  for (let i = 0; i < data.length; i += 6) {
    const r = data[i + 2];
    const g = data[i + 3];
    const b = data[i + 4];
    if (
      Math.abs(r - target[0]) <= epsilon &&
      Math.abs(g - target[1]) <= epsilon &&
      Math.abs(b - target[2]) <= epsilon
    ) {
      return true;
    }
  }
  return false;
}

describe("WebGLRenderer fill utils", () => {
  test("createFillSignature is stable for invalidPartIds order", () => {
    const parts = [createSquarePart("part-a", "#ff0000")];
    const left = createFillSignature(parts, new Set(["part-b", "part-a"]));
    const right = createFillSignature(parts, new Set(["part-a", "part-b"]));
    expect(left).toBe(right);
  });

  test("buildFillGeometry keeps part colors and only invalid parts are forced to red", () => {
    const parts = [
      createSquarePart("part-a", "#ff00ff"),
      createSquarePart("part-b", "#00ff00", 20),
    ];

    const normal = buildFillGeometry(parts, "dark", undefined);
    expect(normal.vertexCount).toBeGreaterThan(0);
    expect(hasColor(normal.data, MAGENTA)).toBe(true);
    expect(hasColor(normal.data, GREEN)).toBe(true);
    expect(hasColor(normal.data, RED)).toBe(false);

    const invalid = buildFillGeometry(parts, "dark", new Set(["part-b"]));
    expect(invalid.vertexCount).toBeGreaterThan(0);
    expect(hasColor(invalid.data, MAGENTA)).toBe(true);
    expect(hasColor(invalid.data, RED)).toBe(true);
    expect(hasColor(invalid.data, GREEN)).toBe(false);
  });
});
