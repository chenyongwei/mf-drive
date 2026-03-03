import {
  convertEntitiesToTypedArray,
  type Entity,
} from '../../../lib/webgpu/EntityToVertices';
import type {
  StaticBufferRecord,
  StaticFileBufferPayload,
  ThemeMode,
} from './WebGLRenderer.types';

export function syncStaticBuffers(
  gl: WebGLRenderingContext,
  staticBuffers: Map<string, StaticBufferRecord>,
  staticFileBuffers: StaticFileBufferPayload[],
): number {
  const seen = new Set<string>();
  let uploadedVertices = 0;

  for (const entry of staticFileBuffers) {
    seen.add(entry.fileId);
    let record = staticBuffers.get(entry.fileId);
    if (!record) {
      const buffer = gl.createBuffer();
      if (!buffer) {
        continue;
      }
      record = {
        buffer,
        vertexCount: 0,
        signature: '',
        visible: true,
        entityCount: 0,
      };
      staticBuffers.set(entry.fileId, record);
    }

    if (entry.dirty || record.signature !== entry.signature) {
      gl.bindBuffer(gl.ARRAY_BUFFER, record.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, entry.buffer, gl.STATIC_DRAW);
      record.vertexCount = entry.vertexCount;
      record.signature = entry.signature;
      uploadedVertices += entry.vertexCount;
    }

    record.visible = entry.visible;
    record.entityCount = entry.entityCount;
  }

  for (const [fileId, record] of staticBuffers.entries()) {
    if (seen.has(fileId)) {
      continue;
    }
    gl.deleteBuffer(record.buffer);
    staticBuffers.delete(fileId);
  }

  return uploadedVertices;
}

export function updateDynamicBuffer(
  gl: WebGLRenderingContext,
  dynamicVertexBuffer: WebGLBuffer | null,
  entities: Entity[],
  theme: ThemeMode,
): number {
  if (!dynamicVertexBuffer || entities.length === 0) {
    return 0;
  }
  const data = convertEntitiesToTypedArray(entities, theme);
  gl.bindBuffer(gl.ARRAY_BUFFER, dynamicVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  return data.length / 6;
}
