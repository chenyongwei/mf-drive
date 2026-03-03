import { chainEntities as chainGeometryEntities } from "../../utils/geometryUtils";
import type { Contour } from "./PartFillGenerator.types";

export function chainEntities(entities: any[]): Contour[] {
  return chainGeometryEntities(entities) as Contour[];
}
