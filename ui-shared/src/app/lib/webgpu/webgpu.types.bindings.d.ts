declare global {
  type GPUAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";

  type GPUFilterMode = "nearest" | "linear";

  type GPUCompareFunction =
    | "never"
    | "less"
    | "equal"
    | "less-equal"
    | "greater"
    | "not-equal"
    | "greater-equal"
    | "always";

  interface GPUBindGroupLayout {
    label: string;
    destroy(): void;
  }

  interface GPUBindGroupLayoutDescriptor {
    label?: string;
    entries: GPUBindGroupLayoutEntry[];
  }

  interface GPUBindGroupLayoutEntry {
    binding: number;
    visibility: GPUShaderStage;
    buffer?: GPUBufferBindingLayout;
    sampler?: GPUSamplerBindingLayout;
    texture?: GPUTextureBindingLayout;
    storageTexture?: GPUStorageTextureBindingLayout;
    externalTexture?: GPUExternalTextureBindingLayout;
  }

  interface GPUBufferBindingLayout {
    type?: GPUBufferBindingType;
    hasDynamicOffset?: boolean;
    minBindingSize?: number;
  }

  type GPUBufferBindingType = "uniform" | "storage" | "read-only-storage";

  interface GPUSamplerBindingLayout {
    type?: GPUSamplerBindingType;
  }

  type GPUSamplerBindingType = "filtering" | "non-filtering" | "comparison";

  interface GPUTextureBindingLayout {
    sampleType?: GPUTextureSampleType;
    viewDimension?: GPUTextureViewDimension;
    multisampled?: boolean;
  }

  type GPUTextureSampleType =
    | "float"
    | "unfilterable-float"
    | "depth"
    | "sint"
    | "uint";

  interface GPUStorageTextureBindingLayout {
    access: GPUStorageTextureAccess;
    format: GPUTextureFormat;
    viewDimension?: GPUTextureViewDimension;
  }

  type GPUStorageTextureAccess = "write-only" | "read-only";

  interface GPUExternalTextureBindingLayout {}

  interface GPUBindGroup {
    label: string;
    destroy(): void;
  }

  interface GPUBindGroupDescriptor {
    label?: string;
    layout: GPUBindGroupLayout;
    entries: GPUBindGroupEntry[];
  }

  interface GPUBindGroupEntry {
    binding: number;
    resource:
      | GPUBufferBinding
      | GPUSampler
      | GPUTextureView
      | GPUExternalTexture;
  }

  interface GPUPipelineLayout {
    label: string;
    destroy(): void;
  }

  interface GPUPipelineDescriptorBase {
    label?: string;
    layout?: GPUPipelineLayout;
  }

  interface GPURenderPipelineDescriptor extends GPUPipelineDescriptorBase {
    vertex: GPUVertexState;
    primitive?: GPUPrimitiveState;
    depthStencil?: GPUDepthStencilState;
    multisample?: GPUMultisampleState;
    fragment?: GPUFragmentState;
  }

  interface GPUComputePipelineDescriptor extends GPUPipelineDescriptorBase {
    compute: GPUComputeState;
  }

  interface GPUProgrammableStage {
    module: GPUShaderModule;
    entryPoint: string;
  }

  type GPUShaderStage = number;

  namespace GPUShaderStage {
    const VERTEX: GPUShaderStage;
    const FRAGMENT: GPUShaderStage;
    const COMPUTE: GPUShaderStage;
  }

  interface GPUVertexState extends GPUProgrammableStage {
    buffers?: GPUVertexBufferLayout[];
  }

  interface GPUVertexBufferLayout {
    arrayStride: number;
    stepMode?: GPUVertexStepMode;
    attributes: GPUVertexAttribute[];
  }

  type GPUVertexStepMode = "vertex" | "instance";

  interface GPUVertexAttribute {
    format: GPUVertexFormat;
    offset: number;
    shaderLocation: number;
  }

  type GPUVertexFormat =
    | "uint8x2"
    | "uint8x4"
    | "sint8x2"
    | "sint8x4"
    | "unorm8x2"
    | "unorm8x4"
    | "snorm8x2"
    | "snorm8x4"
    | "uint16x2"
    | "uint16x4"
    | "sint16x2"
    | "sint16x4"
    | "unorm16x2"
    | "unorm16x4"
    | "snorm16x2"
    | "snorm16x4"
    | "float16x2"
    | "float16x4"
    | "float32"
    | "float32x2"
    | "float32x3"
    | "float32x4"
    | "uint32"
    | "uint32x2"
    | "uint32x3"
    | "uint32x4"
    | "sint32"
    | "sint32x2"
    | "sint32x3"
    | "sint32x4";

  interface GPUPrimitiveState {
    topology?: GPUPrimitiveTopology;
    stripIndexFormat?: GPUIndexFormat;
    frontFace?: GPUFrontFace;
    cullMode?: GPUCullMode;
    unclippedDepth?: boolean;
  }

  type GPUPrimitiveTopology =
    | "point-list"
    | "line-list"
    | "line-strip"
    | "triangle-list"
    | "triangle-strip";

  type GPUIndexFormat = "uint16" | "uint32";

  type GPUFrontFace = "cw" | "ccw";

  type GPUCullMode = "none" | "front" | "back";

  interface GPUDepthStencilState {
    format: GPUTextureFormat;
    depthWriteEnabled?: boolean;
    depthCompare?: GPUCompareFunction;
    stencilFront?: GPUStencilFaceState;
    stencilBack?: GPUStencilFaceState;
    stencilReadMask?: number;
    stencilWriteMask?: number;
    depthBias?: number;
    depthBiasSlopeScale?: number;
    depthBiasClamp?: number;
  }

  interface GPUStencilFaceState {
    compare?: GPUCompareFunction;
    failOp?: GPUStencilOperation;
    depthFailOp?: GPUStencilOperation;
    passOp?: GPUStencilOperation;
  }

  type GPUStencilOperation =
    | "keep"
    | "zero"
    | "replace"
    | "invert"
    | "increment-clamp"
    | "decrement-clamp"
    | "increment-wrap"
    | "decrement-wrap";

  interface GPUMultisampleState {
    count?: number;
    mask?: number;
    alphaToCoverageEnabled?: boolean;
  }

  interface GPUFragmentState extends GPUProgrammableStage {
    targets: GPUColorTargetState[];
  }

  interface GPUColorTargetState {
    format: GPUTextureFormat;
    blend?: GPUBlendState;
    writeMask?: GPUColorWriteFlags;
  }

  interface GPUBlendState {
    color: GPUBlendComponent;
    alpha: GPUBlendComponent;
  }

  interface GPUBlendComponent {
    srcFactor?: GPUBlendFactor;
    dstFactor?: GPUBlendFactor;
    operation?: GPUBlendOperation;
  }

  type GPUBlendFactor =
    | "zero"
    | "one"
    | "src"
    | "one-minus-src"
    | "src-alpha"
    | "one-minus-src-alpha"
    | "dst"
    | "one-minus-dst"
    | "dst-alpha"
    | "one-minus-dst-alpha"
    | "src-alpha-saturated"
    | "constant"
    | "one-minus-constant";

  type GPUBlendOperation =
    | "add"
    | "subtract"
    | "reverse-subtract"
    | "min"
    | "max";

  type GPUColorWriteFlags = number;

  interface GPUColorWrite {
    readonly RED: GPUColorWriteFlags;
    readonly GREEN: GPUColorWriteFlags;
    readonly BLUE: GPUColorWriteFlags;
    readonly ALPHA: GPUColorWriteFlags;
    readonly ALL: GPUColorWriteFlags;
  }

  interface GPUComputeState extends GPUProgrammableStage {}

}

export {};
