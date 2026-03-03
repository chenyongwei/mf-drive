type TextQuadView = {
  texture: GPUTexture;
  sampler: GPUSampler;
  vertexCount: number;
};

export function renderEngine(
  engine: any,
  zoom: number,
  panX: number,
  panY: number,
  width: number,
  height: number,
  textQuads: TextQuadView[],
): void {
  if (!engine.device || !engine.context || !engine.linePipeline) {
    return;
  }
  if (width <= 0 || height <= 0) {
    return;
  }

  engine.ensureDepthStencilTexture(width, height);
  const matrix = engine.createMatrix(zoom, panX, panY, width, height);

  try {
    if (engine.uniformBuffer) {
      engine.device.queue.writeBuffer(engine.uniformBuffer, 0, matrix);
    }

    const commandEncoder = engine.device.createCommandEncoder();
    const textureView = engine.context.getCurrentTexture().createView();

    const stencilPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: engine.clearColor,
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: engine.depthStencilTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        stencilClearValue: 0,
        stencilLoadOp: "clear",
        stencilStoreOp: "store",
      },
    };

    const stencilPass = commandEncoder.beginRenderPass(stencilPassDescriptor);

    if (engine.stencilMaskPipeline && engine.stencilFillPipeline) {
      if (engine.staticOuterVertexCount > 0 && engine.staticOuterVertexBuffer) {
        stencilPass.setPipeline(engine.stencilMaskPipeline);
        stencilPass.setBindGroup(0, engine.bindGroup);
        stencilPass.setVertexBuffer(0, engine.staticOuterVertexBuffer);
        stencilPass.draw(engine.staticOuterVertexCount);
      }

      if (engine.staticHoleVertexCount > 0 && engine.staticHoleVertexBuffer) {
        stencilPass.setPipeline(engine.stencilMaskPipeline);
        stencilPass.setBindGroup(0, engine.bindGroup);
        stencilPass.setVertexBuffer(0, engine.staticHoleVertexBuffer);
        stencilPass.draw(engine.staticHoleVertexCount);
      }

      if (engine.staticOuterVertexCount > 0 && engine.staticOuterVertexBuffer) {
        stencilPass.setPipeline(engine.stencilFillPipeline);
        stencilPass.setBindGroup(0, engine.bindGroup);
        stencilPass.setVertexBuffer(0, engine.staticOuterVertexBuffer);
        stencilPass.draw(engine.staticOuterVertexCount);
      }
    }

    stencilPass.end();

    const overlayPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          loadOp: "load",
          storeOp: "store",
        },
      ],
    };

    const overlayPass = commandEncoder.beginRenderPass(overlayPassDescriptor);

    if (engine.staticVertexCount > 0 && engine.linePipeline && engine.staticVertexBuffer) {
      overlayPass.setPipeline(engine.linePipeline);
      overlayPass.setBindGroup(0, engine.bindGroup);
      overlayPass.setVertexBuffer(0, engine.staticVertexBuffer);
      overlayPass.draw(engine.staticVertexCount);
    }

    if (
      engine.overlayFillVertexCount > 0 &&
      engine.trianglePipeline &&
      engine.overlayFillVertexBuffer
    ) {
      overlayPass.setPipeline(engine.trianglePipeline);
      overlayPass.setBindGroup(0, engine.bindGroup);
      overlayPass.setVertexBuffer(0, engine.overlayFillVertexBuffer);
      overlayPass.draw(engine.overlayFillVertexCount);
    }

    if (engine.overlayVertexCount > 0 && engine.linePipeline && engine.overlayVertexBuffer) {
      overlayPass.setPipeline(engine.linePipeline);
      overlayPass.setBindGroup(0, engine.bindGroup);
      overlayPass.setVertexBuffer(0, engine.overlayVertexBuffer);
      overlayPass.draw(engine.overlayVertexCount);
    }

    if (textQuads.length > 0 && engine.textPipeline && engine.textBindGroupLayout) {
      overlayPass.setPipeline(engine.textPipeline);

      let vertexOffset = 0;
      for (const quad of textQuads) {
        let cacheKey = (quad.texture as any).cacheKey;
        if (!cacheKey) {
          cacheKey = `tex-${engine.textBindGroupCacheId++}`;
          (quad.texture as any).cacheKey = cacheKey;
        }

        let cached = engine.textBindGroupCache.get(cacheKey);
        let textBindGroup = cached?.bindGroup;

        if (!textBindGroup) {
          textBindGroup = engine.device.createBindGroup({
            layout: engine.textBindGroupLayout,
            entries: [
              { binding: 0, resource: { buffer: engine.uniformBuffer } },
              { binding: 1, resource: quad.texture.createView() },
              { binding: 2, resource: quad.sampler },
            ],
          });
          engine.textBindGroupCache.set(cacheKey, {
            bindGroup: textBindGroup,
            texture: quad.texture,
          });
        }

        overlayPass.setBindGroup(0, textBindGroup);
        overlayPass.setVertexBuffer(0, engine.textVertexBuffer);
        overlayPass.draw(quad.vertexCount, 1, vertexOffset, 0);
        vertexOffset += quad.vertexCount;
      }
    }

    overlayPass.end();
    engine.device.queue.submit([commandEncoder.finish()]);
  } catch (error) {
    console.error("Error in render:", error);
  }
}
