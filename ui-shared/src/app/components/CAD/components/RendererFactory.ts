// src/pages/UniversalCADViewTest/components/RendererFactory.ts
import { ICADRenderer } from "../types/renderer";
import { WebGPURenderer } from "../WebGPUCADView/WebGPURenderer";
import { WebGLRenderer } from "../WebGLCADView/WebGLRenderer";
import { Canvas2DRenderer } from "../Canvas2DCADView/Canvas2DRenderer";

/**
 * Detects available rendering technologies and returns the best appropriate renderer.
 * Priority: WebGL > WebGPU > Canvas 2D
 * Can be overridden via ?renderer=webgl or ?renderer=canvas2d query parameters.
 */
export async function createRenderer(
  canvas: HTMLCanvasElement,
): Promise<ICADRenderer> {
  const urlParams = new URLSearchParams(window.location.search);
  const forcedRenderer = (
    urlParams.get("renderer") || urlParams.get("render")
  )?.toLowerCase();

  // 1. Try WebGL first for better compatibility/stability
  if (!forcedRenderer || forcedRenderer === "webgl") {
    try {
      const glRenderer = new WebGLRenderer();
      await glRenderer.init(canvas);
      console.log("✅ Initialized WebGL Renderer");
      return glRenderer;
    } catch (e) {
      console.warn("⚠️ WebGL init failed, trying WebGPU fallback:", e);
      if (forcedRenderer === "webgl") {
        console.error("❌ Forced WebGL failed.");
      }
    }
  }

  // 2. Try WebGPU (when available and not forcing Canvas2D)
  const hasWebGPU = !!(navigator as any).gpu;
  if (hasWebGPU && forcedRenderer !== "canvas2d") {
    try {
      const wgRenderer = new WebGPURenderer();
      await wgRenderer.init(canvas);
      console.log("✅ Initialized WebGPU Renderer");
      return wgRenderer;
    } catch (e) {
      console.warn("⚠️ WebGPU init failed, falling back to Canvas 2D:", e);
      if (forcedRenderer === "webgpu") {
        console.error("❌ Forced WebGPU failed.");
      }
    }
  }

  // 3. Fallback to Canvas 2D (Universal compatibility)
  console.log("ℹ️ Using Canvas 2D Renderer");
  const canvasRenderer = new Canvas2DRenderer();
  await canvasRenderer.init(canvas);
  return canvasRenderer;
}
