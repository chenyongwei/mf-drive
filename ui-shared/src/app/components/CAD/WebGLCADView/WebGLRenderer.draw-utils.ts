import {
  convertToThickVertices,
  type Entity,
} from '../../../lib/webgpu/EntityToVertices';
import { setupVertexAttribs } from './WebGLRenderer.gl-utils';
import { flattenVertexColorData, type VertexColorPoint } from './WebGLRenderer.vertex-utils';
import type {
  FillDrawCommand,
  RenderOptions,
  StaticBufferRecord,
  ThemeMode,
} from './WebGLRenderer.types';

export function drawHighlights(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  overlayVertexBuffer: WebGLBuffer,
  entities: Entity[],
  theme: ThemeMode,
  options: RenderOptions,
  zoom: number,
): void {
  const relevantEntities = entities.filter(
    (entity) =>
      options.selectedEntityIds?.has(entity.id) || options.hoveredEntityId === entity.id,
  );
  if (relevantEntities.length === 0) {
    return;
  }

  const selectionEntities = relevantEntities.map((entity) => ({
    ...entity,
    isSelected: options.selectedEntityIds?.has(entity.id),
    isHovered: options.hoveredEntityId === entity.id,
  }));
  const thickVertices = convertToThickVertices(selectionEntities, theme, zoom);
  if (thickVertices.length === 0) {
    return;
  }

  const flat = flattenVertexColorData(thickVertices as VertexColorPoint[]);
  gl.bindBuffer(gl.ARRAY_BUFFER, overlayVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flat, gl.DYNAMIC_DRAW);
  setupVertexAttribs(gl, program);
  gl.drawArrays(gl.TRIANGLES, 0, thickVertices.length);
}

export function drawFill(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  fillVertexBuffer: WebGLBuffer,
  fillVertexCount: number,
  fillDrawCommands: FillDrawCommand[],
): void {
  if (fillVertexCount === 0 || fillDrawCommands.length === 0) {
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, fillVertexBuffer);
  setupVertexAttribs(gl, program);
  gl.enable(gl.STENCIL_TEST);

  for (const cmd of fillDrawCommands) {
    gl.stencilMask(0x02);
    gl.clear(gl.STENCIL_BUFFER_BIT);

    gl.colorMask(false, false, false, false);
    gl.stencilMask(0x02);
    gl.stencilFunc(gl.ALWAYS, 0, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
    gl.drawArrays(gl.TRIANGLES, cmd.outerStart, cmd.outerCount);

    if (cmd.holeCount > 0) {
      gl.stencilFunc(gl.ALWAYS, 0, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
      gl.drawArrays(gl.TRIANGLES, cmd.holeStart, cmd.holeCount);
    }

    gl.colorMask(true, true, true, true);
    gl.stencilMask(0x03);
    gl.stencilFunc(gl.EQUAL, 2, 0x03);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
    gl.drawArrays(gl.TRIANGLES, cmd.outerStart, cmd.outerCount);
  }

  gl.disable(gl.STENCIL_TEST);
}

export function drawLines(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  staticBuffers: Map<string, StaticBufferRecord>,
  dynamicVertexBuffer: WebGLBuffer | null,
  dynamicVertexCount: number,
): void {
  for (const record of staticBuffers.values()) {
    if (!record.visible || record.vertexCount === 0) {
      continue;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, record.buffer);
    setupVertexAttribs(gl, program);
    gl.drawArrays(gl.LINES, 0, record.vertexCount);
  }

  if (dynamicVertexCount <= 0 || !dynamicVertexBuffer) {
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, dynamicVertexBuffer);
  setupVertexAttribs(gl, program);
  gl.drawArrays(gl.LINES, 0, dynamicVertexCount);
}
