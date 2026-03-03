declare global {

  interface GPUOrigin2D {
    width: number;
    height: number;
  }

  type GPUOrigin3D = [number, number, number];

  interface GPUBufferCopyView {
    buffer: GPUBuffer;
    offset?: number;
    bytesPerRow?: number;
    rowsPerImage?: number;
  }

  interface GPUTextureCopyView {
    texture: GPUTexture;
    mipLevel?: number;
    origin?: GPUOrigin3D;
    aspect?: GPUTextureAspect;
  }

  interface GPUDevice extends EventTarget {
    label: string;
    lost: Promise<GPUDeviceLostInfo>;
    features: GPUSupportedFeatures;
    limits: GPUSupportedLimits;
    queue: GPUQueue;
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createBufferMapped(descriptor: GPUBufferDescriptor): GPUBufferMapped;
    createBufferMappedAsync(
      descriptor: GPUBufferDescriptor,
    ): Promise<GPUBufferMapped>;
    createBindGroupLayout(
      descriptor: GPUBindGroupLayoutDescriptor,
    ): GPUBindGroupLayout;
    createPipelineLayout(
      descriptor: GPUPipelineLayoutDescriptor,
    ): GPUPipelineLayout;
    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
    createComputePipeline(
      descriptor: GPUComputePipelineDescriptor,
    ): GPUComputePipeline;
    createComputePipelineAsync(
      descriptor: GPUComputePipelineDescriptor,
    ): Promise<GPUComputePipeline>;
    createRenderPipeline(
      descriptor: GPURenderPipelineDescriptor,
    ): GPURenderPipeline;
    createRenderPipelineAsync(
      descriptor: GPURenderPipelineDescriptor,
    ): Promise<GPURenderPipeline>;
    createCommandEncoder(
      descriptor?: GPUCommandEncoderDescriptor,
    ): GPUCommandEncoder;
    createRenderBundleEncoder(
      descriptor: GPURenderBundleDescriptor,
    ): GPURenderBundleEncoder;
    createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;
    createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
    createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
    destroy(): void;
    addEventListener(
      type: string,
      listener: EventListener | EventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      listener: EventListener | EventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ): void;
    dispatchEvent(event: Event): boolean;
  }

  interface GPUBufferMapped {
    buffer: GPUBuffer;
    getMappedRange(offset?: number, size?: number): ArrayBuffer;
  }

  interface GPUDeviceLostInfo {
    reason: string;
    message: string;
  }

  interface GPUShaderModule {
    label: string;
    getCompilationInfo(): Promise<GPUCompilationMessage[]>;
    destroy(): void;
  }

  interface GPUShaderModuleDescriptor {
    label?: string;
    code: string;
    sourceMap?: string;
  }

  interface GPUCompilationMessage {
    message: string;
    type: GPUCompilationMessageType;
    lineNum: number;
    linePos: number;
    offset: number;
    length: number;
  }

  type GPUCompilationMessageType = "error" | "warning" | "info";

  interface GPUComputePipeline {
    label: string;
    getBindGroupLayout(index: number): GPUBindGroupLayout;
    destroy(): void;
  }

  interface GPURenderPipeline {
    label: string;
    getBindGroupLayout(index: number): GPUBindGroupLayout;
    destroy(): void;
  }

  interface GPUPipelineLayoutDescriptor {
    label?: string;
    bindGroupLayouts: GPUBindGroupLayout[];
  }

  interface GPUSupportedValue {
    name: string;
  }
}

export {};
