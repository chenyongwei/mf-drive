import React, { useMemo } from "react";
import { Entity } from "../../../lib/webgpu/EntityToVertices";

interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}

interface TextOverlayProps {
  entities: Entity[];
  viewport: Viewport;
  selectedEntityIds?: Set<string>;
  hoveredEntityId?: string | null;
  theme?: "dark" | "light";
}

type TextRenderPath = {
  kind: "outline" | "centerline";
  d?: string;
  points?: Array<{ x: number; y: number }>;
};

type TextRender = {
  paths?: TextRenderPath[];
  fallback?: boolean;
  lineMetrics?: Array<{ text?: string; width?: number; baselineY?: number }>;
};

function isTextEntity(entity: Entity): boolean {
  const normalized = String(entity.type || "").toUpperCase();
  return normalized === "TEXT" || normalized === "MTEXT";
}

function toSafePoint(value: unknown): { x: number; y: number } | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as { x?: unknown; y?: unknown };
  const x = Number(candidate.x);
  const y = Number(candidate.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

function toRotationDeg(value: unknown): number {
  const radians = Number(value);
  if (!Number.isFinite(radians)) {
    return 0;
  }
  return (radians * 180) / Math.PI;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  entities,
  viewport,
  selectedEntityIds = new Set<string>(),
  hoveredEntityId = null,
  theme = "dark",
}) => {
  const textEntities = useMemo(() => {
    return entities.filter((entity) => {
      if (!isTextEntity(entity)) {
        return false;
      }
      const attrs =
        entity.attributes && typeof entity.attributes === "object"
          ? (entity.attributes as Record<string, unknown>)
          : null;
      const textRender =
        attrs?.textRender && typeof attrs.textRender === "object"
          ? (attrs.textRender as TextRender)
          : null;
      return Array.isArray(textRender?.paths) && textRender.paths.length > 0;
    });
  }, [entities]);

  if (textEntities.length === 0) {
    return null;
  }

  return (
    <g
      transform={`translate(${viewport.pan.x} ${viewport.pan.y}) scale(${viewport.zoom})`}
      pointerEvents="none"
    >
      {textEntities.map((entity) => {
        const attrs =
          entity.attributes && typeof entity.attributes === "object"
            ? (entity.attributes as Record<string, unknown>)
            : null;
        const textRender =
          attrs?.textRender && typeof attrs.textRender === "object"
            ? (attrs.textRender as TextRender)
            : null;
        const textData =
          attrs?.textData && typeof attrs.textData === "object"
            ? (attrs.textData as Record<string, unknown>)
            : null;
        const position = toSafePoint(
          (entity.geometry as { position?: unknown } | undefined)?.position,
        );
        if (!position || !Array.isArray(textRender?.paths)) {
          return null;
        }

        const rotationDeg = toRotationDeg(
          textData?.rotation ??
            (entity.geometry as { rotation?: unknown } | undefined)?.rotation,
        );
        const isSelected = selectedEntityIds.has(entity.id);
        const isHovered = hoveredEntityId === entity.id;
        const stroke = isSelected
          ? "#4a9eff"
          : isHovered
            ? "#f59e0b"
            : theme === "dark"
              ? "#e5e7eb"
              : "#111827";
        const baseStrokeWidth = isSelected ? 1.8 : 1.2;
        const useFallbackText = Boolean(textRender?.fallback);
        const lineMetrics = Array.isArray(textRender?.lineMetrics)
          ? textRender?.lineMetrics ?? []
          : [];
        const fallbackContent = String(
          textData?.content ??
            (entity.geometry as { text?: unknown } | undefined)?.text ??
            "",
        );
        const fallbackFontSize = Number(
          textData?.fontSize ??
            (entity.geometry as { height?: unknown } | undefined)?.height ??
            24,
        );
        const fallbackAlign = String(textData?.alignH ?? "left").toLowerCase();
        const fallbackLineHeight = Number(textData?.lineHeight ?? 1.2);
        const fallbackLines = fallbackContent.split("\n");

        return (
          <g
            key={`text-overlay-${entity.id}`}
            transform={`translate(${position.x} ${position.y}) rotate(${rotationDeg})`}
          >
            {useFallbackText && fallbackLines.length > 0 && (
              <g>
                {fallbackLines.map((line, lineIndex) => {
                  const metric = lineMetrics[lineIndex] ?? null;
                  const baselineY = Number(
                    metric?.baselineY ??
                      fallbackFontSize + lineIndex * fallbackFontSize * fallbackLineHeight,
                  );
                  const lineWidth = Number(metric?.width ?? 0);
                  const x =
                    fallbackAlign === "center"
                      ? -lineWidth / 2
                      : fallbackAlign === "right"
                        ? -lineWidth
                        : 0;
                  return (
                    <text
                      key={`${entity.id}-fallback-${lineIndex}`}
                      x={x}
                      y={baselineY}
                      fill={stroke}
                      fontSize={fallbackFontSize}
                      fontFamily={'"Noto Sans CJK SC", "Noto Sans", "Noto Sans Arabic", "Noto Sans Devanagari", sans-serif'}
                      dominantBaseline="alphabetic"
                    >
                      {line}
                    </text>
                  );
                })}
              </g>
            )}

            {textRender.paths.map((path, pathIndex) => {
              if (useFallbackText) {
                return null;
              }
              if (path.kind === "outline" && typeof path.d === "string" && path.d.trim()) {
                return (
                  <path
                    key={`${entity.id}-outline-${pathIndex}`}
                    d={path.d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={baseStrokeWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }

              if (
                path.kind === "centerline" &&
                Array.isArray(path.points) &&
                path.points.length >= 2
              ) {
                const points = path.points
                  .filter(
                    (point): point is { x: number; y: number } =>
                      Boolean(point) &&
                      Number.isFinite(Number(point.x)) &&
                      Number.isFinite(Number(point.y)),
                  )
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ");
                if (!points) {
                  return null;
                }
                return (
                  <polyline
                    key={`${entity.id}-centerline-${pathIndex}`}
                    points={points}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isSelected ? 2.25 : 1.6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }

              return null;
            })}
          </g>
        );
      })}
    </g>
  );
};

export default TextOverlay;
