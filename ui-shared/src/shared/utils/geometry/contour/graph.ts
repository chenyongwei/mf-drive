import { pointKey } from '../distance';

import { getEntityEndpoints } from './endpoints';
import type { Entity, EntityGraph } from './types';

export function buildGraph(entities: Entity[]): EntityGraph {
  const graph: EntityGraph = {
    nodes: new Map(),
    entities: new Map(),
  };

  entities.forEach((entity) => {
    graph.entities.set(entity.id, entity);

    const { start, end } = getEntityEndpoints(entity);
    if (!start || !end) return;

    const startKey = pointKey(start);
    if (!graph.nodes.has(startKey)) {
      graph.nodes.set(startKey, {
        point: start,
        entityIds: [],
        connections: new Map(),
      });
    }
    const startNode = graph.nodes.get(startKey)!;
    startNode.entityIds.push(entity.id);
    startNode.connections.set(entity.id, end);

    const endKey = pointKey(end);
    if (!graph.nodes.has(endKey)) {
      graph.nodes.set(endKey, {
        point: end,
        entityIds: [],
        connections: new Map(),
      });
    }
    const endNode = graph.nodes.get(endKey)!;
    endNode.entityIds.push(entity.id);
    endNode.connections.set(entity.id, start);
  });

  return graph;
}
