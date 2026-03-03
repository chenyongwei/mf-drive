import type { Vertex } from "./WebGPUEngine";

export function createVertexBuffer(
  engine: any,
  BU: Record<string, number>,
  vertexCount: number,
): GPUBuffer {
  if (!engine.device) {
    throw new Error("Device not initialized");
  }
  const size = Math.max(vertexCount * 24, 256);
  return engine.device.createBuffer({
    size,
    usage: BU.VERTEX | BU.COPY_DST,
  });
}

export function createBuffers(engine: any, BU: Record<string, number>): void {
  if (!engine.device) {
    return;
  }

  const alignment = engine.device.limits.minUniformBufferOffsetAlignment;
  const uniformBufferSize = Math.ceil(64 / alignment) * alignment;
  engine.uniformBuffer = engine.device.createBuffer({
    size: uniformBufferSize,
    usage: BU.UNIFORM | BU.COPY_DST,
  });

  engine.staticVertexBuffer = createVertexBuffer(engine, BU, 100);
  engine.staticOuterVertexBuffer = createVertexBuffer(engine, BU, 100);
  engine.staticHoleVertexBuffer = createVertexBuffer(engine, BU, 100);
  engine.overlayVertexBuffer = createVertexBuffer(engine, BU, 100);
  engine.overlayFillVertexBuffer = createVertexBuffer(engine, BU, 100);

  engine.maxTextVertices = 100000;
  engine.textVertexBuffer = engine.device.createBuffer({
    size: 16 * engine.maxTextVertices,
    usage: BU.VERTEX | BU.COPY_DST,
  });

  if (engine.bindGroupLayout) {
    engine.bindGroup = engine.device.createBindGroup({
      layout: engine.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: engine.uniformBuffer },
        },
      ],
    });
  }
}

export function updateBuffer(
  engine: any,
  BU: Record<string, number>,
  buffer: GPUBuffer | null,
  vertices: Vertex[] | Float32Array,
  vertexCount: number,
  maxLimit: number,
  stride: number = 24,
): { buffer: GPUBuffer | null; count: number } {
  if (!engine.device) {
    return { buffer, count: 0 };
  }
  const actualVertexCount = Math.min(vertexCount, maxLimit);
  if (actualVertexCount === 0) {
    return { buffer, count: 0 };
  }

  const vertexDataSize = actualVertexCount * stride;

  try {
    const newBuffer = engine.device.createBuffer({
      size: vertexDataSize,
      mappedAtCreation: true,
      usage: BU.VERTEX | BU.COPY_DST,
    });

    const vertexData = new Float32Array(newBuffer.getMappedRange());

    if (vertices instanceof Float32Array) {
      const requiredLength = actualVertexCount * (stride / 4);
      const subData =
        vertices.length === requiredLength
          ? vertices
          : vertices.subarray(0, requiredLength);
      vertexData.set(subData);
    } else {
      for (let i = 0; i < actualVertexCount; i += 1) {
        const v = vertices[i];
        vertexData[i * 6 + 0] = v.x;
        vertexData[i * 6 + 1] = v.y;
        vertexData[i * 6 + 2] = v.r;
        vertexData[i * 6 + 3] = v.g;
        vertexData[i * 6 + 4] = v.b;
        vertexData[i * 6 + 5] = v.a;
      }
    }

    newBuffer.unmap();

    if (buffer) {
      buffer.destroy();
    }

    return { buffer: newBuffer, count: actualVertexCount };
  } catch (error) {
    console.error("Failed to create/update buffer", error);
    return { buffer: null, count: 0 };
  }
}

export function updateTextVertices(
  engine: any,
  BU: Record<string, number>,
  vertices: Float32Array,
  vertexCount: number,
): void {
  if (!engine.device || !engine.textVertexBuffer) {
    return;
  }

  const actualVertexCount = Math.min(vertexCount, engine.maxTextVertices);
  if (actualVertexCount === 0) {
    return;
  }

  const vertexDataSize = actualVertexCount * 16;

  try {
    const newTextVertexBuffer = engine.device.createBuffer({
      size: vertexDataSize,
      mappedAtCreation: true,
      usage: BU.VERTEX | BU.COPY_DST,
    });

    const vertexData = new Float32Array(newTextVertexBuffer.getMappedRange());
    vertexData.set(vertices.subarray(0, actualVertexCount * 4));
    newTextVertexBuffer.unmap();

    if (engine.textVertexBuffer) {
      engine.textVertexBuffer.destroy();
    }

    engine.textVertexBuffer = newTextVertexBuffer;
  } catch (error) {
    console.error("Error creating text vertex buffer:", error);
  }
}
