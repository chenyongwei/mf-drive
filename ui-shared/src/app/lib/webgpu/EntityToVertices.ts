export type {
  Entity,
  VertexConversionOptions,
} from './EntityToVertices.types';

export {
  parseColor,
} from './EntityToVertices.color';

export {
  calculateAdaptiveSegments,
  convertCircleEntity,
  convertEllipseEntity,
  convertLineEntity,
  convertPolylineEntity,
  convertSplineEntity,
} from './EntityToVertices.shapes';

export {
  convertEntitiesToTypedArray,
  convertEntitiesToVertices,
  convertEntityToVertices,
} from './EntityToVertices.convert';

export {
  convertToThickVertices,
} from './EntityToVertices.thick';

export {
  generatePartFill,
} from './EntityToVertices.fill';
