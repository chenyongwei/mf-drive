export type {
  ArcGeometry2D,
  ExplodeArcGeometry,
  ExplodeCircleGeometry,
  ExplodeEntityLike,
  ExplodeEntityType,
  ExplodeGeometry,
  ExplodeLineGeometry,
  ExplodePlan,
  ExplodePlanOptions,
  ExplodePoint,
  ExplodePolylineGeometry,
  ExplodeSegmentPlan,
  LineSegment2D,
} from './explode.types';

export { computeExplodePlan, isExplodableType } from './explode.plans';
