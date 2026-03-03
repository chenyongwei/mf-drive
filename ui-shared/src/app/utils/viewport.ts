// Calculate viewport based on pan, zoom, and stage size
export function calculateViewport(
  pan: { x: number; y: number },
  zoom: number,
  size: { width: number; height: number }
) {
  return {
    minX: -pan.x / zoom,
    minY: -pan.y / zoom,
    maxX: (size.width - pan.x) / zoom,
    maxY: (size.height - pan.y) / zoom,
  };
}
