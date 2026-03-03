export {
  buildGraph,
  findClosedLoops,
} from './contour-detection/graph';

export {
  validateContour,
  calculateBoundingBox,
  calculatePolygonArea,
  extractVerticesFromLoop,
  filterNestedContours,
  detectContours,
} from './contour-detection/detect';

export type { ContourDetectionResult } from './contour-detection/types';
