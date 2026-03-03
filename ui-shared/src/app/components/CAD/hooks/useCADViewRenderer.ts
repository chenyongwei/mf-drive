import { RefObject, useEffect, useRef, useState } from 'react';
import { Entity } from '../../../lib/webgpu/EntityToVertices';
import { ICADRenderer } from '../types/renderer';
import { createRenderer } from '../components/RendererFactory';
import { NestingPart } from '../types/NestingTypes';
import { getPartDragPreviewOffset, DragPreview } from '../utils/cadViewUtils';
import type { Viewport } from '../types/CADCanvasTypes';

interface UseCADViewRendererOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  entities: Entity[];
  previewEntity: Entity | null;
  selectedEntityIds: Set<string>;
  hoveredEntityId?: string | null;
  partsForFilling: NestingPart[];
  selectedPartIds: string[];
  selectedPartId: string | null;
  dragPreview: DragPreview | null;
  parts: NestingPart[];
  theme: 'dark' | 'light';
  backgroundColor: string;
  viewport: Viewport;
  onContainerResize: (width: number, height: number) => void;
  onStatsUpdate?: (stats: { rendererType: string; fps: number }) => void;
}

export function useCADViewRenderer({
  canvasRef,
  containerRef,
  entities,
  previewEntity,
  selectedEntityIds,
  hoveredEntityId,
  partsForFilling,
  selectedPartIds,
  selectedPartId,
  dragPreview,
  parts,
  theme,
  backgroundColor,
  viewport,
  onContainerResize,
  onStatsUpdate,
}: UseCADViewRendererOptions) {
  const rendererRef = useRef<ICADRenderer | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const [stats, setStats] = useState<{ rendererType: string; fps: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      onContainerResize(width, height);
      rendererRef.current?.resize(width, height);
    };

    (async () => {
      const renderer = await createRenderer(canvas);
      rendererRef.current = renderer;
      renderer.resize(container.clientWidth, container.clientHeight);
      renderer.setBackgroundColor?.(backgroundColor);
      renderer.render(entities, theme);
      onStatsUpdate?.({ rendererType: renderer.type, fps: 0 });
    })();

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    handleResize();

    return () => {
      observer.disconnect();
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setBackgroundColor?.(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (renderer.updateViewport) {
      renderer.updateViewport(viewport.zoom, viewport.pan.x, viewport.pan.y);
    } else {
      renderer.setViewport(viewport.zoom, viewport.pan.x, viewport.pan.y);
    }
  }, [viewport]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const previewEntities = previewEntity ? [previewEntity] : [];
    const drawEntities = previewEntity ? [...entities, previewEntity] : entities;
    const renderOptions = {
      selectedEntityIds,
      hoveredEntityId,
      partsForFilling,
      selectedPartIds,
      selectedPartId,
      previewEntities,
      partDragPreview: getPartDragPreviewOffset(dragPreview, parts),
      invalidPartIds: dragPreview && !dragPreview.isValid ? new Set([dragPreview.partId]) : undefined,
    };

    if (renderer.updateBuffers) {
      renderer.updateBuffers(
        {
          allEntities: entities,
          dynamicEntities: drawEntities,
          previewEntities,
        },
        theme,
        renderOptions,
      );
    } else {
      renderer.render(drawEntities, theme, renderOptions);
    }

    frameCountRef.current += 1;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      const nextStats = { rendererType: renderer.type, fps };
      setStats(nextStats);
      onStatsUpdate?.(nextStats);
    }
  }, [entities, previewEntity, selectedEntityIds, hoveredEntityId, partsForFilling, selectedPartIds, selectedPartId, dragPreview, parts, theme]);

  return { rendererRef, stats };
}
