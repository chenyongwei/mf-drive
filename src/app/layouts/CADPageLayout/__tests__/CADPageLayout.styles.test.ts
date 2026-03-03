import { describe, expect, test } from "vitest";
import {
  buildDistinctPartTypeColorMap,
  getStyles,
  getRandomPantoneColor,
} from "../CADPageLayout.styles";

const PROCESS_STROKE_COLORS = ["#ffffff", "#22c55e", "#facc15", "#22d3ee"];

function hexToRgb(hexColor: string): { r: number; g: number; b: number } {
  const normalized = hexColor.trim().toLowerCase().replace(/^#/, "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function colorDistance(left: string, right: string): number {
  const l = hexToRgb(left);
  const r = hexToRgb(right);
  const dr = l.r - r.r;
  const dg = l.g - r.g;
  const db = l.b - r.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

describe("getRandomPantoneColor", () => {
  test("returns stable color for same part id", () => {
    const colorA = getRandomPantoneColor("part-1001");
    const colorB = getRandomPantoneColor("part-1001");
    expect(colorA).toBe(colorB);
  });

  test("keeps sampled fill colors away from process stroke colors", () => {
    for (let i = 0; i < 500; i += 1) {
      const color = getRandomPantoneColor(`sample-part-${i}`);
      expect(/^#[0-9a-f]{6}$/i.test(color)).toBe(true);
      PROCESS_STROKE_COLORS.forEach((strokeColor) => {
        expect(colorDistance(color, strokeColor)).toBeGreaterThanOrEqual(96);
      });
    }
  });
});

describe("buildDistinctPartTypeColorMap", () => {
  test("keeps color assignment stable for same type key set", () => {
    const mapA = buildDistinctPartTypeColorMap(["source-a", "source-b", "source-c"]);
    const mapB = buildDistinctPartTypeColorMap(["source-c", "source-a", "source-b"]);

    expect(mapA.get("source-a")).toBe(mapB.get("source-a"));
    expect(mapA.get("source-b")).toBe(mapB.get("source-b"));
    expect(mapA.get("source-c")).toBe(mapB.get("source-c"));
  });

  test("keeps a strong minimum distance for the first 8 distinct types", () => {
    const keys = Array.from({ length: 8 }, (_, index) => `type-${index + 1}`);
    const colorMap = buildDistinctPartTypeColorMap(keys);
    const colors = keys.map((key) => colorMap.get(key) ?? "");

    let minDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < colors.length; i += 1) {
      for (let j = i + 1; j < colors.length; j += 1) {
        minDistance = Math.min(minDistance, colorDistance(colors[i], colors[j]));
      }
    }

    expect(minDistance).toBeGreaterThanOrEqual(90);
  });

  test("keeps assigned colors away from process stroke colors", () => {
    const keys = Array.from({ length: 12 }, (_, index) => `part-kind-${index + 1}`);
    const colorMap = buildDistinctPartTypeColorMap(keys);

    keys.forEach((key) => {
      const color = colorMap.get(key);
      expect(color).toBeDefined();
      PROCESS_STROKE_COLORS.forEach((strokeColor) => {
        expect(colorDistance(color!, strokeColor)).toBeGreaterThanOrEqual(96);
      });
    });
  });
});

describe("getStyles", () => {
  test("uses container width 100% so dock/right padding can control layout without extra blank area", () => {
    const styles = getStyles("dark");
    expect(styles.container.width).toBe("100%");
  });
});
