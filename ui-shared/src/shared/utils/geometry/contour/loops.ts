import type { Point } from '../../../types';

import { pointKey, pointsEqual } from '../distance';

import { getEntityEndpoints } from './endpoints';
import type { EntityGraph } from './types';

function getPreviousEndpoint(graph: EntityGraph, loop: string[]): Point {
  if (loop.length < 2) {
    return { x: 0, y: 0 };
  }

  const prevEntity = graph.entities.get(loop[loop.length - 2]);
  const currEntity = graph.entities.get(loop[loop.length - 1]);

  if (!prevEntity || !currEntity) {
    return { x: 0, y: 0 };
  }

  const prevEndpoints = getEntityEndpoints(prevEntity);
  const currEndpoints = getEntityEndpoints(currEntity);

  if (
    !prevEndpoints.start ||
    !prevEndpoints.end ||
    !currEndpoints.start ||
    !currEndpoints.end
  ) {
    return { x: 0, y: 0 };
  }

  if (
    pointsEqual(prevEndpoints.start, currEndpoints.start) ||
    pointsEqual(prevEndpoints.start, currEndpoints.end)
  ) {
    return prevEndpoints.start;
  }

  return prevEndpoints.end;
}

export function findClosedLoops(graph: EntityGraph): string[][] {
  const loops: string[][] = [];
  const visited = new Set<string>();
  const inProgress = new Set<string>();

  function dfs(
    entityId: string,
    currentLoop: string[],
    startNodeId: string,
    visitedEdges: Set<string>
  ): boolean {
    const entity = graph.entities.get(entityId);
    if (!entity) return false;

    const edgeKey = `${currentLoop[currentLoop.length - 1] || 'start'}-${entityId}`;
    if (visitedEdges.has(edgeKey)) return false;
    visitedEdges.add(edgeKey);

    currentLoop.push(entityId);
    inProgress.add(entityId);

    const { end } = getEntityEndpoints(entity);
    if (!end) {
      inProgress.delete(entityId);
      currentLoop.pop();
      return false;
    }

    const currentEnd = currentLoop.length > 1 ? getPreviousEndpoint(graph, currentLoop) : end;

    const nodeKey = pointKey(currentEnd);
    const node = graph.nodes.get(nodeKey);

    if (!node) {
      inProgress.delete(entityId);
      currentLoop.pop();
      return false;
    }

    if (currentLoop.length > 1 && nodeKey === startNodeId) {
      loops.push([...currentLoop]);
      inProgress.delete(entityId);
      currentLoop.pop();
      return true;
    }

    for (const [nextEntityId] of node.connections) {
      if (!inProgress.has(nextEntityId) && !visited.has(nextEntityId)) {
        dfs(nextEntityId, currentLoop, startNodeId, visitedEdges);
      }
    }

    inProgress.delete(entityId);
    currentLoop.pop();
    return false;
  }

  graph.entities.forEach((entity, entityId) => {
    if (!visited.has(entityId)) {
      const { start } = getEntityEndpoints(entity);
      if (start) {
        const startNodeId = pointKey(start);
        dfs(entityId, [], startNodeId, new Set());
      }
      visited.add(entityId);
    }
  });

  return loops;
}
