export async function createRenderPipelines(engine: any): Promise<void> {
  if (!engine.device || !engine.format) {
    return;
  }

  const shaderCode = `
    struct Uniforms {
      transform: mat4x4<f32>,
    };

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) color: vec4<f32>,
    };

    @vertex
    fn vertex_main(
      @location(0) position: vec2<f32>,
      @location(1) color: vec4<f32>
    ) -> VertexOutput {
      var output: VertexOutput;
      output.position = uniforms.transform * vec4<f32>(position, 0.0, 1.0);
      output.color = color;
      return output;
    }

    @fragment
    fn fragment_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
      return color;
    }
  `;

  const shaderModule = engine.device.createShaderModule({ code: shaderCode });

  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 24,
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x2" },
      { shaderLocation: 1, offset: 8, format: "float32x4" },
    ],
  };

  engine.bindGroupLayout = engine.device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" },
      },
    ],
  });

  const pipelineLayout = engine.device.createPipelineLayout({
    bindGroupLayouts: [engine.bindGroupLayout],
  });

  const alphaBlend = {
    color: {
      srcFactor: "src-alpha",
      dstFactor: "one-minus-src-alpha",
      operation: "add",
    },
    alpha: {
      srcFactor: "one",
      dstFactor: "one-minus-src-alpha",
      operation: "add",
    },
  };

  engine.linePipeline = engine.device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: "vertex_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [{ format: engine.format, blend: alphaBlend }],
    },
    primitive: { topology: "line-list" },
  });

  engine.trianglePipeline = engine.device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: "vertex_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [{ format: engine.format, blend: alphaBlend }],
    },
    primitive: { topology: "triangle-list" },
  });

  engine.stencilMaskPipeline = engine.device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: "vertex_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [{ format: engine.format, writeMask: 0 }],
    },
    depthStencil: {
      depthWriteEnabled: false,
      depthCompare: "always",
      format: "depth24plus-stencil8",
      stencilFront: {
        compare: "always",
        failOp: "invert",
        depthFailOp: "invert",
        passOp: "invert",
      },
      stencilBack: {
        compare: "always",
        failOp: "invert",
        depthFailOp: "invert",
        passOp: "invert",
      },
      stencilReadMask: 0xff,
      stencilWriteMask: 0xff,
    },
    primitive: { topology: "triangle-list" },
  });

  engine.stencilFillPipeline = engine.device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: "vertex_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [{ format: engine.format, blend: alphaBlend, writeMask: 0xf }],
    },
    depthStencil: {
      depthWriteEnabled: false,
      depthCompare: "always",
      format: "depth24plus-stencil8",
      stencilFront: {
        compare: "not-equal",
        failOp: "keep",
        depthFailOp: "keep",
        passOp: "keep",
      },
      stencilBack: {
        compare: "not-equal",
        failOp: "keep",
        depthFailOp: "keep",
        passOp: "keep",
      },
      stencilReadMask: 0xff,
      stencilWriteMask: 0xff,
    },
    primitive: { topology: "triangle-list" },
  });

  const textShaderCode = `
    struct Uniforms {
      transform: mat4x4<f32>,
    };

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var myTexture: texture_2d<f32>;
    @group(0) @binding(2) var mySampler: sampler;

    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) uv: vec2<f32>,
    };

    @vertex
    fn text_vertex_main(
      @location(0) position: vec2<f32>,
      @location(1) uv: vec2<f32>
    ) -> VertexOutput {
      var output: VertexOutput;
      output.position = uniforms.transform * vec4<f32>(position, 0.0, 1.0);
      output.uv = uv;
      return output;
    }

    @fragment
    fn text_fragment_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
      return textureSample(myTexture, mySampler, uv);
    }
  `;

  const textShaderModule = engine.device.createShaderModule({ code: textShaderCode });
  const textVertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 16,
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x2" },
      { shaderLocation: 1, offset: 8, format: "float32x2" },
    ],
  };

  engine.textBindGroupLayout = engine.device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: "filtering" },
      },
    ],
  });

  const textPipelineLayout = engine.device.createPipelineLayout({
    bindGroupLayouts: [engine.textBindGroupLayout],
  });

  engine.textPipeline = engine.device.createRenderPipeline({
    layout: textPipelineLayout,
    vertex: {
      module: textShaderModule,
      entryPoint: "text_vertex_main",
      buffers: [textVertexBufferLayout],
    },
    fragment: {
      module: textShaderModule,
      entryPoint: "text_fragment_main",
      targets: [{ format: engine.format, blend: alphaBlend }],
    },
    primitive: { topology: "triangle-list" },
  });
}
