// WebGPU Shaders for CAD rendering

export const lineVertexShader = `
struct Uniforms {
  viewMatrix: mat4x4<f32>,
  zoom: f32,
  strokeWidth: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn main(
  @location(0) position: vec2<f32>,
  @location(1) color: vec4<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.viewMatrix * vec4<f32>(position, 0.0, 1.0);
  output.color = color;
  return output;
}
`;

export const lineFragmentShader = `
@fragment
fn main(
  @location(0) color: vec4<f32>
) -> @location(0) vec4<f32> {
  return color;
}
`;

// Shaders for circles/arcs
export const circleVertexShader = `
struct Uniforms {
  viewMatrix: mat4x4<f32>,
  radius: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn main(
  @location(0) center: vec2<f32>,
  @location(1) angle: f32
) -> VertexOutput {
  var output: VertexOutput;
  let cos_a = cos(angle);
  let sin_a = sin(angle);
  let x = center.x + cos_a * uniforms.radius;
  let y = center.y + sin_a * uniforms.radius;
  output.position = uniforms.viewMatrix * vec4<f32>(x, y, 0.0, 1.0);
  output.uv = vec2<f32>(cos_a, sin_a);
  return output;
}
`;

export const circleFragmentShader = `
@fragment
fn main(
  @location(0) uv: vec2<f32>
) -> @location(0) vec4<f32> {
  // Anti-aliased circle
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}
`;

// Shaders for polylines
export const polylineVertexShader = lineVertexShader;
export const polylineFragmentShader = lineFragmentShader;
