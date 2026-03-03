import type { TextQuad } from "./WebGPUEngine";

export function combineTextQuadVertices(quads: TextQuad[]): {
  totalTextVertices: number;
  vertices: Float32Array | null;
} {
  const totalTextVertices = quads.reduce((sum, quad) => sum + quad.vertexCount, 0);
  if (totalTextVertices <= 0) {
    return { totalTextVertices: 0, vertices: null };
  }

  const allTextVertices = new Float32Array(totalTextVertices * 4);
  let offset = 0;
  for (const quad of quads) {
    allTextVertices.set(quad.vertices, offset);
    offset += quad.vertices.length;
  }

  return {
    totalTextVertices,
    vertices: allTextVertices,
  };
}
