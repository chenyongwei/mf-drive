export { validatePoint, validatePoints, validateBBox } from './validation/primitives';
export {
  validatePolygon,
  validatePolygonClosed,
  isValidWinding,
} from './validation/polygon';
export {
  validateLineSegment,
  validateCircle,
  validatePointInBBox,
} from './validation/shapes';
export { validateGeometry, isValidGeometry } from './validation/general';
export type { ValidationResult } from './validation/types';
