import { Vertex } from './WebGPUEngine';
import { Entity } from './EntityToVertices.types';

const SELECTED_COLOR = { r: 0.2, g: 0.5, b: 1.0, a: 1 };
const HOVERED_COLOR = { r: 1, g: 0.8, b: 0.2, a: 1 };

const DASH_LENGTH = 10;
const GAP_LENGTH = 5;

export function parseColor(
  color: number | string,
  theme: 'dark' | 'light' = 'dark',
): { r: number; g: number; b: number; a: number } {
  if (typeof color === 'number') {
    return parseAutocadColor(color, theme);
  }

  if (typeof color === 'string' && color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16) / 255,
        g: parseInt(hex[1] + hex[1], 16) / 255,
        b: parseInt(hex[2] + hex[2], 16) / 255,
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16) / 255,
        g: parseInt(hex.slice(2, 4), 16) / 255,
        b: parseInt(hex.slice(4, 6), 16) / 255,
        a: 1,
      };
    }
  }

  return theme === 'dark'
    ? { r: 1, g: 1, b: 1, a: 1 }
    : { r: 0, g: 0, b: 0, a: 1 };
}

function parseAutocadColor(
  index: number,
  theme: 'dark' | 'light' = 'dark',
): { r: number; g: number; b: number; a: number } {
  const colors: Record<number, [number, number, number]> = {
    1: [255, 0, 0],
    2: [255, 255, 0],
    3: [0, 255, 0],
    4: [0, 255, 255],
    5: [0, 0, 255],
    6: [255, 0, 255],
    7: theme === 'dark' ? [255, 255, 255] : [0, 0, 0],
    8: [128, 128, 128],
  };

  const defaultColor: [number, number, number] = theme === 'dark' ? [255, 255, 255] : [0, 0, 0];
  const color = colors[index] || defaultColor;
  return {
    r: color[0] / 255,
    g: color[1] / 255,
    b: color[2] / 255,
    a: 1,
  };
}

export function getEntityStrokeColor(
  entity: Entity,
  theme: 'dark' | 'light',
): { r: number; g: number; b: number; a: number } {
  if (entity.isSelected) return SELECTED_COLOR;
  if (entity.isHovered) return HOVERED_COLOR;
  if (entity.isPart) return parseColor(entity.partColor ?? 3, theme);
  if (entity.strokeColor) return parseColor(entity.strokeColor, theme);
  return parseColor(entity.color || 7, theme);
}

export function addDashedSegment(
  vertices: Vertex[],
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  color: { r: number; g: number; b: number; a: number },
): void {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return;

  const nx = dx / length;
  const ny = dy / length;
  let currentDist = 0;
  let isDash = true;

  while (currentDist < length) {
    const segmentLength = isDash ? DASH_LENGTH : GAP_LENGTH;
    const actualLength = Math.min(segmentLength, length - currentDist);

    if (isDash) {
      vertices.push({ x: p1.x + nx * currentDist, y: p1.y + ny * currentDist, ...color });
      vertices.push({ x: p1.x + nx * (currentDist + actualLength), y: p1.y + ny * (currentDist + actualLength), ...color });
    }

    currentDist += actualLength;
    isDash = !isDash;
  }
}
