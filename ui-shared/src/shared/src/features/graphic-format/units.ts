import type { GraphicUnit } from "../../../types";

const UNIT_TO_MM: Record<GraphicUnit, number> = {
  mm: 1,
  cm: 10,
  inch: 25.4,
  mil: 0.0254,
};

export const UnitConverter = {
  toMillimeters(value: number, unit: GraphicUnit): number {
    return value * UNIT_TO_MM[unit];
  },
  fromMillimeters(value: number, unit: GraphicUnit): number {
    return value / UNIT_TO_MM[unit];
  },
  convert(value: number, from: GraphicUnit, to: GraphicUnit): number {
    if (from === to) return value;
    const mm = UnitConverter.toMillimeters(value, from);
    return UnitConverter.fromMillimeters(mm, to);
  },
  scaleFactor(from: GraphicUnit, to: GraphicUnit): number {
    return UnitConverter.convert(1, from, to);
  },
};
