import type { ThemeMode } from './WebGLRenderer.types';

const VERTEX_SHADER_SOURCE = `
  attribute vec2 aPos;
  attribute vec4 aColor;
  varying vec4 vColor;
  uniform mat4 uTransform;
  void main() {
    gl_Position = uTransform * vec4(aPos, 0.0, 1.0);
    vColor = aColor;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  varying vec4 vColor;
  void main() { gl_FragColor = vColor; }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('WebGL shader allocation failed');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const details = gl.getShaderInfoLog(shader) ?? 'unknown';
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${details}`);
  }
  return shader;
}

export function createWebGLProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  const program = gl.createProgram();
  if (!program) {
    throw new Error('WebGL program allocation failed');
  }
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const details = gl.getProgramInfoLog(program) ?? 'unknown';
    gl.deleteProgram(program);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    throw new Error(`WebGL program link error: ${details}`);
  }
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return program;
}

export function setupVertexAttribs(gl: WebGLRenderingContext, program: WebGLProgram): void {
  const aPos = gl.getAttribLocation(program, 'aPos');
  const aColor = gl.getAttribLocation(program, 'aColor');
  if (aPos < 0 || aColor < 0) {
    return;
  }
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aColor);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 24, 0);
  gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 24, 8);
}

export function createMatrix(
  zoom: number,
  panX: number,
  panY: number,
  width: number,
  height: number,
): Float32Array {
  const matrix = new Float32Array(16);
  matrix[0] = (2.0 * zoom) / width;
  matrix[5] = (-2.0 * zoom) / height;
  matrix[10] = 1;
  matrix[12] = (2.0 * panX) / width - 1;
  matrix[13] = (-2.0 * panY) / height + 1;
  matrix[15] = 1;
  return matrix;
}

export function parseBackgroundColor(
  color: string,
  theme: ThemeMode,
): { r: number; g: number; b: number; a: number } {
  const normalized = color.trim().toLowerCase();
  if (normalized === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const rgbaMatch = normalized.match(
    /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/,
  );
  if (rgbaMatch) {
    return {
      r: Math.min(255, Number(rgbaMatch[1])) / 255,
      g: Math.min(255, Number(rgbaMatch[2])) / 255,
      b: Math.min(255, Number(rgbaMatch[3])) / 255,
      a: Math.max(0, Math.min(1, Number(rgbaMatch[4]))),
    };
  }

  if (normalized.startsWith('#') && normalized.length >= 7) {
    const h = normalized.slice(1);
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
      a: 1,
    };
  }

  return theme === 'dark'
    ? { r: 0, g: 0, b: 0, a: 1 }
    : { r: 1, g: 1, b: 1, a: 1 };
}
