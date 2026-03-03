import type { DXFEntity, GraphicDocument, GraphicEntity } from "../../../types";

export function graphicEntityToDXF(entity: GraphicEntity): DXFEntity {
  return {
    id: entity.id,
    type: entity.type,
    layer: entity.layerId ?? "0",
    color: entity.style?.strokeColor ? 7 : 7,
    handle: entity.source?.handle ?? "",
    geometry: entity.geometry,
  };
}

export function graphicDocumentToDXFEntities(document: GraphicDocument): DXFEntity[] {
  return Object.values(document.entities).map((entity) =>
    graphicEntityToDXF(entity)
  );
}
