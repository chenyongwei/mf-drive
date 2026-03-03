import type { Entity } from "../../../types/editing";
import { buildGraph as buildGraphShared } from "../../../../shared/utils/geometry/contour/graph";
import { findClosedLoops as findClosedLoopsShared } from "../../../../shared/utils/geometry/contour/loops";
import type { EntityGraph } from "./types";

export function buildGraph(entities: Entity[]): EntityGraph {
  return buildGraphShared(entities as any) as EntityGraph;
}

export function findClosedLoops(graph: EntityGraph): string[][] {
  return findClosedLoopsShared(graph as any);
}
