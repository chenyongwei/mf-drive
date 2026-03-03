export interface VertexColorPoint {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export function flattenVertexColorData(vertices: VertexColorPoint[]): Float32Array {
  const flat = new Float32Array(vertices.length * 6);
  for (let i = 0; i < vertices.length; i += 1) {
    const vertex = vertices[i];
    const base = i * 6;
    flat[base] = vertex.x;
    flat[base + 1] = vertex.y;
    flat[base + 2] = vertex.r;
    flat[base + 3] = vertex.g;
    flat[base + 4] = vertex.b;
    flat[base + 5] = vertex.a;
  }
  return flat;
}
