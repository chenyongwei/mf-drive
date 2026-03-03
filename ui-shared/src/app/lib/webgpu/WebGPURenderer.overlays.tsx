import React from "react";
import type { Entity } from "./EntityToVertices";
import type { Vertex } from "./WebGPUEngine";
import type { Viewport } from "./WebGPURenderer.types";

interface ExplosionOverlayProps {
  explosionVertices: Vertex[];
  viewport: Viewport;
}

export function ExplosionOverlay({
  explosionVertices,
  viewport,
}: ExplosionOverlayProps): React.JSX.Element | null {
  if (explosionVertices.length === 0) {
    return null;
  }

  return (
    <>
      <style>
        {`
          @keyframes breathe {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; box-shadow: 0 0 5px cyan; }
            50% { transform: translate(-50%, -50%) scale(2.5); opacity: 0.4; box-shadow: 0 0 15px cyan; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; box-shadow: 0 0 5px cyan; }
          }
          .explosion-node {
            position: absolute;
            width: 6px;
            height: 6px;
            background-color: cyan;
            border-radius: 50%;
            pointer-events: none;
            animation: breathe 1s ease-in-out infinite;
            z-index: 10;
          }
        `}
      </style>
      {explosionVertices.map((vertex, index) => (
        <div
          key={index}
          className="explosion-node"
          style={{
            left: vertex.x * viewport.zoom + viewport.pan.x,
            top: vertex.y * viewport.zoom + viewport.pan.y,
          }}
        />
      ))}
    </>
  );
}

interface DrawingBorderOverlaysProps {
  files: { id: string; name: string }[];
  entities: Entity[];
  viewport: Viewport;
  collabInfo?: string;
}

function computeFileBounds(
  fileId: string,
  entities: Entity[],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasEntities = false;

  const check = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  entities.forEach((entityArg) => {
    const entity = entityArg as any;
    if (entity.fileId !== fileId) {
      return;
    }

    hasEntities = true;

    if (entity.type === "LINE") {
      if (entity.start) check(entity.start.x, entity.start.y);
      if (entity.end) check(entity.end.x, entity.end.y);
      return;
    }

    if (entity.type === "LWPOLYLINE" && entity.vertices) {
      entity.vertices.forEach((vertex: { x: number; y: number }) =>
        check(vertex.x, vertex.y),
      );
      return;
    }

    if (entity.type === "CIRCLE" && entity.center && entity.radius) {
      check(entity.center.x - entity.radius, entity.center.y - entity.radius);
      check(entity.center.x + entity.radius, entity.center.y + entity.radius);
    }
  });

  if (!hasEntities || minX === Infinity) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

export function DrawingBorderOverlays({
  files,
  entities,
  viewport,
  collabInfo,
}: DrawingBorderOverlaysProps): React.JSX.Element {
  return (
    <>
      {files.map((file) => {
        const bounds = computeFileBounds(file.id, entities);
        if (!bounds) {
          return null;
        }

        return (
          <div
            key={file.id}
            style={{
              position: "absolute",
              left: bounds.minX * viewport.zoom + viewport.pan.x,
              top: bounds.minY * viewport.zoom + viewport.pan.y,
              width: (bounds.maxX - bounds.minX) * viewport.zoom,
              height: (bounds.maxY - bounds.minY) * viewport.zoom,
              border: "2px dashed white",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                color: "white",
                fontSize: "14px",
                fontWeight: 500,
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                pointerEvents: "none",
              }}
            >
              {file.name}
            </div>

            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "12px",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                pointerEvents: "none",
              }}
            >
              {collabInfo}
            </div>
          </div>
        );
      })}
    </>
  );
}
