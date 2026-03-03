import { InspectionLevel } from "@dxf-fix/shared/types/inspection";
import type { Vertex } from "./WebGPUEngine";
import type { InspectionMarker, Viewport } from "./WebGPURenderer.types";

function getMarkerColor(
  level: InspectionLevel,
  selected: boolean,
  hovered: boolean,
): { r: number; g: number; b: number; a: number } {
  const baseColors = {
    [InspectionLevel.ERROR]: { r: 0.86, g: 0.15, b: 0.15, a: 0.6 },
    [InspectionLevel.WARNING]: { r: 0.79, g: 0.54, b: 0.02, a: 0.6 },
    [InspectionLevel.INFO]: { r: 0.15, g: 0.39, b: 0.92, a: 0.6 },
  };

  const base = baseColors[level] || baseColors[InspectionLevel.INFO];

  if (selected) {
    return { r: 0.23, g: 0.51, b: 0.96, a: 0.8 };
  }

  if (hovered) {
    return {
      r: Math.min(1, base.r * 1.3),
      g: Math.min(1, base.g * 1.3),
      b: Math.min(1, base.b * 1.3),
      a: 0.75,
    };
  }

  return base;
}

export function markerRadius(marker: InspectionMarker): number {
  return marker.selected ? 8 : marker.hovered ? 6 : 4;
}

export function markerHitThreshold(viewport: Viewport): number {
  return 10 / viewport.zoom;
}

export function findMarkerAtPosition(
  worldX: number,
  worldY: number,
  markers: InspectionMarker[],
  viewport: Viewport,
): string | null {
  const threshold = markerHitThreshold(viewport);
  for (const marker of markers) {
    const dist = Math.hypot(worldX - marker.x, worldY - marker.y);
    if (dist < markerRadius(marker) + threshold) {
      return marker.id;
    }
  }
  return null;
}

export function generateMarkerVertices(markers: InspectionMarker[]): Vertex[] {
  const vertices: Vertex[] = [];
  const segments = 24;

  markers.forEach((marker) => {
    const baseRadius = marker.selected ? 10 : marker.hovered ? 8 : 6;
    const color = getMarkerColor(marker.level, marker.selected, marker.hovered);

    for (let i = 0; i < segments; i += 1) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const x1 = marker.x + Math.cos(angle1) * baseRadius;
      const y1 = marker.y + Math.sin(angle1) * baseRadius;
      const x2 = marker.x + Math.cos(angle2) * baseRadius;
      const y2 = marker.y + Math.sin(angle2) * baseRadius;

      vertices.push({ x: x1, y: y1, ...color });
      vertices.push({ x: x2, y: y2, ...color });
    }
  });

  return vertices;
}
