import React, { useEffect, useRef, useState, useCallback } from 'react';
import { drawCanvasScene } from './CADCanvas.draw';
import { screenToWorld } from './CADCanvas.primitives';
import { CADCanvasProps } from './CADCanvas.types';

const CADCanvas: React.FC<CADCanvasProps> = ({
  parts,
  nestResults,
  selectedPartIds,
  selectedResultIds,
  onPartClick,
  onResultClick,
  viewMode,
  nestingSettings,
  onPartPositionChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const rulerSize = { top: 15, left: 15 };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCanvasScene({
      ctx,
      width: canvas.width,
      height: canvas.height,
      viewMode,
      zoom,
      pan,
      rulerSize,
      showRuler,
      showGrid,
      showDimensions,
      mousePosition,
      parts,
      nestResults,
      selectedPartIds,
      selectedResultIds,
      nestingSettings,
    });
  }, [
    viewMode,
    zoom,
    pan,
    showRuler,
    showGrid,
    showDimensions,
    mousePosition,
    parts,
    nestResults,
    selectedPartIds,
    selectedResultIds,
    nestingSettings,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(container);

    const wheelHandler = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
    };

    canvas.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x: x - pan.x, y: y - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isDragging) {
      setPan({ x: x - dragStart.x, y: y - dragStart.y });
    }

    if (x > rulerSize.left && y > rulerSize.top) {
      const world = screenToWorld(x, y, zoom, pan, rulerSize);
      setMousePosition({ x: Math.round(world.x), y: Math.round(world.y) });
    } else {
      setMousePosition(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-gray-900">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      <div className="absolute top-3 left-3 flex gap-2 bg-white/90 backdrop-blur rounded-lg shadow-lg p-1">
        <button onClick={() => setZoom(prev => Math.min(5, prev * 1.2))} className="px-3 py-1 text-sm hover:bg-slate-100 rounded" title="放大">
          🔍+
        </button>
        <button onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))} className="px-3 py-1 text-sm hover:bg-slate-100 rounded" title="缩小">
          🔍-
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-3 py-1 text-sm hover:bg-slate-100 rounded" title="适应窗口">
          ⛶
        </button>
        <div className="w-px bg-slate-300" />
        <button onClick={() => setShowGrid(!showGrid)} className={`px-3 py-1 text-sm hover:bg-slate-100 rounded ${showGrid ? 'text-indigo-600' : ''}`} title="网格">
          #
        </button>
        <button onClick={() => setShowRuler(!showRuler)} className={`px-3 py-1 text-sm hover:bg-slate-100 rounded ${showRuler ? 'text-indigo-600' : ''}`} title="标尺">
          ≡
        </button>
        <button onClick={() => setShowDimensions(!showDimensions)} className={`px-3 py-1 text-sm hover:bg-slate-100 rounded ${showDimensions ? 'text-indigo-600' : ''}`} title="尺寸标注">
          📐
        </button>
      </div>

      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-lg shadow-lg px-3 py-1 text-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default CADCanvas;
