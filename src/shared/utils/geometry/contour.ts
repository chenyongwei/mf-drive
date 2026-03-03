export { getEntityEndpoints } from './contour/endpoints';
export { buildGraph } from './contour/graph';
export { findClosedLoops } from './contour/loops';
export {
  validateContour,
  extractVerticesFromLoop,
  filterNestedContours,
  detectContours,
} from './contour/detection';

export type {
  Entity,
  GraphNode,
  EntityGraph,
  ContourDetectionResult,
} from './contour/types';
