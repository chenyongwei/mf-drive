# Shared Geometry Utilities

A comprehensive, production-ready library for geometric calculations and operations in TypeScript/JavaScript. All functions are **isomorphic** - they work in both Node.js and browser environments without any platform-specific APIs.

## Features

- **Zero dependencies** - Pure TypeScript/JavaScript
- **Isomorphic** - Works in Node.js and browsers
- **Type-safe** - Full TypeScript support
- **Well-documented** - JSDoc comments on all exports
- **Modular** - Import only what you need
- **Production-ready** - Comprehensive error handling and validation

## Installation

This library is part of the `@dxf-fix/shared` package.

```bash
npm install @dxf-fix/shared
```

## Quick Start

```typescript
import {
  distance,
  angleBetweenPoints,
  polygonArea,
  isPointInPolygon
} from '@dxf-fix/shared/utils/geometry';

// Distance between two points
const p1 = { x: 0, y: 0 };
const p2 = { x: 3, y: 4 };
const dist = distance(p1, p2); // 5

// Calculate polygon area
const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 }
];
const area = polygonArea(square); // 100

// Check if point is inside polygon
const inside = isPointInPolygon({ x: 5, y: 5 }, square); // true
```

## Modules

### Distance (`./distance`)

Distance calculations and point operations.

```typescript
import {
  distance,              // Euclidean distance between two points
  distanceSquared,       // Squared distance (faster for comparisons)
  pointToLineSegmentDistance,  // Distance from point to line segment
  closestPointOnLine,    // Find closest point on line segment
  midpoint,              // Midpoint between two points
  pointsEqual,           // Check if points are equal (with tolerance)
  pointKey               // Generate unique key for a point
} from '@dxf-fix/shared/utils/geometry';
```

**Example:**

```typescript
// Calculate distance
const dist = distance({ x: 0, y: 0 }, { x: 3, y: 4 }); // 5

// Find midpoint
const mid = midpoint({ x: 0, y: 0 }, { x: 10, y: 10 }); // { x: 5, y: 5 }

// Check if points are equal (with tolerance)
const equal = pointsEqual({ x: 1, y: 2 }, { x: 1.0000001, y: 2 }); // true
```

### Intersection (`./intersection`)

Line, circle, and shape intersection calculations.

```typescript
import {
  doLinesIntersect,           // Check if two line segments intersect
  getLineIntersection,         // Get intersection point of two lines
  getLineCircleIntersection,   // Get intersections of line and circle
  getCircleCircleIntersection, // Get intersections of two circles
  extendLineToBoundary         // Extend line to intersect with boundary
} from '@dxf-fix/shared/utils/geometry';
```

**Example:**

```typescript
// Line-line intersection
const line1 = { start: { x: 0, y: 0 }, end: { x: 10, y: 10 } };
const line2 = { start: { x: 0, y: 10 }, end: { x: 10, y: 0 } };
const intersection = getLineIntersection(line1, line2); // { x: 5, y: 5 }

// Line-circle intersection
const line = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
const circle = { center: { x: 5, y: 0 }, radius: 3 };
const intersections = getLineCircleIntersection(line, circle);
// [{ x: 2, y: 0 }, { x: 8, y: 0 }]
```

### Angle (`./angle`)

Angle calculations, conversions, and rotations.

```typescript
import {
  angleBetweenPoints,        // Angle formed by three points
  angleBetweenLineSegments,  // Angle between two line segments
  lineDirection,             // Direction angle of a line
  radToDeg,                  // Convert radians to degrees
  degToRad,                  // Convert degrees to radians
  normalizeAngle,            // Normalize angle to [0, 2π)
  normalizeAngleSigned,      // Normalize angle to (-π, π]
  angleDifference,           // Smallest signed angle between two angles
  rotatePoint,               // Rotate point around origin
  arePointsCollinear         // Check if three points are collinear
} from '@dxf-fix/shared/utils/geometry';
```

**Example:**

```typescript
// Calculate angle between three points
const angle = angleBetweenPoints(
  { x: 1, y: 0 },
  { x: 0, y: 0 },
  { x: 0, y: 1 }
); // Math.PI / 2 (90 degrees)

// Convert to degrees
const degrees = radToDeg(angle); // 90

// Rotate a point
const rotated = rotatePoint(
  { x: 1, y: 0 },
  { x: 0, y: 0 },  // origin
  Math.PI / 2      // 90 degrees
); // { x: 0, y: 1 }
```

### Polygon (`./polygon`)

Polygon operations including area, perimeter, and point-in-polygon tests.

```typescript
import {
  polygonArea,              // Calculate polygon area
  polygonAreaSigned,        // Calculate signed area (indicates orientation)
  polygonPerimeter,         // Calculate polygon perimeter
  isPointInPolygon,         // Check if point is inside polygon
  isPointOnPolygonBoundary, // Check if point is on polygon boundary
  isConvexPolygon,          // Check if polygon is convex
  polygonOrientation,       // Get polygon orientation ('CW' or 'CCW')
  polygonCentroid           // Calculate polygon centroid
} from '@dxf-fix/shared/utils/geometry';
```

**Example:**

```typescript
const triangle = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 5, y: 10 }
];

// Calculate area
const area = polygonArea(triangle); // 50

// Calculate perimeter
const perimeter = polygonPerimeter(triangle); // ~32.36

// Check if point is inside
const inside = isPointInPolygon({ x: 5, y: 3 }, triangle); // true

// Get orientation
const orientation = polygonOrientation(triangle); // 'CCW'

// Calculate centroid
const centroid = polygonCentroid(triangle); // { x: 5, y: 3.33 }
```

### Bounding Box (`./bbox`)

Bounding box calculations and operations.

```typescript
import {
  createBBox,             // Create bounding box from coordinates
  bboxFromPoint,          // Bounding box for a point
  bboxFromPoints,         // Bounding box for array of points
  bboxFromLine,           // Bounding box for a line segment
  bboxFromCircle,         // Bounding box for a circle
  bboxFromArc,            // Bounding box for an arc
  bboxWidth,              // Calculate bounding box width
  bboxHeight,             // Calculate bounding box height
  bboxArea,               // Calculate bounding box area
  bboxCenter,             // Calculate bounding box center
  bboxIntersect,          // Check if two bounding boxes intersect
  bboxContainsPoint,      // Check if bbox contains a point
  bboxContainsBBox,       // Check if bbox contains another bbox
  mergeBBox,              // Merge two bounding boxes
  intersectBBox,          // Calculate intersection of two bboxes
  expandBBox              // Expand bounding box by amount
} from '@dxf-fix/shared/utils/geometry';
```

**Example:**

```typescript
// Create bounding box from points
const points = [
  { x: 0, y: 0 },
  { x: 10, y: 5 },
  { x: 5, y: 10 }
];
const bbox = bboxFromPoints(points);
// { minX: 0, minY: 0, maxX: 10, maxY: 10 }

// Check intersection
const bbox2 = { minX: 5, minY: 5, maxX: 15, maxY: 15 };
const intersects = bboxIntersect(bbox, bbox2); // true

// Merge bounding boxes
const merged = mergeBBox(bbox, bbox2);
// { minX: 0, minY: 0, maxX: 15, maxY: 15 }
```

### Contour (`./contour`)

Contour detection and classification from entities.

```typescript
import {
  buildGraph,               // Build entity topology graph
  findClosedLoops,          // Find all closed loops in graph
  validateContour,          // Validate if a loop is properly closed
  extractVerticesFromLoop,  // Extract vertices from a loop
  filterNestedContours,     // Filter out nested contours
  detectContours,           // Main function: detect all contours
  getEntityEndpoints        // Get endpoints of an entity
} from '@dxf-fix/shared/utils/geometry';
```

**Example:**

```typescript
const entities = [
  { id: '1', type: 'LINE', geometry: { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } } },
  { id: '2', type: 'LINE', geometry: { start: { x: 10, y: 0 }, end: { x: 10, y: 10 } } },
  { id: '3', type: 'LINE', geometry: { start: { x: 10, y: 10 }, end: { x: 0, y: 10 } } },
  { id: '4', type: 'LINE', geometry: { start: { x: 0, y: 10 }, end: { x: 0, y: 0 } } }
];

// Detect closed contours
const result = detectContours(entities);
console.log(`Found ${result.numClosed} closed contours`);
// result.contours[0].area === 100
```

### Transform (`./transform`)

Geometric transformations including translation, scaling, rotation, and reflection.

```typescript
import {
  translatePoint,              // Translate a point
  translatePoints,             // Translate array of points
  scalePoint,                  // Scale a point from origin
  scalePoints,                 // Scale array of points
  rotatePoint,                 // Rotate a point around origin
  rotatePoints,                // Rotate array of points
  reflectPointAcrossLine,      // Reflect point across a line
  reflectPointAcrossX,         // Reflect point across X-axis
  reflectPointAcrossY,         // Reflect point across Y-axis
  reflectPointAcrossOrigin,    // Reflect point across origin
  transformPoint,              // Apply multiple transformations
  transformPoints,             // Apply transformations to array
  alignPointsToAngle,          // Align points to a target angle
  createTransformMatrix        // Create transformation matrix
} from '@dxf-fix/shared/utils/geometry';
```

**Example:**

```typescript
const point = { x: 10, y: 10 };

// Translate
const translated = translatePoint(point, { dx: 5, dy: -3 });
// { x: 15, y: 7 }

// Scale from origin
const scaled = scalePoint(point, { sx: 2, sy: 2 });
// { x: 20, y: 20 }

// Rotate 45 degrees
const rotated = rotatePoint(point, { angle: Math.PI / 4 });
// { x: 0, y: 14.14 }

// Apply multiple transformations
const transformed = transformPoint(point, [
  { type: 'scale', scale: { sx: 2, sy: 2 } },
  { type: 'rotate', rotation: { angle: Math.PI / 4 } },
  { type: 'translate', translation: { dx: 10, dy: 10 } }
]);
```

### Validation (`./validation`)

Geometry validation utilities.

```typescript
import {
  validatePoint,            // Validate a point
  validatePoints,           // Validate array of points
  validateBBox,             // Validate bounding box
  validatePolygon,          // Validate a polygon
  validateLineSegment,      // Validate a line segment
  validateCircle,           // Validate a circle
  validatePointInBBox,      // Validate point is within bbox
  validatePolygonClosed,    // Validate polygon is closed
  validateGeometry,         // Generic geometry validation
  isValidWinding,           // Check if polygon has valid winding
  isValidGeometry           // Generic validity check
} from '@dxf-fix/shared/utils/geometry';
```

**Example:**

```typescript
// Validate polygon
const polygon = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 }
];
const result = validatePolygon(polygon);
if (!result.isValid) {
  console.error(result.error);
}

// Validate circle
const circleResult = validateCircle({ x: 5, y: 5 }, 10);
if (circleResult.isValid) {
  console.log('Circle is valid');
}
```

## Usage Patterns

### Functional Imports (Recommended)

Import only what you need for better tree-shaking:

```typescript
import { distance, angleBetweenPoints } from '@dxf-fix/shared/utils/geometry';
```

### Module Imports

Import entire modules if you need many functions:

```typescript
import * as Geometry from '@dxf-fix/shared/utils/geometry';

const dist = Geometry.distance(p1, p2);
const angle = Geometry.angleBetweenPoints(p1, vertex, p3);
```

### Type Imports

Import types for type safety:

```typescript
import type { Point, BoundingBox, LineSegment, Circle } from '@dxf-fix/shared/utils/geometry';

const point: Point = { x: 5, y: 10 };
const bbox: BoundingBox = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
```

## API Reference

See individual module files for complete API documentation with JSDoc comments.

## Best Practices

1. **Use tolerance for floating-point comparisons**: Most functions have a `tolerance` parameter (default: 1e-6)

2. **Validate input before calculations**: Use validation functions to ensure data integrity

3. **Use squared distances for comparisons**: `distanceSquared()` is faster when only comparing distances

4. **Check module exports**: Each module exports related functions for better organization

5. **Handle validation results**: Always check `isValid` property before using validation results

## Error Handling

All functions include comprehensive error handling:

```typescript
const result = validatePolygon(points);
if (!result.isValid) {
  console.error('Invalid polygon:', result.error);
  // Handle error
}
```

## Performance Considerations

- **Distance comparisons**: Use `distanceSquared()` instead of `distance()` when comparing distances
- **Point keys**: Use `pointKey()` for efficient Map/Set operations with points
- **Batch operations**: Use array functions (e.g., `translatePoints`) for multiple points
- **Validation**: Only validate when necessary (e.g., user input), not in tight loops

## Browser Compatibility

All functions use only standard JavaScript/TypeScript features. No browser-specific APIs (DOM, Canvas, etc.) are used, ensuring compatibility across all modern browsers and Node.js versions.

## Contributing

When adding new functions:
1. Add them to the appropriate module file
2. Include JSDoc comments with examples
3. Export from `index.ts`
4. Add tests
5. Update this README

## License

MIT License - see LICENSE file for details
