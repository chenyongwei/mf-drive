export type {
  Contour,
  PartFillData,
  Point,
} from './PartFillGenerator.types';

export {
  ChannelType,
} from './PartFillGenerator.types';

export {
  getChannelColor,
} from './PartFillGenerator.colors';

export {
  calculatePolygonArea,
  ensureCounterClockwise,
  reverseWindingOrder,
} from './PartFillGenerator.geometry';

export {
  triangulatePolygon,
} from './PartFillGenerator.triangulation';

export {
  generatePartFill,
  generatePartFillFromEntities,
} from './PartFillGenerator.fill';
