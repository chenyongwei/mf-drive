import type { RefObject } from "react";

export function drawOnCanvas2D(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
): void {
  const canvas = canvasRef.current;
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw(ctx, canvas);
}
