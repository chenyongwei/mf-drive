import { useCallback, useMemo } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import {
  calculateBoundingBox as calculateEntitiesBBox,
  getEntityBBox,
} from "../../../utils/entityBBox";
import {
  mirrorEntity,
  rotateEntity,
  scaleEntity,
  translateEntity,
} from "../../../utils/entityTransform";
import type {
  DimensionAction,
  OptimizeAction,
  SelectAction,
  TransformAction,
} from "../../../components/CAD/RibbonMenu.types";

interface ViewportLike {
  viewport: { zoom: number } | null;
  setViewport: (next: { zoom: number } & Record<string, unknown>) => void;
}

interface UseCadTransformActionsOptions {
  viewport: ViewportLike;
  selectedEntityIds: string[];
  layoutEntities: Entity[];
  setSelectedEntityIds: (value: string[]) => void;
  setEntitiesMap: (
    updater: (prev: Record<string, Entity[]>) => Record<string, Entity[]>,
  ) => void;
  isScaleMode: boolean;
  setIsScaleMode: (updater: (prev: boolean) => boolean) => void;
  t: (key: string) => string;
}

export function useCadTransformActions({
  viewport,
  selectedEntityIds,
  layoutEntities,
  setSelectedEntityIds,
  setEntitiesMap,
  isScaleMode,
  setIsScaleMode,
  t,
}: UseCadTransformActionsOptions) {
  const handleDimensionAction = useCallback(
    (action: DimensionAction) => {
      if (!viewport.viewport) return;

      let newZoom = viewport.viewport.zoom;
      switch (action) {
        case "scale-100mm":
          newZoom = 1.0;
          break;
        case "scale-200mm":
          newZoom = 0.5;
          break;
        case "scale-0.5x":
          newZoom *= 0.5;
          break;
        case "scale-2x":
          newZoom *= 2.0;
          break;
        case "scale-4x":
          newZoom *= 4.0;
          break;
        case "scale-8x":
          newZoom *= 8.0;
          break;
        case "scale-10x":
          newZoom *= 10.0;
          break;
        case "scale-interactive":
          if (selectedEntityIds.length === 0) {
            alert(t("messages.selectToScale") || "Please select entities to scale");
            return;
          }
          setIsScaleMode((prev) => !prev);
          console.log("Interactive scale mode:", !isScaleMode);
          return;
      }

      newZoom = Math.max(0.1, Math.min(newZoom, 50));
      viewport.setViewport({
        ...(viewport.viewport as Record<string, unknown>),
        zoom: newZoom,
      } as { zoom: number } & Record<string, unknown>);
    },
    [viewport, selectedEntityIds, setIsScaleMode, isScaleMode, t],
  );

  const handleTransformAction = useCallback(
    (action: TransformAction) => {
      if (selectedEntityIds.length === 0) return;

      const selectedEntities = layoutEntities.filter((entity) =>
        selectedEntityIds.includes(entity.id),
      );
      if (selectedEntities.length === 0) return;
      const selectionBBox = calculateEntitiesBBox(selectedEntities);
      if (!selectionBBox) return;

      const centerX = (selectionBBox.minX + selectionBBox.maxX) / 2;
      const centerY = (selectionBBox.minY + selectionBBox.maxY) / 2;
      const transformedEntitiesMap: Record<string, Entity[]> = {};

      selectedEntities.forEach((entity) => {
        let transformed: Entity | null = null;
        switch (action) {
          case "rotate-ccw-90":
            transformed = rotateEntity(entity, Math.PI / 2, { x: centerX, y: centerY });
            break;
          case "rotate-cw-90":
            transformed = rotateEntity(entity, -Math.PI / 2, { x: centerX, y: centerY });
            break;
          case "rotate-180":
            transformed = rotateEntity(entity, Math.PI, { x: centerX, y: centerY });
            break;
          case "mirror-horizontal":
            transformed = mirrorEntity(entity, { x: centerX, y: selectionBBox.minY }, { x: centerX, y: selectionBBox.maxY });
            break;
          case "mirror-vertical":
            transformed = mirrorEntity(entity, { x: selectionBBox.minX, y: centerY }, { x: selectionBBox.maxX, y: centerY });
            break;
          case "align-left":
            transformed = translateEntity(entity, selectionBBox.minX - getEntityBBox(entity).minX, 0);
            break;
          case "align-right":
            transformed = translateEntity(entity, selectionBBox.maxX - getEntityBBox(entity).maxX, 0);
            break;
          case "align-top":
            transformed = translateEntity(entity, 0, selectionBBox.maxY - getEntityBBox(entity).maxY);
            break;
          case "align-bottom":
            transformed = translateEntity(entity, 0, selectionBBox.minY - getEntityBBox(entity).minY);
            break;
          case "align-center-h":
            transformed = translateEntity(entity, centerX - (getEntityBBox(entity).minX + getEntityBBox(entity).maxX) / 2, 0);
            break;
          case "align-center-v":
            transformed = translateEntity(entity, 0, centerY - (getEntityBBox(entity).minY + getEntityBBox(entity).maxY) / 2);
            break;
          case "align-center":
            transformed = translateEntity(entity, centerX - (getEntityBBox(entity).minX + getEntityBBox(entity).maxX) / 2, centerY - (getEntityBBox(entity).minY + getEntityBBox(entity).maxY) / 2);
            break;
        }
        if (transformed && entity.fileId) {
          if (!transformedEntitiesMap[entity.fileId]) {
            transformedEntitiesMap[entity.fileId] = [];
          }
          transformedEntitiesMap[entity.fileId].push(transformed);
        }
      });

      setEntitiesMap((prev) => {
        const next = { ...prev };
        Object.entries(transformedEntitiesMap).forEach(([fileId, newEntities]) => {
          const fileEntities = [...(prev[fileId] || [])];
          newEntities.forEach((newEntity) => {
            const index = fileEntities.findIndex((entity) => entity.id === newEntity.id);
            if (index !== -1) fileEntities[index] = newEntity;
          });
          next[fileId] = fileEntities;
        });
        return next;
      });
    },
    [selectedEntityIds, layoutEntities, setEntitiesMap],
  );

  const selectionBBox = useMemo(() => {
    if (selectedEntityIds.length === 0) return null;
    const selectedEntities = layoutEntities.filter((entity) =>
      selectedEntityIds.includes(entity.id),
    );
    return calculateEntitiesBBox(selectedEntities);
  }, [selectedEntityIds, layoutEntities]);

  const handleScale = useCallback(
    (sx: number, sy: number, origin: { x: number; y: number }) => {
      if (selectedEntityIds.length === 0) return;
      const selectedEntities = layoutEntities.filter((entity) =>
        selectedEntityIds.includes(entity.id),
      );
      if (selectedEntities.length === 0) return;

      const transformedEntitiesMap: Record<string, Entity[]> = {};
      selectedEntities.forEach((entity) => {
        const transformed = scaleEntity(entity, sx, sy, origin);
        if (entity.fileId) {
          if (!transformedEntitiesMap[entity.fileId]) transformedEntitiesMap[entity.fileId] = [];
          transformedEntitiesMap[entity.fileId].push(transformed);
        }
      });

      setEntitiesMap((prev) => {
        const next = { ...prev };
        Object.entries(transformedEntitiesMap).forEach(([fileId, newEntities]) => {
          const fileEntities = [...(prev[fileId] || [])];
          newEntities.forEach((newEntity) => {
            const index = fileEntities.findIndex((entity) => entity.id === newEntity.id);
            if (index !== -1) fileEntities[index] = newEntity;
          });
          next[fileId] = fileEntities;
        });
        return next;
      });
      setIsScaleMode(() => false);
    },
    [selectedEntityIds, layoutEntities, setEntitiesMap, setIsScaleMode],
  );

  const handleSelectAction = useCallback(
    (action: SelectAction) => {
      if (action === "select-all") return setSelectedEntityIds(layoutEntities.map((e) => e.id));
      if (action === "deselect") return setSelectedEntityIds([]);
      if (action === "select-invert") {
        const allIds = new Set(layoutEntities.map((e) => e.id));
        const currentSelected = new Set(selectedEntityIds);
        return setSelectedEntityIds(Array.from(allIds).filter((id) => !currentSelected.has(id)));
      }
      if (action === "select-open") {
        const openIds = layoutEntities
          .filter((entity) => {
            const type = entity.type?.toUpperCase();
            if (type === "LINE" || type === "ARC") return true;
            if (type === "LWPOLYLINE" || type === "POLYLINE") return !(entity.geometry as any)?.closed;
            return false;
          })
          .map((entity) => entity.id);
        return setSelectedEntityIds(openIds);
      }
      const typeMap: Record<SelectAction, string[]> = {
        "select-type-line": ["LINE"],
        "select-type-polyline": ["LWPOLYLINE", "POLYLINE"],
        "select-type-circle": ["CIRCLE", "ARC"],
        "select-type-text": ["TEXT", "MTEXT"],
      } as Record<SelectAction, string[]>;
      const normalized = typeMap[action] ?? [];
      setSelectedEntityIds(layoutEntities.filter((e) => normalized.includes(e.type?.toUpperCase() ?? "")).map((e) => e.id));
    },
    [layoutEntities, selectedEntityIds, setSelectedEntityIds],
  );

  const handleOptimizeAction = useCallback(
    (action: OptimizeAction) => {
      const targetIds = selectedEntityIds.length > 0 ? selectedEntityIds : layoutEntities.map((entity) => entity.id);
      if (targetIds.length === 0) {
        alert("没有可优化的实体");
        return;
      }
      alert(`执行优化: ${action}\n对象数量: ${targetIds.length}`);
    },
    [selectedEntityIds, layoutEntities],
  );

  return {
    handleDimensionAction,
    handleTransformAction,
    selectionBBox,
    handleScale,
    handleSelectAction,
    handleOptimizeAction,
  };
}
