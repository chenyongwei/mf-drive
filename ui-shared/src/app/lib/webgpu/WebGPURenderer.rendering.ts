import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { convertEntitiesToVertices, type Entity } from "./EntityToVertices";
import { generatePartFillFromEntities } from "./PartFillGenerator";
import type { TextRenderingManager, TextLabel } from "./TextRenderingManager";
import type { TextQuad, Vertex, WebGPUEngine } from "./WebGPUEngine";
import { generateMarkerVertices } from "./WebGPURenderer.markers";
import { combineTextQuadVertices } from "./WebGPURenderer.text";
import type {
  InspectionMarker,
  Viewport,
  WebGPURendererProps,
} from "./WebGPURenderer.types";

interface UseWebGPURenderingParams {
  engineRef: RefObject<WebGPUEngine | null>;
  textRenderingManagerRef: RefObject<TextRenderingManager | null>;
  entitiesWithState: Entity[];
  inspectionMarkers: InspectionMarker[];
  partsForFilling: WebGPURendererProps["partsForFilling"];
  enableFillRendering: boolean;
  textLabels: TextLabel[];
  viewport: Viewport;
  width: number;
  height: number;
  isInitialized: boolean;
  isSupported: boolean;
  onFPSUpdate?: (fps: number) => void;
}

export function useWebGPURendering({
  engineRef,
  textRenderingManagerRef,
  entitiesWithState,
  inspectionMarkers,
  partsForFilling,
  enableFillRendering,
  textLabels,
  viewport,
  width,
  height,
  isInitialized,
  isSupported,
  onFPSUpdate,
}: UseWebGPURenderingParams) {
  const renderCountRef = useRef(0);
  const textQuadsCacheRef = useRef<{
    labels: TextLabel[];
    zoom: number;
    quads: TextQuad[];
  } | null>(null);
  const textQuadsRef = useRef<TextQuad[]>([]);
  const verticesCacheRef = useRef<{
    entities: Entity[];
    vertices: Vertex[];
    vertexCount: number;
  } | null>(null);
  const fillVerticesCacheRef = useRef<{
    parts: NonNullable<WebGPURendererProps["partsForFilling"]>;
    vertices: Vertex[];
    vertexCount: number;
  } | null>(null);

  useEffect(() => {
    if (!engineRef.current || !isInitialized || !isSupported) {
      return;
    }
    if (verticesCacheRef.current?.entities === entitiesWithState) {
      return;
    }
    const lineVertices = convertEntitiesToVertices(entitiesWithState);
    const markerVertices = generateMarkerVertices(inspectionMarkers);
    const allVertices = [...lineVertices, ...markerVertices];

    const maxVertices = 50000000;
    if (allVertices.length > maxVertices) {
      const msg = `❌ Too many vertices (${allVertices.length} > ${maxVertices}), cannot render. Please simplify the drawing.`;
      console.error(msg);
      if (renderCountRef.current === 0) {
        alert(msg);
      }
      verticesCacheRef.current = {
        entities: entitiesWithState,
        vertices: [],
        vertexCount: 0,
      };
      return;
    }
    engineRef.current.updateVertices(allVertices, allVertices.length);
    verticesCacheRef.current = {
      entities: entitiesWithState,
      vertices: allVertices,
      vertexCount: allVertices.length,
    };
  }, [engineRef, entitiesWithState, inspectionMarkers, isInitialized, isSupported]);

  useEffect(() => {
    if (!engineRef.current || !isInitialized || !isSupported || !enableFillRendering) {
      return;
    }
    const cachedParts = fillVerticesCacheRef.current?.parts;
    if (
      partsForFilling &&
      cachedParts &&
      cachedParts.length === partsForFilling.length &&
      cachedParts.every(
        (part, i) =>
          part.id === partsForFilling[i].id &&
          part.entities.length === partsForFilling[i].entities.length &&
          part.color === partsForFilling[i].color &&
          part.position?.x === partsForFilling[i].position?.x &&
          part.position?.y === partsForFilling[i].position?.y &&
          part.rotation === partsForFilling[i].rotation,
      )
    ) {
      return;
    }

    if (!partsForFilling || partsForFilling.length === 0) {
      fillVerticesCacheRef.current = {
        parts: [],
        vertices: [],
        vertexCount: 0,
      };
      return;
    }
    const allFillVertices: Vertex[] = [];
    for (const part of partsForFilling) {
      const fillData = generatePartFillFromEntities(
        part.entities,
        part.color,
        part.position,
        part.rotation,
      );
      allFillVertices.push(...fillData.outer, ...fillData.holes);
    }

    const maxFillVertices = 50000000;
    if (allFillVertices.length > maxFillVertices) {
      const msg = `❌ Too many fill vertices (${allFillVertices.length} > ${maxFillVertices}), cannot render fills.`;
      console.error(msg);
      if (renderCountRef.current === 0) {
        alert(msg);
      }
      fillVerticesCacheRef.current = {
        parts: partsForFilling,
        vertices: [],
        vertexCount: 0,
      };
      return;
    }
    engineRef.current.updateFillVertices(allFillVertices, allFillVertices.length);
    fillVerticesCacheRef.current = {
      parts: partsForFilling,
      vertices: allFillVertices,
      vertexCount: allFillVertices.length,
    };
  }, [engineRef, partsForFilling, enableFillRendering, isInitialized, isSupported]);

  useEffect(() => {
    if (
      !engineRef.current ||
      !textRenderingManagerRef.current ||
      !isInitialized ||
      !isSupported
    ) {
      return;
    }

    if (!textLabels || textLabels.length === 0) {
      textQuadsRef.current = [];
      textQuadsCacheRef.current = null;
      return;
    }

    const cacheKey = JSON.stringify(textLabels);
    const currentCacheKey = textQuadsCacheRef.current
      ? JSON.stringify(textQuadsCacheRef.current.labels)
      : null;
    if (currentCacheKey === cacheKey && textQuadsCacheRef.current?.zoom === viewport.zoom) {
      return;
    }
    textRenderingManagerRef.current
      .processTextLabels(textLabels, viewport.zoom)
      .then((quads) => {
        textQuadsRef.current = quads;
        textQuadsCacheRef.current = {
          labels: textLabels,
          zoom: viewport.zoom,
          quads,
        };

        if (!engineRef.current) {
          return;
        }
        const lineVertexCount = verticesCacheRef.current?.vertexCount || 0;
        const fillVertexCount = fillVerticesCacheRef.current?.vertexCount || 0;
        const textBuffer = combineTextQuadVertices(quads);
        if (textBuffer.vertices) {
          engineRef.current.updateTextVertices(textBuffer.vertices, textBuffer.totalTextVertices);
        }
        engineRef.current.render(
          viewport.zoom,
          viewport.pan.x,
          viewport.pan.y,
          width,
          height,
          lineVertexCount,
          fillVertexCount,
          quads,
        );
      })
      .catch((error) => {
        console.error("Error processing text labels:", error);
      });
  }, [engineRef, textRenderingManagerRef, textLabels, viewport, width, height, isInitialized, isSupported]);
  const fpsFrameCountRef = useRef(0);
  const fpsLastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!engineRef.current || !isInitialized || !isSupported) {
      return;
    }
    if (!verticesCacheRef.current || !fillVerticesCacheRef.current) {
      return;
    }
    const lineVertexCount = verticesCacheRef.current.vertexCount;
    const fillVertexCount = fillVerticesCacheRef.current.vertexCount;
    const textQuads = textQuadsRef.current;

    if (lineVertexCount === 0 && fillVertexCount === 0 && textQuads.length === 0) {
      return;
    }
    const textBuffer = combineTextQuadVertices(textQuads);
    if (textBuffer.vertices) {
      engineRef.current.updateTextVertices(textBuffer.vertices, textBuffer.totalTextVertices);
    }
    engineRef.current.render(
      viewport.zoom,
      viewport.pan.x,
      viewport.pan.y,
      width,
      height,
      lineVertexCount,
      fillVertexCount,
      textQuads,
    );

    fpsFrameCountRef.current += 1;
    const now = performance.now();
    const renderDelta = now - fpsLastTimeRef.current;
    if (renderDelta >= 1000) {
      const renderFps = Math.round((fpsFrameCountRef.current * 1000) / renderDelta);
      if (onFPSUpdate) {
        onFPSUpdate(renderFps);
      }
      fpsFrameCountRef.current = 0;
      fpsLastTimeRef.current = now;
    }
  }, [engineRef, width, height, viewport, isInitialized, isSupported, onFPSUpdate]);
}
