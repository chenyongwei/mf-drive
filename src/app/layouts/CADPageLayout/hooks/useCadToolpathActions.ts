import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NestingPart, Plate } from "../../../components/CAD/types/NestingTypes";
import { buildCollisionContours } from "../CADPageLayout.collision";
import { contourCenter, upsertByContourId, type Point2D } from "../CADPageLayout.file-utils";
import type { ToolpathEntryLead, ToolpathMode, ToolpathOverrideState, ToolpathPlanLite, ToolpathSortMode } from "../CADPageLayout.toolpath-types";

const DEFAULT_TOOLPATH_SORT_MODE: ToolpathSortMode = "sort-bottom-top";
const PLATE_INCLUSION_TOLERANCE = 1e-3;
const MIN_SERPENTINE_ROW_TOLERANCE = 8;
const TOOLPATH_AUTO_SYNC_DEBOUNCE_MS = 220;

interface BoundingRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface ContourRef {
  contourId: string;
  partId: string;
  plateId: string;
  role: "inner" | "outer";
  center: Point2D;
}

const toPlateRect = (plate: Plate): BoundingRect => ({
  minX: plate.position.x,
  minY: plate.position.y,
  maxX: plate.position.x + plate.width,
  maxY: plate.position.y + plate.height,
});

const computeBoundingRect = (points: Point2D[]): BoundingRect => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });
  return { minX, minY, maxX, maxY };
};

const fitsInsideRect = (
  rect: BoundingRect,
  bounds: BoundingRect,
  tolerance: number = PLATE_INCLUSION_TOLERANCE,
): boolean =>
  bounds.minX >= rect.minX - tolerance &&
  bounds.maxX <= rect.maxX + tolerance &&
  bounds.minY >= rect.minY - tolerance &&
  bounds.maxY <= rect.maxY + tolerance;

const compareNumber = (a: number, b: number): number =>
  Math.abs(a - b) > 1e-6 ? a - b : 0;

const pointsClose = (left: Point2D, right: Point2D, tolerance = 1e-6): boolean =>
  Math.abs(left.x - right.x) <= tolerance &&
  Math.abs(left.y - right.y) <= tolerance;

const squaredDistance = (from: Point2D, to: Point2D): number => {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  return dx * dx + dy * dy;
};

const compareByParkingDistance = (
  left: ContourRef,
  right: ContourRef,
  parkingPoint: Point2D,
): number =>
  compareNumber(
    squaredDistance(left.center, parkingPoint),
    squaredDistance(right.center, parkingPoint),
  );

const getPlateParkingPoint = (
  plate: Plate,
  effectiveSortMode: ToolpathSortMode,
): Point2D => {
  const left = plate.position.x;
  const top = plate.position.y;
  const bottom = plate.position.y + plate.height;
  if (effectiveSortMode === "sort-top-bottom") {
    return { x: left, y: top };
  }
  return { x: left, y: bottom };
};

const normalizeClosedLoopPoints = (points: Point2D[]): Point2D[] => {
  if (points.length <= 1) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (pointsClose(first, last)) {
    return points.slice(0, -1);
  }
  return points;
};

const projectPointToSegment = (
  point: Point2D,
  start: Point2D,
  end: Point2D,
): { t: number; projected: Point2D; segmentLength: number } => {
  const vx = end.x - start.x;
  const vy = end.y - start.y;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 1e-12) {
    return {
      t: 0,
      projected: start,
      segmentLength: 0,
    };
  }
  const rawT = ((point.x - start.x) * vx + (point.y - start.y) * vy) / lenSq;
  const t = Math.max(0, Math.min(1, rawT));
  return {
    t,
    projected: { x: start.x + vx * t, y: start.y + vy * t },
    segmentLength: Math.sqrt(lenSq),
  };
};

const resolveClosestStartPointParam = (
  contourWorldPoints: Point2D[],
  parkingPoint: Point2D,
): number | null => {
  const loop = normalizeClosedLoopPoints(contourWorldPoints);
  if (loop.length === 0) return null;
  if (loop.length === 1) return 0;

  let perimeter = 0;
  let bestDistanceSq = Infinity;
  let bestOffset = 0;

  for (let index = 0; index < loop.length; index += 1) {
    const start = loop[index];
    const end = loop[(index + 1) % loop.length];
    const projection = projectPointToSegment(parkingPoint, start, end);
    const distanceSq = squaredDistance(projection.projected, parkingPoint);
    const offset = perimeter + projection.t * projection.segmentLength;
    if (
      distanceSq + 1e-9 < bestDistanceSq ||
      (Math.abs(distanceSq - bestDistanceSq) <= 1e-9 &&
        offset < bestOffset)
    ) {
      bestDistanceSq = distanceSq;
      bestOffset = offset;
    }
    perimeter += projection.segmentLength;
  }

  if (perimeter <= 1e-9) return 0;
  const normalized = bestOffset / perimeter;
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, Math.min(1, normalized));
};

const mergeOverridesByContourId = <T extends { contourId: string }>(
  autoOverrides: T[],
  manualOverrides: T[],
): T[] => {
  let merged = autoOverrides.slice();
  manualOverrides.forEach((item) => {
    merged = upsertByContourId(merged, item);
  });
  return merged;
};

const compareContourFallback = (left: ContourRef, right: ContourRef): number => {
  if (left.role !== right.role) return left.role === "inner" ? -1 : 1;
  if (left.partId !== right.partId) return left.partId.localeCompare(right.partId);
  return left.contourId.localeCompare(right.contourId);
};

const compareContourRef = (
  left: ContourRef,
  right: ContourRef,
  effectiveSortMode: ToolpathSortMode,
  parkingPoint: Point2D,
): number => {
  if (effectiveSortMode === "sort-inner-outer") {
    if (left.role !== right.role) return left.role === "inner" ? -1 : 1;
    const distance = compareByParkingDistance(left, right, parkingPoint);
    if (distance !== 0) return distance;
    const x = compareNumber(left.center.x, right.center.x);
    if (x !== 0) return x;
    const y = compareNumber(left.center.y, right.center.y);
    if (y !== 0) return y;
  } else if (effectiveSortMode === "sort-left-right") {
    const x = compareNumber(left.center.x, right.center.x);
    if (x !== 0) return x;
    const distance = compareByParkingDistance(left, right, parkingPoint);
    if (distance !== 0) return distance;
    const y = compareNumber(left.center.y, right.center.y);
    if (y !== 0) return y;
  } else if (effectiveSortMode === "sort-bottom-top") {
    const y = compareNumber(right.center.y, left.center.y);
    if (y !== 0) return y;
    const distance = compareByParkingDistance(left, right, parkingPoint);
    if (distance !== 0) return distance;
    const x = compareNumber(left.center.x, right.center.x);
    if (x !== 0) return x;
  } else {
    const y = compareNumber(left.center.y, right.center.y);
    if (y !== 0) return y;
    const distance = compareByParkingDistance(left, right, parkingPoint);
    if (distance !== 0) return distance;
    const x = compareNumber(left.center.x, right.center.x);
    if (x !== 0) return x;
  }
  return compareContourFallback(left, right);
};

const groupByRowsBottomTop = (
  refs: ContourRef[],
  rowTolerance: number,
  parkingPoint: Point2D,
): ContourRef[][] => {
  const sortedByY = refs
    .slice()
    .sort((left, right) => {
      const y = compareNumber(right.center.y, left.center.y);
      if (y !== 0) return y;
      const distance = compareByParkingDistance(left, right, parkingPoint);
      if (distance !== 0) return distance;
      return compareContourFallback(left, right);
    });

  const rows: Array<{ anchorY: number; items: ContourRef[] }> = [];
  sortedByY.forEach((ref) => {
    const targetRow = rows.find((row) => Math.abs(row.anchorY - ref.center.y) <= rowTolerance);
    if (!targetRow) {
      rows.push({ anchorY: ref.center.y, items: [ref] });
      return;
    }
    targetRow.items.push(ref);
    targetRow.anchorY =
      (targetRow.anchorY * (targetRow.items.length - 1) + ref.center.y) /
      targetRow.items.length;
  });
  rows.sort((left, right) => compareNumber(right.anchorY, left.anchorY));
  return rows.map((row) => row.items);
};

const sortContourRefsByMode = (
  refs: ContourRef[],
  effectiveSortMode: ToolpathSortMode,
  rowTolerance: number,
  parkingPoint: Point2D,
): ContourRef[] => {
  if (effectiveSortMode !== "sort-bottom-top") {
    return refs
      .slice()
      .sort((left, right) =>
        compareContourRef(left, right, effectiveSortMode, parkingPoint),
      );
  }
  const rows = groupByRowsBottomTop(refs, rowTolerance, parkingPoint);
  return rows.flatMap((row, rowIndex) =>
    row
      .slice()
      .sort((left, right) => {
        const x =
          rowIndex % 2 === 0
            ? compareNumber(left.center.x, right.center.x)
            : compareNumber(right.center.x, left.center.x);
        if (x !== 0) return x;
        const distance = compareByParkingDistance(left, right, parkingPoint);
        if (distance !== 0) return distance;
        return compareContourFallback(left, right);
      }),
  );
};

const toWorldPointWithPartTransform = (
  part: NestingPart,
  point: Point2D,
): Point2D => {
  const pivot = {
    x: (part.boundingBox.minX + part.boundingBox.maxX) / 2,
    y: (part.boundingBox.minY + part.boundingBox.maxY) / 2,
  };

  let x = point.x;
  let y = point.y;

  if (part.mirroredX) {
    x = pivot.x - (x - pivot.x);
  }
  if (part.mirroredY) {
    y = pivot.y - (y - pivot.y);
  }

  const radians = ((part.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = x - pivot.x;
  const dy = y - pivot.y;
  const rx = pivot.x + dx * cos - dy * sin;
  const ry = pivot.y + dx * sin + dy * cos;

  return {
    x: rx + (part.position?.x ?? 0),
    y: ry + (part.position?.y ?? 0),
  };
};

interface UseCadToolpathActionsOptions {
  nestingParts: NestingPart[]; visiblePlates: Plate[]; plates: Plate[]; partSpacing: number; commonEdgeEnabled: boolean; getTestModeParams: () => string;
}

export const useCadToolpathActions = ({
  nestingParts,
  visiblePlates,
  plates,
  partSpacing,
  commonEdgeEnabled,
  getTestModeParams,
}: UseCadToolpathActionsOptions) => {
  const [toolpathMode, setToolpathMode] = useState<ToolpathMode>("AUTO");
  const [toolpathOverrides, setToolpathOverrides] = useState<ToolpathOverrideState>({
    startPointOverrides: [],
    leadOverrides: [],
    sequenceOverrides: [],
  });
  const [toolpathPlan, setToolpathPlan] = useState<ToolpathPlanLite | null>(null);
  const [isToolpathBusy, setIsToolpathBusy] = useState(false);
  const [showToolpathOverlay, setShowToolpathOverlay] = useState(false);
  const [toolpathSortMode, setToolpathSortMode] = useState<ToolpathSortMode | null>(DEFAULT_TOOLPATH_SORT_MODE);
  const [toolpathSelectedContourId, setToolpathSelectedContourId] = useState("");
  const [toolpathStartPointParamInput, setToolpathStartPointParamInput] = useState("0.25");
  const [toolpathLeadInLengthInput, setToolpathLeadInLengthInput] = useState("4");
  const [toolpathLeadOutLengthInput, setToolpathLeadOutLengthInput] = useState("3");
  const [toolpathSequenceOrderInput, setToolpathSequenceOrderInput] = useState("0");
  const toolpathSyncSignature = useMemo(() => {
    const activePlates = visiblePlates.length > 0 ? visiblePlates : plates;
    const plateSignature = activePlates
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((plate) =>
        [
          plate.id,
          plate.position.x.toFixed(3),
          plate.position.y.toFixed(3),
          plate.width.toFixed(3),
          plate.height.toFixed(3),
          plate.margin.toFixed(3),
        ].join(":"),
      )
      .join("|");
    const partSignature = nestingParts
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((part) =>
        [
          part.id,
          part.status,
          part.plateId ?? "none",
          part.position.x.toFixed(3),
          part.position.y.toFixed(3),
          part.rotation.toFixed(3),
          part.entities.length,
        ].join(":"),
      )
      .join("|");
    return `plates=${plateSignature};parts=${partSignature};spacing=${partSpacing.toFixed(3)};commonEdge=${commonEdgeEnabled ? 1 : 0}`;
  }, [visiblePlates, plates, nestingParts, partSpacing, commonEdgeEnabled]);
  const currentSyncSignatureRef = useRef(toolpathSyncSignature);
  const latestPlannedSignatureRef = useRef("");
  const autoSyncInFlightRef = useRef(false);

  useEffect(() => {
    currentSyncSignatureRef.current = toolpathSyncSignature;
  }, [toolpathSyncSignature]);

  const buildToolpathPlanRequest = useCallback(
    (mode: ToolpathMode, overrideSortMode?: ToolpathSortMode) => {
      if (nestingParts.length === 0 || plates.length === 0) return null;
      const effectiveSortMode = overrideSortMode ?? toolpathSortMode ?? DEFAULT_TOOLPATH_SORT_MODE;
      const activePlates = visiblePlates.length > 0 ? visiblePlates : plates;
      const materialPlate = activePlates[0];
      const contourRefs: ContourRef[] = [];
      const contourWorldPointsById = new Map<string, Point2D[]>();
      const placedPartsInPlates: Array<{ partId: string; x: number; y: number; rotation: number }> = [];
      const plateById = new Map(activePlates.map((plate) => [plate.id, plate] as const));
      const plateRectById = new Map(activePlates.map((plate) => [plate.id, toPlateRect(plate)] as const));
      const parameters = {
        leadIn: { enabled: true, length: 4, angleDeg: 45 },
        leadOut: { enabled: true, length: 3, angleDeg: 30 },
        microJoint: { enabled: true, count: 1, minSegmentLength: Math.max(10, partSpacing * 2) },
        commonEdge: {
          enabled: commonEdgeEnabled,
          overlapMin: Math.max(20, partSpacing * 3),
          gapTolerance: Math.max(0.5, partSpacing / 10),
        },
        cutRateMmPerSec: 20,
        rapidRateMmPerSec: 80,
        thermalWeight: 2,
      };
      const parts = nestingParts.map((part) => {
        const contourData = buildCollisionContours(
          Array.isArray(part.entities) ? part.entities : [],
          part.boundingBox,
          part.simplifiedContour,
        );
        const outerContourId = `${part.id}-outer`;
        const outerPoints = contourData.outer.map((point) => ({ x: point.x, y: point.y }));
        const outerWorldPoints = outerPoints.map((point) =>
          toWorldPointWithPartTransform(part, point),
        );
        contourWorldPointsById.set(outerContourId, outerWorldPoints);
        const worldBounds = computeBoundingRect(outerWorldPoints);
        const assignedPlate =
          part.plateId && plateById.has(part.plateId)
            ? plateById.get(part.plateId) ?? null
            : null;
        const assignedPlateRect = assignedPlate ? plateRectById.get(assignedPlate.id) : undefined;
        const targetPlate =
          assignedPlate && assignedPlateRect && fitsInsideRect(assignedPlateRect, worldBounds)
            ? assignedPlate
            : activePlates.find((plate) => {
                const rect = plateRectById.get(plate.id);
                return rect ? fitsInsideRect(rect, worldBounds) : false;
              }) ?? null;
        if (!targetPlate) {
          return null;
        }
        placedPartsInPlates.push({
          partId: part.id,
          x: part.position.x,
          y: part.position.y,
          rotation: part.rotation,
        });
        contourRefs.push({
          contourId: outerContourId,
          partId: part.id,
          plateId: targetPlate.id,
          role: "outer",
          center: contourCenter(outerWorldPoints),
        });
        return {
          partId: part.id,
          outerContour: { contourId: outerContourId, closed: true, points: outerPoints },
          innerContours: contourData.inners.map((points, index) => {
            const contourId = `${part.id}-inner-${index + 1}`;
            const contourPoints = points.map((point) => ({ x: point.x, y: point.y }));
            const contourWorldPoints = contourPoints.map((point) =>
              toWorldPointWithPartTransform(part, point),
            );
            contourWorldPointsById.set(contourId, contourWorldPoints);
            contourRefs.push({
              contourId,
              partId: part.id,
              plateId: targetPlate.id,
              role: "inner",
              center: contourCenter(contourWorldPoints),
            });
            return { contourId, closed: true, points: contourPoints };
          }),
          sourceEntityIds: part.entities.map((entity) => entity.id),
          bbox: {
            minX: part.boundingBox.minX,
            minY: part.boundingBox.minY,
            maxX: part.boundingBox.maxX,
            maxY: part.boundingBox.maxY,
          },
          geometryVersion: `ui-${part.id}-${part.entities.length}`,
        };
      });
      const partsInPlates = parts.filter((part): part is NonNullable<typeof part> => part != null);
      if (partsInPlates.length === 0) {
        return null;
      }
      const autoStartPointOverrides: Array<{
        contourId: string;
        startPointParam: number;
      }> = [];
      const autoSequenceOverrides: Array<{ contourId: string; order: number }> = [];
      const plateParkingPoints: NonNullable<ToolpathOverrideState["plateParkingPoints"]> = [];
      let initialParkingPoint: Point2D | null = null;
      let orderCursor = 0;
      const rowTolerance = Math.max(MIN_SERPENTINE_ROW_TOLERANCE, partSpacing * 2);
      activePlates.forEach((plate) => {
        const parkingPoint = getPlateParkingPoint(plate, effectiveSortMode);
        const refsInPlate = sortContourRefsByMode(
          contourRefs.filter((ref) => ref.plateId === plate.id),
          effectiveSortMode,
          rowTolerance,
          parkingPoint,
        );
        const firstRef = refsInPlate[0];
        if (firstRef) {
          plateParkingPoints.push({
            plateId: plate.id,
            contourId: firstRef.contourId,
            x: parkingPoint.x,
            y: parkingPoint.y,
          });
          if (!initialParkingPoint) {
            initialParkingPoint = parkingPoint;
          }
          const worldPoints = contourWorldPointsById.get(firstRef.contourId) ?? [];
          const startPointParam = resolveClosestStartPointParam(worldPoints, parkingPoint);
          if (startPointParam !== null) {
            autoStartPointOverrides.push({
              contourId: firstRef.contourId,
              startPointParam,
            });
          }
        }
        refsInPlate.forEach((item) => {
          autoSequenceOverrides.push({ contourId: item.contourId, order: orderCursor });
          orderCursor += 1;
        });
      });
      const mergedManualStartPointOverrides = mergeOverridesByContourId(
        autoStartPointOverrides,
        toolpathOverrides.startPointOverrides,
      );
      const mergedManualSequenceOverrides = mergeOverridesByContourId(
        autoSequenceOverrides,
        toolpathOverrides.sequenceOverrides,
      );
      const effectiveOverrides =
        mode === "AUTO"
          ? {
              startPointOverrides: autoStartPointOverrides,
              leadOverrides: [],
              sequenceOverrides: autoSequenceOverrides,
            }
          : {
              ...toolpathOverrides,
              startPointOverrides: mergedManualStartPointOverrides,
              sequenceOverrides: mergedManualSequenceOverrides,
            };
      const effectiveOverridesWithParkingPoint: ToolpathOverrideState = {
        ...effectiveOverrides,
        ...(initialParkingPoint ? { parkingPoint: initialParkingPoint } : {}),
        ...(plateParkingPoints.length > 0 ? { plateParkingPoints } : {}),
      };
      return {
        mode,
        layout: {
          layoutId: `layout-${materialPlate?.id ?? "default"}`,
          material: { width: materialPlate?.width ?? 2000, height: materialPlate?.height ?? 1000, thickness: 6 },
          placedParts: placedPartsInPlates,
        },
        parts: partsInPlates,
        parameters,
        overrides: effectiveOverridesWithParkingPoint,
      };
    },
    [nestingParts, visiblePlates, plates, partSpacing, commonEdgeEnabled, toolpathOverrides, toolpathSortMode],
  );

  const requestToolpathPlan = useCallback(
    async (
      mode: ToolpathMode,
      overrideSortMode?: ToolpathSortMode,
      options?: { silent?: boolean },
    ) => {
      const requestSignature = currentSyncSignatureRef.current;
      const requestBody = buildToolpathPlanRequest(mode, overrideSortMode);
      if (!requestBody) {
        if (!options?.silent) {
          alert("请先准备排样零件再生成刀路");
        }
        return;
      }
      try {
        setIsToolpathBusy(true);
        const response = await fetch(`/api/nesting/toolpath/plan${getTestModeParams()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) throw new Error(`刀路生成失败: HTTP ${response.status}`);
        setToolpathPlan((await response.json()) as ToolpathPlanLite);
        setToolpathMode(mode);
        if (overrideSortMode) setToolpathSortMode(overrideSortMode);
        setShowToolpathOverlay(true);
        latestPlannedSignatureRef.current = requestSignature;
      } catch (error: any) {
        if (!options?.silent) {
          alert(error?.message || "刀路生成失败");
        }
      } finally {
        setIsToolpathBusy(false);
      }
    },
    [buildToolpathPlanRequest, getTestModeParams],
  );

  const requestToolpathCheck = useCallback(async () => {
    const requestBody = buildToolpathPlanRequest(toolpathMode);
    if (!requestBody) return alert("请先准备排样零件再检查刀路");
    try {
      setIsToolpathBusy(true);
      const response = await fetch(`/api/nesting/toolpath/check${getTestModeParams()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error(`刀路检查失败: HTTP ${response.status}`);
      const payload = (await response.json()) as ToolpathPlanLite["check"];
      alert(`检查完成\nvalid=${payload.valid}\nviolations=${payload.violations.length}\nwarnings=${payload.warnings.length}`);
    } catch (error: any) {
      alert(error?.message || "刀路检查失败");
    } finally {
      setIsToolpathBusy(false);
    }
  }, [buildToolpathPlanRequest, getTestModeParams, toolpathMode]);

  useEffect(() => {
    if (!showToolpathOverlay || !toolpathPlan?.planId) return;
    if (isToolpathBusy || autoSyncInFlightRef.current) return;
    if (latestPlannedSignatureRef.current === toolpathSyncSignature) return;
    const timer = setTimeout(() => {
      autoSyncInFlightRef.current = true;
      void requestToolpathPlan(toolpathMode, undefined, { silent: true }).finally(() => {
        autoSyncInFlightRef.current = false;
      });
    }, TOOLPATH_AUTO_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [
    isToolpathBusy,
    requestToolpathPlan,
    showToolpathOverlay,
    toolpathMode,
    toolpathPlan?.planId,
    toolpathSyncSignature,
  ]);

  const toolpathContourOptions = useMemo(() => {
    const unique = new Map<string, { contourId: string; partId: string; startPointParam: number; leadIn: ToolpathEntryLead; leadOut: ToolpathEntryLead }>();
    (toolpathPlan?.entries ?? []).forEach((entry) => {
      if (!unique.has(entry.contourId)) unique.set(entry.contourId, { contourId: entry.contourId, partId: entry.partId, startPointParam: entry.startPointParam, leadIn: entry.leadIn, leadOut: entry.leadOut });
    });
    return Array.from(unique.values());
  }, [toolpathPlan]);

  useEffect(() => {
    if (toolpathContourOptions.length === 0) return void setToolpathSelectedContourId("");
    setToolpathSelectedContourId((prev) => (prev && toolpathContourOptions.some((option) => option.contourId === prev) ? prev : toolpathContourOptions[0].contourId));
  }, [toolpathContourOptions]);

  useEffect(() => {
    if (!toolpathSelectedContourId) return;
    const entry = toolpathPlan?.entries.find((item) => item.contourId === toolpathSelectedContourId) ?? null;
    const startOverride = toolpathOverrides.startPointOverrides.find((item) => item.contourId === toolpathSelectedContourId);
    const leadOverride = toolpathOverrides.leadOverrides.find((item) => item.contourId === toolpathSelectedContourId);
    const sequenceOverride = toolpathOverrides.sequenceOverrides.find((item) => item.contourId === toolpathSelectedContourId);
    setToolpathStartPointParamInput(String(startOverride?.startPointParam ?? entry?.startPointParam ?? 0.25));
    setToolpathLeadInLengthInput(String(leadOverride?.leadIn?.length ?? entry?.leadIn.length ?? 4));
    setToolpathLeadOutLengthInput(String(leadOverride?.leadOut?.length ?? entry?.leadOut.length ?? 3));
    setToolpathSequenceOrderInput(String(sequenceOverride?.order ?? 0));
  }, [toolpathSelectedContourId, toolpathPlan, toolpathOverrides]);

  const applyStartPointOverride = useCallback(() => {
    const contourId = toolpathSelectedContourId.trim();
    if (!contourId) return alert("请选择轮廓");
    const parsed = Number(toolpathStartPointParamInput);
    if (!Number.isFinite(parsed)) return alert("startPointParam 必须是数字");
    setToolpathOverrides((prev) => ({ ...prev, startPointOverrides: upsertByContourId(prev.startPointOverrides, { contourId, startPointParam: Math.max(0, Math.min(1, parsed)) }) }));
    void requestToolpathPlan("MANUAL");
  }, [toolpathSelectedContourId, toolpathStartPointParamInput, requestToolpathPlan]);

  const applyLeadOverride = useCallback(() => {
    const contourId = toolpathSelectedContourId.trim();
    if (!contourId) return alert("请选择轮廓");
    const leadInLength = Number(toolpathLeadInLengthInput);
    const leadOutLength = Number(toolpathLeadOutLengthInput);
    if (!Number.isFinite(leadInLength) || !Number.isFinite(leadOutLength)) return alert("引线长度必须是数字");
    setToolpathOverrides((prev) => ({ ...prev, leadOverrides: upsertByContourId(prev.leadOverrides, { contourId, leadIn: { enabled: true, length: Math.max(0, leadInLength), angleDeg: 45 }, leadOut: { enabled: true, length: Math.max(0, leadOutLength), angleDeg: 30 } }) }));
    void requestToolpathPlan("MANUAL");
  }, [toolpathSelectedContourId, toolpathLeadInLengthInput, toolpathLeadOutLengthInput, requestToolpathPlan]);

  const applySequenceOverride = useCallback(() => {
    const contourId = toolpathSelectedContourId.trim();
    if (!contourId) return alert("请选择轮廓");
    const order = Number.parseInt(toolpathSequenceOrderInput, 10);
    if (!Number.isFinite(order) || order < 0) return alert("顺序必须是 >=0 的整数");
    setToolpathOverrides((prev) => ({ ...prev, sequenceOverrides: upsertByContourId(prev.sequenceOverrides, { contourId, order }) }));
    void requestToolpathPlan("MANUAL");
  }, [toolpathSelectedContourId, toolpathSequenceOrderInput, requestToolpathPlan]);

  const exportToolpathByPlan = useCallback(async () => {
    if (!toolpathPlan?.planId) return alert("请先生成刀路计划");
    try {
      setIsToolpathBusy(true);
      const response = await fetch(`/api/nesting/export/gcode${getTestModeParams()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: toolpathPlan.planId }),
      });
      if (!response.ok) throw new Error(`导出失败: HTTP ${response.status}`);
      const payload = await response.json();
      alert(`已导出: ${payload.fileName || "toolpath.nc"}`);
    } catch (error: any) {
      alert(error?.message || "导出失败");
    } finally {
      setIsToolpathBusy(false);
    }
  }, [toolpathPlan, getTestModeParams]);

  const toolpathOverlaySegments = useMemo(
    () => (showToolpathOverlay ? toolpathPlan?.segments ?? [] : []),
    [showToolpathOverlay, toolpathPlan],
  );

  return {
    toolpathMode, toolpathOverrides, setToolpathOverrides, toolpathPlan, setToolpathPlan,
    isToolpathBusy, showToolpathOverlay, setShowToolpathOverlay, toolpathSortMode,
    toolpathSelectedContourId, setToolpathSelectedContourId, toolpathStartPointParamInput,
    setToolpathStartPointParamInput, toolpathLeadInLengthInput, setToolpathLeadInLengthInput,
    toolpathLeadOutLengthInput, setToolpathLeadOutLengthInput, toolpathSequenceOrderInput,
    setToolpathSequenceOrderInput, toolpathContourOptions, requestToolpathPlan,
    requestToolpathCheck, applyStartPointOverride, applyLeadOverride, applySequenceOverride,
    exportToolpathByPlan, toolpathOverlaySegments,
  };
};
