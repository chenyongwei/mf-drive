import type { GraphicDocument, GraphicEntity } from '@dxf-fix/shared';
import type { Entity } from '../lib/webgpu/EntityToVertices';

const defaultLayer = '0';

const mapGraphicEntityToCadEntity = (entity: GraphicEntity, fileId: string): Entity => {
  const cadEntity: Entity = {
    id: entity.id,
    type: entity.type,
    geometry: entity.geometry,
    attributes: entity.attributes,
    layer: entity.layerId || defaultLayer,
    fileId,
    versionToken: entity.versionToken,
  };

  if (entity.style?.strokeColor) {
    cadEntity.strokeColor = entity.style.strokeColor;
  }

  if (entity.style?.lineType) {
    cadEntity.linetype = entity.style.lineType;
  }

  if (entity.partIds && entity.partIds.length > 0) {
    cadEntity.isPart = true;
    cadEntity.partIds = [...entity.partIds];
  }

  return cadEntity;
};

export const graphicDocumentToEntities = (document: GraphicDocument): Entity[] => {
  return Object.values(document.entities).map((graphicEntity) =>
    mapGraphicEntityToCadEntity(graphicEntity, document.meta.fileId),
  );
};
