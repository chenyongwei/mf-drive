import { Entity } from "../../../lib/webgpu/EntityToVertices";
import {
  getLastUsedTextFontPreference,
  setLastUsedTextFontPreference,
} from "../../../services/textFontPreferences";
import type {
  DrawingStateSetters,
  Point2D,
  TextToolOptions,
  TextDraftState,
} from "./useCADDrawing.types";
import { DEFAULT_TEXT_OPTIONS } from "./useCADDrawing.types";

export function getInitialTextToolOptions(): TextToolOptions {
  const preference = getLastUsedTextFontPreference();
  if (!preference.fontId) {
    return DEFAULT_TEXT_OPTIONS;
  }
  return {
    ...DEFAULT_TEXT_OPTIONS,
    fontId: preference.fontId,
    fontFamily: preference.fontFamily ?? DEFAULT_TEXT_OPTIONS.fontFamily,
  };
}

export async function saveDimensionToServer(
  dimension: {
    id: string;
    type: string;
    geometry: {
      start: Point2D;
      end: Point2D;
      textPoint: Point2D;
      text?: string;
    };
  },
  fileId?: string | null,
  targetType: "FILE" | "PART" = "FILE",
): Promise<void> {
  try {
    const params = new URLSearchParams(window.location.search);
    const testParams = [];
    if (params.get("test") === "true") {
      testParams.push("test=true");
    }
    const email = params.get("email");
    if (email) {
      testParams.push(`email=${encodeURIComponent(email)}`);
    }
    const queryParams = testParams.length > 0 ? `?${testParams.join("&")}` : "";

    const response = await fetch(`/api/dimensions${queryParams}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fileId: targetType === "FILE" ? fileId : undefined,
        targetType,
        type: dimension.type.toUpperCase(),
        geometry: dimension.geometry,
      }),
    });

    if (!response.ok) {
      console.error("[useCADDrawing] Failed to save dimension:", await response.text());
    }
  } catch (error) {
    console.error("[useCADDrawing] Error saving dimension:", error);
  }
}

export function generateEntityId(): string {
  return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateEllipse(
  center: Point2D,
  rx: number,
  ry: number,
  segments: number = 64,
): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < segments; i += 1) {
    const t = (i / segments) * 2 * Math.PI;
    points.push({
      x: center.x + rx * Math.cos(t),
      y: center.y + ry * Math.sin(t),
    });
  }
  return points;
}

export function generateArc(
  center: Point2D,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: number = 32,
): Point2D[] {
  const points: Point2D[] = [];
  let sweep = endAngle - startAngle;
  if (sweep <= 0) {
    sweep += 2 * Math.PI;
  }

  for (let i = 0; i <= segments; i += 1) {
    const t = startAngle + (i / segments) * sweep;
    points.push({
      x: center.x + radius * Math.cos(t),
      y: center.y + radius * Math.sin(t),
    });
  }
  return points;
}

export function getCircleFrom3Points(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
): { center: Point2D; radius: number } | null {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  const x3 = p3.x;
  const y3 = p3.y;

  const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
  if (Math.abs(d) < 0.0001) {
    return null;
  }

  const center = {
    x:
      ((x1 * x1 + y1 * y1) * (y2 - y3) +
        (x2 * x2 + y2 * y2) * (y3 - y1) +
        (x3 * x3 + y3 * y3) * (y1 - y2)) /
      d,
    y:
      ((x1 * x1 + y1 * y1) * (x3 - x2) +
        (x2 * x2 + y2 * y2) * (x1 - x3) +
        (x3 * x3 + y3 * y3) * (x2 - x1)) /
      d,
  };

  const radius = Math.sqrt(
    Math.pow(center.x - x1, 2) + Math.pow(center.y - y1, 2),
  );

  return { center, radius };
}

export function generateThreePointArc(p1: Point2D, p2: Point2D, p3: Point2D): Point2D[] {
  const circle = getCircleFrom3Points(p1, p2, p3);
  if (!circle) {
    return [];
  }

  let sAngle = Math.atan2(p1.y - circle.center.y, p1.x - circle.center.x);
  let mAngle = Math.atan2(p2.y - circle.center.y, p2.x - circle.center.x);
  let eAngle = Math.atan2(p3.y - circle.center.y, p3.x - circle.center.x);

  if (sAngle < 0) sAngle += 2 * Math.PI;
  if (mAngle < 0) mAngle += 2 * Math.PI;
  if (eAngle < 0) eAngle += 2 * Math.PI;

  let isCCW = false;
  if (sAngle < eAngle) {
    if (mAngle > sAngle && mAngle < eAngle) isCCW = true;
  } else if (mAngle > sAngle || mAngle < eAngle) {
    isCCW = true;
  }

  const segments = 32;
  let totalSweep = eAngle - sAngle;
  if (isCCW) {
    if (totalSweep < 0) totalSweep += 2 * Math.PI;
  } else if (totalSweep > 0) {
    totalSweep -= 2 * Math.PI;
  }

  const points: Point2D[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = sAngle + (i / segments) * totalSweep;
    points.push({
      x: circle.center.x + circle.radius * Math.cos(t),
      y: circle.center.y + circle.radius * Math.sin(t),
    });
  }
  return points;
}

export function resetDrawingState(setters: DrawingStateSetters): void {
  setters.setIsDrawing(false);
  setters.setStartPoint(null);
  setters.setPreviewEntity(null);
  setters.setPolyPoints([]);
  setters.setCurrentPoint(null);
  setters.setDrawingStep(0);
  setters.setTextDraft(null);
}

export function commitTextDraftEntity(input: {
  draft: TextDraftState | null;
  textToolOptions: TextToolOptions;
  contentOverride?: string;
  onEntityCreate: (entity: Entity) => void;
  setters: DrawingStateSetters;
}): boolean {
  const { draft, textToolOptions, contentOverride, onEntityCreate, setters } = input;
  if (!draft) {
    return false;
  }

  const normalizedContent = String(contentOverride ?? draft.content ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  if (normalizedContent.trim().length === 0) {
    return false;
  }

  const normalizedType = normalizedContent.includes("\n") ? "MTEXT" : "TEXT";
  const nextEntity: Entity = {
    id: generateEntityId(),
    type: normalizedType,
    geometry: {
      position: { ...draft.position },
      text: normalizedContent,
      height: textToolOptions.fontSize,
      rotation: textToolOptions.rotation,
    },
    attributes: {
      textData: {
        content: normalizedContent,
        ...textToolOptions,
      },
    },
    layer: "0",
    color: 7,
    isSelected: false,
  };

  onEntityCreate(nextEntity);
  setLastUsedTextFontPreference(textToolOptions.fontId, textToolOptions.fontFamily);
  resetDrawingState(setters);
  return true;
}
