declare global {
  interface GPUCommandEncoder {
    label: string;
    beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
    beginComputePass(
      descriptor?: GPUComputePassDescriptor,
    ): GPUComputePassEncoder;
    copyBufferToBuffer(
      source: GPUBuffer,
      sourceOffset: number,
      destination: GPUBuffer,
      destinationOffset: number,
      size: number,
    ): void;
    copyBufferToTexture(
      source: GPUBufferCopyView,
      destination: GPUTextureCopyView,
      copySize: GPUOrigin3D,
    ): void;
    copyTextureToBuffer(
      source: GPUTextureCopyView,
      destination: GPUBufferCopyView,
      copySize: GPUOrigin3D,
    ): void;
    copyTextureToTexture(
      source: GPUTextureCopyView,
      destination: GPUTextureCopyView,
      copySize: GPUOrigin3D,
    ): void;
    clearBuffer(buffer: GPUBuffer, offset?: number, size?: number): void;
    writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;
    resolveQuerySet(
      querySet: GPUQuerySet,
      firstQuery: number,
      queryCount: number,
      destination: GPUBuffer,
      destinationOffset: number,
    ): void;
    finish(): GPUCommandBuffer;
  }

  interface GPUCommandEncoderDescriptor {
    label?: string;
  }

  interface GPUCommandBuffer {
    label: string;
    destroy(): void;
  }

  interface GPURenderPassEncoder {
    label: string;
    setViewport(
      x: number,
      y: number,
      width: number,
      height: number,
      minDepth: number,
      maxDepth: number,
    ): void;
    setScissorRect(x: number, y: number, width: number, height: number): void;
    setBlendConstant(color: GPUColorDict): void;
    setStencilReference(reference: number): void;
    beginOcclusionQuery(queryIndex: number): void;
    endOcclusionQuery(): void;
    beginPipelineStatisticsQuery(
      querySet: GPUQuerySet,
      queryIndex: number,
    ): void;
    endPipelineStatisticsQuery(): void;
    writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;
    executeBundles(bundles: GPURenderBundle[]): void;
    end(): void;
    setBindGroup(
      index: number,
      bindGroup: GPUBindGroup | null,
      dynamicOffsets?: number[],
    ): void;
    setPipeline(pipeline: GPURenderPipeline): void;
    setVertexBuffer(
      slot: number,
      buffer: GPUBuffer | null,
      offset?: number,
      size?: number,
    ): void;
    setIndexBuffer(
      buffer: GPUBuffer | null,
      indexFormat: GPUIndexFormat,
      offset?: number,
      size?: number,
    ): void;
    draw(
      vertexCount: number,
      instanceCount?: number,
      firstVertex?: number,
      firstInstance?: number,
    ): void;
    drawIndexed(
      indexCount: number,
      instanceCount?: number,
      firstIndex?: number,
      baseVertex?: number,
      firstInstance?: number,
    ): void;
    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    drawIndexedIndirect(
      indirectBuffer: GPUBuffer,
      indirectOffset: number,
    ): void;
  }

  interface GPURenderPassDescriptor {
    label?: string;
    colorAttachments: GPURenderPassColorAttachment[];
    depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
    occlusionQuerySet?: GPUQuerySet;
    timestampWrites?: GPURenderPassTimestampWrites;
  }

  interface GPURenderPassColorAttachment {
    view: GPUTextureView;
    resolveTarget?: GPUTextureView;
    clearValue?: GPUColorDict | GPUColorClearValue;
    loadOp: GPULoadOp;
    storeOp: GPUStoreOp;
  }

  type GPUColorClearValue = [number, number, number, number];

  interface GPUColorDict {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  type GPULoadOp = "clear" | "load";

  type GPUStoreOp = "store" | "discard";

  interface GPURenderPassDepthStencilAttachment {
    view: GPUTextureView;
    depthClearValue?: number;
    depthLoadOp?: GPULoadOp;
    depthStoreOp?: GPUStoreOp;
    depthReadOnly?: boolean;
    stencilClearValue?: number;
    stencilLoadOp?: GPULoadOp;
    stencilStoreOp?: GPUStoreOp;
    stencilReadOnly?: boolean;
  }

  interface GPURenderPassTimestampWrites {
    querySet: GPUQuerySet;
    beginningOfPassWriteIndex?: number;
    endOfPassWriteIndex?: number;
  }

  interface GPUComputePassEncoder {
    label: string;
    setBindGroup(
      index: number,
      bindGroup: GPUBindGroup | null,
      dynamicOffsets?: number[],
    ): void;
    setPipeline(pipeline: GPUComputePipeline): void;
    dispatchWorkgroups(
      workgroupCountX: number,
      workgroupCountY?: number,
      workgroupCountZ?: number,
    ): void;
    dispatchWorkgroupsIndirect(
      indirectBuffer: GPUBuffer,
      indirectOffset: number,
    ): void;
    writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;
    beginPipelineStatisticsQuery(
      querySet: GPUQuerySet,
      queryIndex: number,
    ): void;
    endPipelineStatisticsQuery(): void;
    end(): void;
  }

  interface GPUComputePassDescriptor {
    label?: string;
    timestampWrites?: GPUComputePassTimestampWrites;
  }

  interface GPUComputePassTimestampWrites {
    querySet: GPUQuerySet;
    beginningOfPassWriteIndex?: number;
    endOfPassWriteIndex?: number;
  }

  interface GPURenderBundle {
    label: string;
    destroy(): void;
  }

  interface GPURenderBundleEncoder {
    label: string;
    finish(descriptor?: GPURenderBundleDescriptor): GPURenderBundle;
    setBindGroup(
      index: number,
      bindGroup: GPUBindGroup | null,
      dynamicOffsets?: number[],
    ): void;
    setPipeline(pipeline: GPURenderPipeline): void;
    setVertexBuffer(
      slot: number,
      buffer: GPUBuffer | null,
      offset?: number,
      size?: number,
    ): void;
    setIndexBuffer(
      buffer: GPUBuffer | null,
      indexFormat: GPUIndexFormat,
      offset?: number,
      size?: number,
    ): void;
    draw(
      vertexCount: number,
      instanceCount?: number,
      firstVertex?: number,
      firstInstance?: number,
    ): void;
    drawIndexed(
      indexCount: number,
      instanceCount?: number,
      firstIndex?: number,
      baseVertex?: number,
      firstInstance?: number,
    ): void;
    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    drawIndexedIndirect(
      indirectBuffer: GPUBuffer,
      indirectOffset: number,
    ): void;
  }

  interface GPURenderBundleDescriptor {
    label?: string;
  }

  interface GPUQuerySet {
    label: string;
    destroy(): void;
  }

  interface GPUQuerySetDescriptor {
    label?: string;
    type: GPUQueryType;
    count: number;
  }

  type GPUQueryType = "occlusion" | "timestamp";

  interface GPUCanvasContext {
    getCurrentTexture(): GPUTexture;
    configure(configuration: GPUCanvasConfiguration): void;
    unconfigure(): void;
  }

  interface GPUCanvasConfiguration {
    device: GPUDevice;
    format: GPUTextureFormat;
    alphaMode?: GPUCanvasAlphaMode;
    colorSpace?: GPUSupportedValue;
    size?: GPUOrigin2D;
  }

  type GPUCanvasAlphaMode = "opaque" | "premultiplied";
}

export {};
