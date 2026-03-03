import type { GraphicDocument, GraphicEntity, GraphicOperation } from "../../../types";

import { applyDeltaToGeometry, applyScaleToGeometry } from "./geometry";

export function applyOperations(
  document: GraphicDocument,
  operations: GraphicOperation[]
): GraphicDocument {
  if (!operations.length) {
    return document;
  }

  const next: GraphicDocument = {
    ...document,
    entities: { ...document.entities },
    topology: {
      layers: document.topology.layers.map((layer) => ({ ...layer })),
      contours: document.topology.contours.map((contour) => ({
        ...contour,
        entityIds: [...contour.entityIds],
        holeEntityIds: contour.holeEntityIds
          ? contour.holeEntityIds.map((list) => [...list])
          : undefined,
      })),
      parts: document.topology.parts.map((part) => ({
        ...part,
        contourIds: [...part.contourIds],
      })),
    },
    indexes: {
      entityToLayers: { ...document.indexes.entityToLayers },
      entityToParts: { ...document.indexes.entityToParts },
      layerOrder: [...document.indexes.layerOrder],
      spatialIndex: document.indexes.spatialIndex
        ? { ...document.indexes.spatialIndex }
        : undefined,
    },
    stats: { ...document.stats },
  };

  for (const operation of operations) {
    switch (operation.type) {
      case "ADD_ENTITY":
        handleAddEntity(next, operation);
        break;
      case "UPDATE_GEOMETRY":
        handleUpdateGeometry(next, operation);
        break;
      case "UPDATE_STYLE":
        handleUpdateStyle(next, operation);
        break;
      case "DELETE_ENTITY":
        handleDeleteEntity(next, operation);
        break;
      case "MOVE_ENTITY":
        handleMoveEntity(next, operation);
        break;
      case "BATCH_TRANSFORM":
        handleBatchTransform(next, operation);
        break;
      case "UPDATE_TOPOLOGY":
        handleUpdateTopology(next, operation);
        break;
      case "ATTACH_METADATA":
        handleAttachMetadata(next, operation);
        break;
      default:
        break;
    }

    if (operation.opSeq > next.stats.lastOpSeq) {
      next.stats.lastOpSeq = operation.opSeq;
    }
  }

  next.stats.entityCount = Object.keys(next.entities).length;
  next.stats.contourCount = next.topology.contours.length;
  next.stats.partCount = next.topology.parts.length;
  next.meta = {
    ...next.meta,
    updatedAt:
      operations[operations.length - 1]?.timestamp || new Date().toISOString(),
  };

  return next;
}

function handleAddEntity(doc: GraphicDocument, op: GraphicOperation) {
  const entity = op.payload?.entity as GraphicEntity | undefined;
  if (!entity) return;
  doc.entities[entity.id] = entity;
  if (entity.layerId) {
    const arr = doc.indexes.entityToLayers[entity.id] || [];
    doc.indexes.entityToLayers[entity.id] = Array.from(
      new Set([...arr, entity.layerId])
    );
  }
  if (entity.partIds) {
    doc.indexes.entityToParts[entity.id] = [...entity.partIds];
  }
}

function handleUpdateGeometry(doc: GraphicDocument, op: GraphicOperation) {
  const targetId = op.targetIds?.[0];
  if (!targetId) return;
  const entity = doc.entities[targetId];
  if (!entity) return;
  if (op.payload?.geometry) {
    entity.geometry = {
      ...entity.geometry,
      ...(op.payload.geometry as Record<string, unknown>),
    } as GraphicEntity["geometry"];
  }
}

function handleUpdateStyle(doc: GraphicDocument, op: GraphicOperation) {
  const targetId = op.targetIds?.[0];
  if (!targetId) return;
  const entity = doc.entities[targetId];
  if (!entity) return;
  entity.style = {
    ...entity.style,
    ...(op.payload?.style as GraphicEntity["style"] | undefined),
  };
}

function handleDeleteEntity(doc: GraphicDocument, op: GraphicOperation) {
  if (!op.targetIds) return;
  for (const id of op.targetIds) {
    delete doc.entities[id];
    delete doc.indexes.entityToLayers[id];
    delete doc.indexes.entityToParts[id];
    doc.topology.contours = doc.topology.contours.map((contour) => ({
      ...contour,
      entityIds: contour.entityIds.filter((entityId) => entityId !== id),
      holeEntityIds: contour.holeEntityIds?.map((holes) =>
        holes.filter((entityId) => entityId !== id)
      ),
    }));
  }
}

function handleMoveEntity(doc: GraphicDocument, op: GraphicOperation) {
  const targetId = op.targetIds?.[0];
  if (!targetId) return;
  const entity = doc.entities[targetId];
  if (!entity) return;
  const delta = op.payload?.delta as { x: number; y: number; z?: number } | undefined;
  if (!delta) return;
  entity.geometry = applyDeltaToGeometry(entity.type, entity.geometry, delta);
}

function handleBatchTransform(doc: GraphicDocument, op: GraphicOperation) {
  const ids = op.payload?.entityIds as string[] | undefined;
  if (!ids?.length) return;
  const delta = op.payload?.delta as { x: number; y: number; z?: number } | undefined;
  const scale = op.payload?.scale as number | undefined;
  for (const id of ids) {
    const entity = doc.entities[id];
    if (!entity) continue;
    let geometry = entity.geometry;
    if (delta) {
      geometry = applyDeltaToGeometry(entity.type, geometry, delta);
    }
    if (typeof scale === "number") {
      geometry = applyScaleToGeometry(entity.type, geometry, scale);
    }
    entity.geometry = geometry;
  }
}

function handleUpdateTopology(doc: GraphicDocument, op: GraphicOperation) {
  const topologyPatch =
    op.payload?.topologyPatch as Partial<GraphicDocument["topology"]> | undefined;
  if (!topologyPatch) return;
  doc.topology = {
    layers: topologyPatch.layers ?? doc.topology.layers,
    contours: topologyPatch.contours ?? doc.topology.contours,
    parts: topologyPatch.parts ?? doc.topology.parts,
  };
}

function handleAttachMetadata(doc: GraphicDocument, op: GraphicOperation) {
  if (!op.targetIds) return;
  for (const id of op.targetIds) {
    const entity = doc.entities[id];
    if (!entity) continue;
    entity.attributes = {
      ...entity.attributes,
      ...(op.payload?.attributes as Record<string, unknown> | undefined),
    };
  }
}
