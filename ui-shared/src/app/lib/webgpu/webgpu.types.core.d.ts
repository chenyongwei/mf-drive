declare global {
declare global {
  interface Navigator {
    gpu?: GPU;
  }

  interface GPU {
    isFallbackAdapter: boolean;
    requestAdapter(
      options?: GPURequestAdapterOptions,
    ): Promise<GPUAdapter | null>;
    getPreferredCanvasFormat(): GPUTextureFormat;
  }

  interface GPURequestAdapterOptions {
    powerPreference?: GPUPowerPreference;
    forceFallbackAdapter?: boolean;
  }

  type GPUPowerPreference = "low-power" | "high-performance";

  interface GPUAdapter {
    name: string;
    vendor: string;
    description: string;
    device: GPUDevice;
    isFallbackAdapter: boolean;
    limits: GPUSupportedLimits;
    features: GPUSupportedFeatures;
    info: GPUAdapterInfo;
    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
  }

  interface GPUAdapterInfo {
    vendor: string;
    device: string;
    description: string;
  }

  interface GPUSupportedLimits {
    maxTextureDimension1D: number;
    maxTextureDimension2D: number;
    maxTextureDimension3D: number;
    maxTextureArrayLayers: number;
    maxBindGroups: number;
    maxDynamicUniformBuffersPerPipelineLayout: number;
    maxDynamicStorageBuffersPerPipelineLayout: number;
    maxStorageBuffersPerShaderStage: number;
    maxUniformBuffersPerShaderStage: number;
    maxUniformBufferBindingSize: number;
    maxStorageBufferBindingSize: number;
    minUniformBufferOffsetAlignment: number;
    minStorageBufferOffsetAlignment: number;
    maxVertexBuffers: number;
    maxVertexAttributes: number;
    maxVertexBufferArrayStride: number;
    maxInterStageShaderComponents: number;
    maxComputeWorkgroupStorageSize: number;
    maxComputeWorkgroupInvocations: number;
    maxComputePerDimensionDispatchSize: number;
    maxColorAttachments: number;
    maxColorAttachmentBytesPerSample: number;
    maxFragmentInterStageShaderComponents: number;
  }

  interface GPUSupportedFeatures {
    has(feature: GPUFeatureName): boolean;
    values(): Iterable<GPUFeatureName>;
  }

  type GPUFeatureName =
    | "depth-clip-control"
    | "depth32float-stencil8"
    | "float32-normalized-integer-textures"
    | "float32-blendable-textures"
    | "texture-compression-bc"
    | "texture-compression-etc2"
    | "texture-compression-astc"
    | "indirect-first-instance"
    | "shader-f16"
    | "rg11b10ufloat-renderable"
    | "bgra8unorm-storage"
    | "float32-filterable";

  interface GPUDeviceDescriptor {
    label?: string;
    requiredFeatures?: GPUFeatureName[];
    requiredLimits?: Record<string, number>;
  }

  type GPUBufferUsageFlags = number;

  interface GPUBufferUsage {
    readonly MAP_READ: GPUBufferUsageFlags;
    readonly MAP_WRITE: GPUBufferUsageFlags;
    readonly COPY_SRC: GPUBufferUsageFlags;
    readonly COPY_DST: GPUBufferUsageFlags;
    readonly VERTEX: GPUBufferUsageFlags;
    readonly INDEX: GPUBufferUsageFlags;
    readonly UNIFORM: GPUBufferUsageFlags;
    readonly STORAGE: GPUBufferUsageFlags;
    readonly INDIRECT: GPUBufferUsageFlags;
    readonly QUERY_RESOLVE: GPUBufferUsageFlags;
  }

  // GPU namespace for static constants
  namespace GPU {
    const BufferUsage: GPUBufferUsage;
    const TextureUsage: GPUTextureUsage;
    const ShaderStage: {
      VERTEX: GPUShaderStage;
      FRAGMENT: GPUShaderStage;
      COMPUTE: GPUShaderStage;
    };
  }

  interface GPUBufferDescriptor {
    label?: string;
    size: number;
    usage: GPUBufferUsageFlags;
    mappedAtCreation?: boolean;
  }

  interface GPUBuffer {
    label: string;
    size: number;
    usage: GPUBufferUsage;
    mapState: GPUBufferMapState;
    getMappedRange(offset?: number, size?: number): ArrayBuffer;
    unmap(): void;
    destroy(): void;
  }

  type GPUBufferMapState = "unmapped" | "pending" | "mapped";

  interface GPUBufferBinding {
    buffer: GPUBuffer;
    offset?: number;
    size?: number;
  }

  interface GPUExternalTexture {
    label: string;
    destroy(): void;
  }

  interface GPUTextureView {
    label: string;
    destroy(): void;
  }

  interface GPUTexture {
    label: string;
    width: number;
    height: number;
    depthOrArrayLayers: number;
    mipLevelCount: number;
    sampleCount: number;
    dimension: GPUTextureDimension;
    format: GPUTextureFormat;
    usage: GPUTextureUsageFlags;
    destroy(): void;
    createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
  }

  interface GPUTextureDescriptor {
    label?: string;
    size: GPUOrigin3D | [number, number, number];
    mipLevelCount?: number;
    sampleCount?: number;
    dimension?: GPUTextureDimension;
    format: GPUTextureFormat;
    usage: GPUTextureUsageFlags;
  }

  interface GPUQueue {
    submit(commandBuffers: GPUCommandBuffer[]): void;
    writeBuffer(
      buffer: GPUBuffer,
      bufferOffset: number,
      data: BufferSource,
      dataOffset?: number,
      size?: number,
    ): void;
    writeTexture(
      destination: GPUTextureCopyView,
      source: BufferSource,
      dataLayout: GPUBufferCopyView,
      copySize: GPUOrigin3D,
    ): void;
  }

  type GPUTextureDimension = "1d" | "2d" | "3d";

  type GPUTextureUsageFlags = number;

  interface GPUTextureUsage {
    readonly COPY_SRC: GPUTextureUsageFlags;
    readonly COPY_DST: GPUTextureUsageFlags;
    readonly TEXTURE_BINDING: GPUTextureUsageFlags;
    readonly STORAGE_BINDING: GPUTextureUsageFlags;
    readonly RENDER_ATTACHMENT: GPUTextureUsageFlags;
  }

  interface GPUTextureViewDescriptor {
    label?: string;
    format?: GPUTextureFormat;
    dimension?: GPUTextureViewDimension;
    aspect?: GPUTextureAspect;
    baseMipLevel?: number;
    mipLevelCount?: number;
    baseArrayLayer?: number;
    arrayLayerCount?: number;
  }

  type GPUTextureViewDimension =
    | "1d"
    | "2d"
    | "2d-array"
    | "cube"
    | "cube-array"
    | "3d";

  type GPUTextureAspect = "all" | "stencil-only" | "depth-only";

  type GPUTextureFormat =
    | "r8unorm"
    | "r8snorm"
    | "r8uint"
    | "r8sint"
    | "r16uint"
    | "r16snorm"
    | "r16uint"
    | "r16sint"
    | "r16float"
    | "rg8unorm"
    | "rg8snorm"
    | "rg8uint"
    | "rg8sint"
    | "r32uint"
    | "r32sint"
    | "r32float"
    | "rg16uint"
    | "rg16snorm"
    | "rg16uint"
    | "rg16sint"
    | "rg16float"
    | "rgba8unorm"
    | "rgba8unorm-srgb"
    | "rgba8snorm"
    | "rgba8uint"
    | "rgba8sint"
    | "bgra8unorm"
    | "bgra8unorm-srgb"
    | "rgb10a2unorm"
    | "rgb10a2uint"
    | "rg11b10ufloat"
    | "rgb9e5ufloat"
    | "rg32uint"
    | "rg32sint"
    | "rg32float"
    | "rgba16uint"
    | "rgba16snorm"
    | "rgba16uint"
    | "rgba16sint"
    | "rgba16float"
    | "rgba32uint"
    | "rgba32sint"
    | "rgba32float"
    | "stencil8"
    | "depth16unorm"
    | "depth24plus"
    | "depth24plus-stencil8"
    | "depth32float"
    | "depth32float-stencil8";

  interface GPUSampler {
    label: string;
    destroy(): void;
  }

  interface GPUSamplerDescriptor {
    label?: string;
    addressModeU?: GPUAddressMode;
    addressModeV?: GPUAddressMode;
    addressModeW?: GPUAddressMode;
    magFilter?: GPUFilterMode;
    minFilter?: GPUFilterMode;
    mipmapFilter?: GPUFilterMode;
    lodMinClamp?: number;
    lodMaxClamp?: number;
    compare?: GPUCompareFunction;
    maxAnisotropy?: number;
  }

}

export {};
