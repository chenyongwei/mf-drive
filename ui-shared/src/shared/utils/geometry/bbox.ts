export {
  createBBox,
  bboxFromPoint,
  bboxFromPoints,
  bboxFromLine,
  bboxFromCircle,
  bboxFromArc,
} from './bbox/creation';

export { bboxWidth, bboxHeight, bboxArea, bboxCenter } from './bbox/metrics';

export {
  bboxIntersect,
  bboxContainsPoint,
  bboxContainsBBox,
  mergeBBox,
  intersectBBox,
  expandBBox,
} from './bbox/relations';

export type { LineSegment, Circle } from './bbox/types';
