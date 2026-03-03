import type {
  BoundingBox,
  Contour,
  DXFEntity,
  GraphicDocument,
  GraphicEntity,
  GraphicTopologyContour,
  GraphicTopologyPart,
  Part,
  Point,
} from "../../../types";

export function graphicToParts(document: GraphicDocument): Part[] {
  if (!document.topology.parts.length) {
    return [];
  }

  const contoursById: Record<string, GraphicTopologyContour> = {};
  for (const contour of document.topology.contours) {
    contoursById[contour.id] = contour;
  }

  return document.topology.parts.map((part) => {
    const partContours = part.contourIds
      .map((contourId) => contoursById[contourId])
      .filter(Boolean);

    const bbox = combineBBoxes(partContours.map((contour) => contour.bbox));

    return {
      id: part.id,
      name: part.name,
      fileId: document.meta.fileId,
      contours: partContours.map((contour) =>
        graphicContourToPartContour(contour, document)
      ),
      processType: (part.processType as Part["processType"]) || "CUT",
      bbox,
      area: 0,
      perimeter: 0,
      thumbnail: undefined,
      entities: collectEntities(partContours, document.entities),
      sourceEntityIds: part.sourceEntityIds,
      graphicDocumentId: document.meta.fileId,
    } satisfies Part;
  });
}

export function partsToGraphic(
  parts: Part[],
  meta: Partial<GraphicDocument["meta"]> & Pick<GraphicDocument["meta"], "fileId">
): GraphicDocument {
  const entities: Record<string, GraphicEntity> = {};
  const contours: GraphicTopologyContour[] = [];
  const graphicParts: GraphicTopologyPart[] = [];
  const layers = [
    {
      id: "default",
      name: "Default",
      visible: true,
      locked: false,
      order: 0,
    },
  ];

  let entityCount = 0;
  for (const part of parts) {
    const contourIds: string[] = [];
    for (const contour of part.contours) {
      const entityId = `poly-${part.id}-${contour.id}`;
      const polyEntity: GraphicEntity = {
        id: entityId,
        type: "POLYLINE",
        geometry: {
          points: contour.vertices,
          closed: contour.isClosed,
        },
        layerId: "default",
      } as GraphicEntity;
      entities[entityId] = polyEntity;
      contourIds.push(contour.id);
      contours.push({
        id: contour.id,
        entityIds: [entityId],
        bbox: contour.bbox,
        isOuter: contour.isOuter,
        partId: part.id,
        sourceEntityIds: contour.sourceEntityIds,
      });
      entityCount += 1;
    }

    graphicParts.push({
      id: part.id,
      name: part.name,
      contourIds,
      processType: part.processType,
      metadata: {},
      sourceEntityIds: part.sourceEntityIds,
    });
  }

  const bbox = combineBBoxes(contours.map((contour) => contour.bbox));
  const now = new Date().toISOString();

  return {
    meta: {
      fileId: meta.fileId,
      revisionId: meta.revisionId ?? `rev-${Date.now()}`,
      canonicalVersion: meta.canonicalVersion ?? "1.0.0",
      sourceFormat: meta.sourceFormat ?? "JSON",
      unit: meta.unit ?? "mm",
      coordinateSystem: meta.coordinateSystem ?? "cartesian",
      createdAt: meta.createdAt ?? now,
      updatedAt: meta.updatedAt ?? now,
      adapter: meta.adapter ?? "parts-to-graphic",
      bbox,
    },
    entities,
    topology: {
      layers,
      contours,
      parts: graphicParts,
    },
    indexes: {
      entityToLayers: Object.fromEntries(
        Object.keys(entities).map((id) => [id, ["default"]])
      ),
      entityToParts: Object.fromEntries(
        graphicParts.flatMap((part) =>
          part.contourIds.flatMap((contourId) => {
            const contour = contours.find((candidate) => candidate.id === contourId);
            const entityIds = contour ? contour.entityIds : [];
            return entityIds.map((entityId) => [entityId, [part.id]]);
          })
        )
      ),
      layerOrder: ["default"],
    },
    stats: {
      entityCount,
      contourCount: contours.length,
      partCount: graphicParts.length,
      lastOpSeq: 0,
    },
  };
}

function graphicContourToPartContour(
  contour: GraphicTopologyContour,
  document: GraphicDocument
): Contour {
  const vertices: Point[] = [];
  for (const entityId of contour.entityIds) {
    const entity = document.entities[entityId];
    if (!entity) continue;
    vertices.push(...extractVertices(entity));
  }

  return {
    id: contour.id,
    entities: contour.entityIds,
    vertices,
    area: 0,
    isClosed: true,
    isOuter: contour.isOuter,
    direction: contour.isOuter ? "CCW" : "CW",
    holes: contour.holeEntityIds?.flat() ?? [],
    bbox: contour.bbox,
    sourceEntityIds: contour.sourceEntityIds,
    graphicDocumentId: document.meta.fileId,
  };
}

function extractVertices(entity: GraphicEntity): Point[] {
  switch (entity.type) {
    case "LINE":
      return [(entity.geometry as any).start, (entity.geometry as any).end];
    case "POLYLINE":
      return (entity.geometry as any).points;
    case "CIRCLE": {
      const circle = entity.geometry as any;
      return [circle.center];
    }
    case "ARC":
      return [(entity.geometry as any).center];
    default:
      return [];
  }
}

function collectEntities(
  contours: GraphicTopologyContour[],
  entityMap: Record<string, GraphicEntity>
): DXFEntity[] {
  const results: DXFEntity[] = [];
  for (const contour of contours) {
    for (const entityId of contour.entityIds) {
      const graphicEntity = entityMap[entityId];
      if (!graphicEntity) continue;
      results.push({
        id: graphicEntity.id,
        type: graphicEntity.type,
        layer: graphicEntity.layerId ?? "0",
        color: 7,
        handle: graphicEntity.source?.handle ?? "",
        geometry: graphicEntity.geometry,
      });
    }
  }
  return results;
}

function combineBBoxes(boxes: BoundingBox[]): BoundingBox {
  if (!boxes.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return boxes.reduce(
    (acc, box) => ({
      minX: Math.min(acc.minX, box.minX),
      minY: Math.min(acc.minY, box.minY),
      maxX: Math.max(acc.maxX, box.maxX),
      maxY: Math.max(acc.maxY, box.maxY),
    }),
    { ...boxes[0] }
  );
}
