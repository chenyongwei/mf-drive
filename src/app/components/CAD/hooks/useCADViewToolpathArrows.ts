import { useCallback, useMemo } from "react";
import type { ToolpathOverlaySegment, Viewport } from "../types/CADCanvasTypes";

export interface ToolpathArrowLod {
  enabled: boolean;
  maxPerGroup: number;
  minVisibleLengthPx: number;
  markerScale: number;
  showAuxArrows: boolean;
}

export interface ArrowMarkerDef {
  viewBox: string;
  markerWidth: number;
  markerHeight: number;
  refX: number;
  refY: number;
  path: string;
}

interface UseCADViewToolpathArrowsOptions {
  viewport: Viewport;
  containerSize: { width: number; height: number };
  toolpathOverlaySegments: ToolpathOverlaySegment[];
}

export function useCADViewToolpathArrows({
  viewport,
  containerSize,
  toolpathOverlaySegments,
}: UseCADViewToolpathArrowsOptions) {
  const arrowLod = useMemo<ToolpathArrowLod>(() => {
    const zoom = viewport.zoom;
    if (zoom < 0.25) {
      return {
        enabled: false,
        maxPerGroup: 0,
        minVisibleLengthPx: Number.POSITIVE_INFINITY,
        markerScale: 0.55,
        showAuxArrows: false,
      };
    }
    if (zoom < 0.5) {
      return {
        enabled: true,
        maxPerGroup: 1,
        minVisibleLengthPx: 56,
        markerScale: 0.62,
        showAuxArrows: true,
      };
    }
    if (zoom < 0.85) {
      return {
        enabled: true,
        maxPerGroup: 2,
        minVisibleLengthPx: 44,
        markerScale: 0.78,
        showAuxArrows: true,
      };
    }
    return {
      enabled: true,
      maxPerGroup: 3,
      minVisibleLengthPx: 32,
      markerScale: 1,
      showAuxArrows: true,
    };
  }, [viewport.zoom]);

  const buildArrowMarker = useCallback((markerScale: number): ArrowMarkerDef => {
    const size = Number((8 * markerScale).toFixed(2));
    const half = Number((size / 2).toFixed(2));
    const markerSize = Number((size * 0.9).toFixed(2));
    const refX = Number((size * 0.9).toFixed(2));
    return {
      viewBox: `0 0 ${size} ${size}`,
      markerWidth: markerSize,
      markerHeight: markerSize,
      refX,
      refY: half,
      path: `M0 0 L${size} ${half} L0 ${size} Z`,
    };
  }, []);

  const CUT_STROKE_WIDTH = 1.6;
  const AUX_STROKE_WIDTH = 1;

  const arrowMarkerCut = useMemo(() => buildArrowMarker(arrowLod.markerScale), [
    arrowLod.markerScale,
    buildArrowMarker,
  ]);

  const arrowMarkerAux = useMemo(() => {
    const compensatedScale = arrowLod.markerScale * (CUT_STROKE_WIDTH / AUX_STROKE_WIDTH);
    return buildArrowMarker(compensatedScale);
  }, [arrowLod.markerScale, buildArrowMarker]);

  const getVisibleSegmentRange = useCallback(
    (
      from: { x: number; y: number },
      to: { x: number; y: number },
    ): { t0: number; t1: number; visibleLengthPx: number } | null => {
      const toScreen = (point: { x: number; y: number }) => ({
        x: point.x * viewport.zoom + viewport.pan.x,
        y: point.y * viewport.zoom + viewport.pan.y,
      });

      const screenFrom = toScreen(from);
      const screenTo = toScreen(to);
      const dx = screenTo.x - screenFrom.x;
      const dy = screenTo.y - screenFrom.y;
      const fullScreenLength = Math.hypot(dx, dy);
      if (fullScreenLength <= 1e-6) return null;

      let t0 = 0;
      let t1 = 1;
      const p = [-dx, dx, -dy, dy];
      const q = [
        screenFrom.x,
        containerSize.width - screenFrom.x,
        screenFrom.y,
        containerSize.height - screenFrom.y,
      ];

      for (let i = 0; i < 4; i += 1) {
        if (Math.abs(p[i]) <= 1e-9) {
          if (q[i] < 0) return null;
          continue;
        }
        const ratio = q[i] / p[i];
        if (p[i] < 0) {
          if (ratio > t1) return null;
          if (ratio > t0) t0 = ratio;
        } else {
          if (ratio < t0) return null;
          if (ratio < t1) t1 = ratio;
        }
      }

      const visibleSpan = t1 - t0;
      if (visibleSpan <= 1e-6) return null;

      return {
        t0,
        t1,
        visibleLengthPx: fullScreenLength * visibleSpan,
      };
    },
    [viewport, containerSize.height, containerSize.width],
  );

  const segmentArrowPointsById = useMemo(() => {
    type ArrowPoint = { x: number; y: number };
    type VisibleSegment = {
      segment: ToolpathOverlaySegment;
      t0: number;
      t1: number;
      visibleLengthPx: number;
    };

    const result = new Map<string, ArrowPoint[]>();
    if (!arrowLod.enabled || toolpathOverlaySegments.length === 0) {
      return result;
    }

    const pointAt = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      t: number,
    ): ArrowPoint => ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

    toolpathOverlaySegments.forEach((segment) => {
      const range = getVisibleSegmentRange(segment.from, segment.to);
      if (!range || range.visibleLengthPx < arrowLod.minVisibleLengthPx) return;

      const allowArrowsForSegment = segment.kind === "CUT" || arrowLod.showAuxArrows;
      if (!allowArrowsForSegment) return;

      const baseArrowCount =
        range.visibleLengthPx <= 220 ? 1 : range.visibleLengthPx <= 440 ? 2 : 3;
      const arrowCount = Math.min(baseArrowCount, arrowLod.maxPerGroup);
      if (arrowCount <= 0) return;

      const points: ArrowPoint[] = [];
      for (let i = 0; i < arrowCount; i += 1) {
        const localRatio = (i + 1) / (arrowCount + 1);
        const t = clamp01(range.t0 + (range.t1 - range.t0) * localRatio);
        points.push(pointAt(segment.from, segment.to, t));
      }
      result.set(segment.segmentId, points);
    });

    return result;
  }, [arrowLod, toolpathOverlaySegments, getVisibleSegmentRange]);

  return {
    arrowLod,
    arrowMarkerCut,
    arrowMarkerAux,
    segmentArrowPointsById,
    cutStrokeWidth: CUT_STROKE_WIDTH,
    auxStrokeWidth: AUX_STROKE_WIDTH,
  };
}
