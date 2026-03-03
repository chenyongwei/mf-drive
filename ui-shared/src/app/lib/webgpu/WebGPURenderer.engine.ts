import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { WebGPUEngine } from "./WebGPUEngine";
import { TextTextureGenerator } from "./TextTextureGenerator";
import { TextTextureCache } from "./TextTextureCache";
import { TextRenderingManager } from "./TextRenderingManager";

export function useWebGPUEngine(canvasRef: RefObject<HTMLCanvasElement>) {
  const engineRef = useRef<WebGPUEngine | null>(null);
  const textRenderingManagerRef = useRef<TextRenderingManager | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let aborted = false;

    const initWebGPU = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (engineRef.current) {
        if (!aborted) {
          setIsSupported(true);
          setIsInitialized(true);
        }
        return;
      }

      const engine = new WebGPUEngine(canvas);
      const success = await engine.initialize();

      if (aborted) {
        engine.cleanup();
        return;
      }

      if (success) {
        engineRef.current = engine;
        setIsSupported(true);
        setIsInitialized(true);

        const textureGenerator = new TextTextureGenerator(engine.getDevice());
        const textureCache = new TextTextureCache(textureGenerator, 100);
        textRenderingManagerRef.current = new TextRenderingManager(
          engine.getDevice(),
          textureCache,
        );
        return;
      }

      setIsSupported(false);
      setError("Failed to initialize WebGPU");
    };

    initWebGPU();

    return () => {
      aborted = true;
      textRenderingManagerRef.current?.destroy();
      textRenderingManagerRef.current = null;
      engineRef.current?.cleanup();
      engineRef.current = null;
    };
  }, [canvasRef]);

  return {
    engineRef,
    textRenderingManagerRef,
    isSupported,
    error,
    isInitialized,
  };
}
