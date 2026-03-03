import { z } from "zod";

const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});

const BoundingBoxSchema = z.object({
  minX: z.number(),
  minY: z.number(),
  maxX: z.number(),
  maxY: z.number(),
});

const GraphicUnitSchema = z.enum(["mm", "cm", "inch", "mil"]);
const GraphicUnitConfidenceSchema = z.enum(["declared", "derived", "assumed"]);

const LineGeometrySchema = z.object({
  start: PointSchema,
  end: PointSchema,
});

const ArcGeometrySchema = z.object({
  center: PointSchema,
  radius: z.number(),
  startAngle: z.number(),
  endAngle: z.number(),
});

const CircleGeometrySchema = z.object({
  center: PointSchema,
  radius: z.number(),
});

const PolylineGeometrySchema = z.object({
  points: z.array(PointSchema),
  closed: z.boolean(),
});

const SplineGeometrySchema = z.object({
  controlPoints: z.array(PointSchema),
  degree: z.number(),
  closed: z.boolean(),
});

const EllipseGeometrySchema = z.object({
  center: PointSchema,
  majorAxis: PointSchema,
  minorAxisRatio: z.number(),
  startAngle: z.number(),
  endAngle: z.number(),
});

const TextGeometrySchema = z.object({
  position: PointSchema,
  height: z.number(),
  text: z.string(),
  rotation: z.number(),
  style: z.string(),
});

const MTextGeometrySchema = z.object({
  position: PointSchema,
  height: z.number(),
  width: z.number(),
  text: z.string(),
  rotation: z.number(),
  style: z.string(),
  attachmentPoint: z.number(),
});

const DimensionGeometrySchema = z.object({
  type: z.string(),
  position: PointSchema,
  text: z.string(),
  textPosition: PointSchema,
  points: z.array(PointSchema),
});

const SolidGeometrySchema = z.object({
  points: z.array(PointSchema),
});

const EntityGeometrySchema = z.union([
  LineGeometrySchema,
  ArcGeometrySchema,
  CircleGeometrySchema,
  PolylineGeometrySchema,
  SplineGeometrySchema,
  EllipseGeometrySchema,
  TextGeometrySchema,
  MTextGeometrySchema,
  DimensionGeometrySchema,
  SolidGeometrySchema,
]);

const GraphicStyleSchema = z.object({
  strokeColor: z.string().optional(),
  fillColor: z.string().optional(),
  strokeWidth: z.number().optional(),
  lineType: z.enum(["continuous", "dashed", "dotted"]).optional(),
  opacity: z.number().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  textAlignment: z.enum(["left", "center", "right"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const GraphicEntitySchema = z.object({
  id: z.string(),
  type: z.string(),
  geometry: EntityGeometrySchema,
  style: GraphicStyleSchema.optional(),
  layerId: z.string().optional(),
  partIds: z.array(z.string()).optional(),
  attributes: z.record(z.unknown()).optional(),
  versionToken: z.string().optional(),
  source: z
    .object({
      adapter: z.string(),
      handle: z.string().optional(),
    })
    .optional(),
});

const GraphicLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  visible: z.boolean(),
  locked: z.boolean(),
  order: z.number(),
  sourceName: z.string().optional(),
});

const GraphicContourSchema = z.object({
  id: z.string(),
  entityIds: z.array(z.string()),
  holeEntityIds: z.array(z.array(z.string())).optional(),
  bbox: BoundingBoxSchema,
  isOuter: z.boolean(),
  partId: z.string().optional(),
  sourceEntityIds: z.array(z.string()).optional(),
});

const GraphicPartSchema = z.object({
  id: z.string(),
  name: z.string(),
  contourIds: z.array(z.string()),
  material: z.string().optional(),
  processType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  sourceEntityIds: z.array(z.string()).optional(),
});

const GraphicTopologySchema = z.object({
  layers: z.array(GraphicLayerSchema),
  contours: z.array(GraphicContourSchema),
  parts: z.array(GraphicPartSchema),
});

const GraphicIndexesSchema = z.object({
  entityToLayers: z.record(z.array(z.string())),
  entityToParts: z.record(z.array(z.string())),
  layerOrder: z.array(z.string()),
  spatialIndex: z
    .object({
      gridSize: z.number(),
      maxEntitiesPerCell: z.number(),
    })
    .optional(),
});

const GraphicStatsSchema = z.object({
  entityCount: z.number(),
  contourCount: z.number(),
  partCount: z.number(),
  lastOpSeq: z.number(),
});

const GraphicChunkSchema = z.object({
  id: z.string(),
  bbox: BoundingBoxSchema,
  entityIds: z.array(z.string()),
  level: z.number(),
});

const GraphicMetaSchema = z.object({
  fileId: z.string(),
  revisionId: z.string(),
  canonicalVersion: z.string(),
  sourceFormat: z.string(),
  unit: GraphicUnitSchema,
  sourceUnit: GraphicUnitSchema.or(z.literal("unknown")).optional(),
  unitConfidence: GraphicUnitConfidenceSchema.optional(),
  coordinateSystem: z.enum(["cartesian", "polar"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  adapter: z.string(),
  bbox: BoundingBoxSchema,
});

export const GraphicDocumentSchema = z.object({
  meta: GraphicMetaSchema,
  entities: z.record(GraphicEntitySchema),
  topology: GraphicTopologySchema,
  indexes: GraphicIndexesSchema,
  stats: GraphicStatsSchema,
  chunks: z.array(GraphicChunkSchema).optional(),
});

export const GraphicManifestSchema = z.object({
  fileId: z.string(),
  latestSnapshotId: z.string(),
  latestSnapshotVersion: z.number(),
  latestSnapshotOpSeq: z.number(),
  lastOpSeq: z.number(),
  unit: GraphicUnitSchema,
  sourceUnit: GraphicUnitSchema.or(z.literal("unknown")).optional(),
  canonicalFormatVersion: z.string(),
  sourceFiles: z.array(
    z.object({
      format: z.string(),
      version: z.string(),
      objectPath: z.string(),
      uploadedAt: z.string(),
    })
  ),
  adapters: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      supportsOperations: z.boolean(),
    })
  ),
  chunks: z
    .array(
      z.object({
        id: z.string(),
        objectPath: z.string(),
        bbox: BoundingBoxSchema,
        level: z.number(),
      })
    )
    .optional(),
  compactedBefore: z.number().optional(),
  lastCompactionAt: z.string().optional(),
  nextCompactionThreshold: z.number().optional(),
});

const GraphicAuthorSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
  })
  .optional();

export const GraphicOperationSchema = z.object({
  opSeq: z.number().optional(),
  opId: z.string().optional(),
  type: z.enum([
    "ADD_ENTITY",
    "UPDATE_GEOMETRY",
    "UPDATE_STYLE",
    "DELETE_ENTITY",
    "MOVE_ENTITY",
    "BATCH_TRANSFORM",
    "UPDATE_TOPOLOGY",
    "ATTACH_METADATA",
  ]),
  timestamp: z.string().optional(),
  clientUnit: GraphicUnitSchema.optional(),
  origin: z.enum(["API", "SYSTEM", "ADAPTER"]).optional(),
  author: GraphicAuthorSchema,
  targetIds: z.array(z.string()).optional(),
  payload: z.record(z.unknown()).optional(),
  patch: z
    .object({
      before: z.record(z.unknown()).optional(),
      after: z.record(z.unknown()).optional(),
    })
    .optional(),
  dependencies: z.array(z.string()).optional(),
  versionToken: z.string().optional(),
});

export const GraphicOperationsSchema = z.array(GraphicOperationSchema);
