# Geometry Utilities Migration Guide

This guide helps you migrate from the current geometry code in frontend and backend to the new shared geometry library.

## Overview

The new shared library consolidates duplicate geometry code into a single, well-organized location:

- **Backend**: `/packages/backend/src/utils/geometryUtils.ts` → `@dxf-fix/shared/utils/geometry`
- **Backend**: `/packages/backend/src/utils/geometry.ts` → `@dxf-fix/shared/utils/geometry`
- **Frontend**: `/packages/frontend/src/utils/geometry/` → `@dxf-fix/shared/utils/geometry`

## Benefits of Migrating

1. **Single source of truth** - No more duplicate code
2. **Type-safe** - Shared TypeScript types from `@dxf-fix/shared/types`
3. **Better testing** - Test once, use everywhere
4. **Consistent behavior** - Same calculations in frontend and backend
5. **Better documentation** - JSDoc comments on all functions
6. **Tree-shaking** - Import only what you need

## Module Mapping

### Distance Functions

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `geometryUtils.distance()` | `distance()` | Same signature |
| `geometry.ts:distance()` | `distance()` | Same signature |
| `geometryUtils.pointToLineSegmentDistance()` | `pointToLineSegmentDistance()` | Same signature |
| `extend.ts:distance()` | `distance()` | Private function, now exported |
| `extend.ts:closestPointOnLine()` | `closestPointOnLine()` | Same signature |
| `geometryUtils.midpoint()` | `midpoint()` | Same signature |
| `geometryUtils.pointsEqual()` | `pointsEqual()` | Same signature |
| `contourDetection.ts:pointsEqual()` | `pointsEqual()` | Same signature |
| `contourDetection.ts:pointKey()` | `pointKey()` | Same signature |

**Migration Example:**

```typescript
// OLD (Backend)
import { GeometryUtils } from '../utils/geometryUtils';
const dist = GeometryUtils.distance(p1, p2);

// OLD (Frontend)
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// NEW (Both)
import { distance } from '@dxf-fix/shared/utils/geometry';
const dist = distance(p1, p2);
```

### Intersection Functions

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `geometryUtils.doLinesIntersect()` | `doLinesIntersect()` | Same signature |
| `geometryUtils.getLineIntersection()` | `getLineIntersection()` | Same signature |
| `geometry.ts:findLineIntersection()` | `getLineIntersection()` | Same signature |
| `trim.ts:findLineIntersection()` | `getLineIntersection()` | Same signature |
| `geometry.ts:findLineCircleIntersection()` | `getLineCircleIntersection()` | Same signature |
| `trim.ts:findLineCircleIntersection()` | `getLineCircleIntersection()` | Same signature |
| `trim.ts:findCircleCircleIntersection()` | `getCircleCircleIntersection()` | New function |
| `geometry.ts:extendLineToBoundary()` | `extendLineToBoundary()` | Same signature |
| `trim.ts:extendLineToBoundary()` | `extendLineToBoundary()` | Same signature |
| `extend.ts:findExtensionPoint()` | `extendLineToBoundary()` | Similar functionality |

**Migration Example:**

```typescript
// OLD (Backend)
import { GeometryUtils } from '../utils/geometryUtils';
const intersection = GeometryUtils.getLineIntersection(p1, q1, p2, q2);

// OLD (Frontend)
import { findLineIntersection } from './geometry/trim';
const intersection = findLineIntersection(line1, line2);

// NEW (Both)
import { getLineIntersection } from '@dxf-fix/shared/utils/geometry';
const intersection = getLineIntersection(line1, line2);
```

### Angle Functions

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `geometryUtils.angleBetweenPoints()` | `angleBetweenPoints()` | Same signature |
| `geometryUtils.angleBetweenLineSegments()` | `angleBetweenLineSegments()` | Same signature |
| `geometryUtils.radToDeg()` | `radToDeg()` | Same signature |
| `geometryUtils.degToRad()` | `degToRad()` | Same signature |
| `geometryUtils.normalizeAngle()` | `normalizeAngle()` | Same signature |

**Migration Example:**

```typescript
// OLD (Backend)
import { GeometryUtils } from '../utils/geometryUtils';
const angle = GeometryUtils.angleBetweenPoints(p1, vertex, p3);

// NEW (Both)
import { angleBetweenPoints } from '@dxf-fix/shared/utils/geometry';
const angle = angleBetweenPoints(p1, vertex, p3);
```

### Polygon Functions

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `geometryUtils.polygonArea()` | `polygonArea()` | Same signature |
| `geometryUtils.polygonPerimeter()` | `polygonPerimeter()` | Same signature |
| `geometryUtils.isPointInPolygon()` | `isPointInPolygon()` | Same signature |
| `geometryUtils.isConvexPolygon()` | `isConvexPolygon()` | Same signature |
| `contourDetection.ts:calculatePolygonArea()` | `polygonArea()` | Same functionality |
| `contourDetection.ts:extractVerticesFromLoop()` | `extractVerticesFromLoop()` | Same signature |

**Migration Example:**

```typescript
// OLD (Backend)
import { GeometryUtils } from '../utils/geometryUtils';
const area = GeometryUtils.polygonArea(points);

// OLD (Frontend)
import { calculatePolygonArea } from './geometry/contourDetection';
const area = calculatePolygonArea(vertices);

// NEW (Both)
import { polygonArea } from '@dxf-fix/shared/utils/geometry';
const area = polygonArea(points);
```

### Bounding Box Functions

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `contourDetection.ts:calculateBoundingBox()` | `bboxFromPoints()` | Similar functionality |

**Migration Example:**

```typescript
// OLD (Frontend)
import { calculateBoundingBox } from './geometry/contourDetection';
const bbox = calculateBoundingBox(entities);

// NEW (Both)
import { bboxFromPoints } from '@dxf-fix/shared/utils/geometry';
const points = entities.map(e => e.geometry.start);
const bbox = bboxFromPoints(points);
```

### Contour Detection Functions

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `contourDetection.ts:buildGraph()` | `buildGraph()` | Same signature |
| `contourDetection.ts:findClosedLoops()` | `findClosedLoops()` | Same signature |
| `contourDetection.ts:validateContour()` | `validateContour()` | Same signature |
| `contourDetection.ts:detectContours()` | `detectContours()` | Same signature |
| `contourDetection.ts:filterNestedContours()` | `filterNestedContours()` | Same signature |

**Migration Example:**

```typescript
// OLD (Frontend)
import { detectContours } from './geometry/contourDetection';
const result = detectContours(entities);

// NEW (Both)
import { detectContours } from '@dxf-fix/shared/utils/geometry';
const result = detectContours(entities);
```

### Transform Functions

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `angle.ts:rotatePoint()` | `rotatePoint()` | Same signature |
| `transform.ts:*` | `transform.ts:*` | New comprehensive module |

**Migration Example:**

```typescript
// OLD
import { rotatePoint } from './geometry/angle';
const rotated = rotatePoint(point, origin, angle);

// NEW
import { rotatePoint as rotatePointTransform } from '@dxf-fix/shared/utils/geometry';
const rotated = rotatePointTransform(point, { angle, origin });
```

### Validation Functions

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| Various | `validation.ts:*` | New comprehensive module |

## Step-by-Step Migration

### Backend Migration

#### 1. Update imports in geometryUtils.ts

**OLD:**
```typescript
// /packages/backend/src/utils/geometryUtils/index.ts
export class GeometryUtils {
  static distance(p1: Point, p2: Point): number { ... }
  static polygonArea(points: Point[]): number { ... }
  // etc.
}
```

**NEW:**
```typescript
// Re-export from shared library for backward compatibility
export {
  distance,
  polygonArea,
  // etc.
} from '@dxf-fix/shared/utils/geometry';
```

#### 2. Update backend code using GeometryUtils

**OLD:**
```typescript
import { GeometryUtils } from '../utils/geometryUtils';

const dist = GeometryUtils.distance(p1, p2);
const area = GeometryUtils.polygonArea(points);
```

**NEW:**
```typescript
import { distance, polygonArea } from '@dxf-fix/shared/utils/geometry';

const dist = distance(p1, p2);
const area = polygonArea(points);
```

### Frontend Migration

#### 1. Update trim.ts imports

**OLD:**
```typescript
import { findLineIntersection, findLineCircleIntersection } from './trim';
```

**NEW:**
```typescript
import {
  getLineIntersection,
  getLineCircleIntersection
} from '@dxf-fix/shared/utils/geometry';

// Keep old function names for backward compatibility if needed
export const findLineIntersection = getLineIntersection;
export const findLineCircleIntersection = getLineCircleIntersection;
```

#### 2. Update extend.ts imports

**OLD:**
```typescript
import { findLineIntersection } from './trim';
```

**NEW:**
```typescript
import { getLineIntersection } from '@dxf-fix/shared/utils/geometry';
```

#### 3. Update contourDetection.ts imports

**OLD:**
```typescript
// Internal functions in same file
function pointsEqual(p1: Point, p2: Point): boolean { ... }
function pointKey(point: Point): string { ... }
```

**NEW:**
```typescript
import { pointsEqual, pointKey } from '@dxf-fix/shared/utils/geometry';
```

## Common Migration Patterns

### Pattern 1: Direct Function Replacement

```typescript
// BEFORE
import { GeometryUtils } from '../utils/geometryUtils';
const result = GeometryUtils.distance(p1, p2);

// AFTER
import { distance } from '@dxf-fix/shared/utils/geometry';
const result = distance(p1, p2);
```

### Pattern 2: Method to Function

```typescript
// BEFORE
const bbox = GeometryUtils.polygonArea(points);

// AFTER
import { polygonArea } from '@dxf-fix/shared/utils/geometry';
const area = polygonArea(points);
```

### Pattern 3: Private to Public

```typescript
// BEFORE (private function in file)
function distance(p1: Point, p2: Point): number { ... }

// AFTER
import { distance } from '@dxf-fix/shared/utils/geometry';
```

### Pattern 4: Signature Changes

Some functions have slightly different signatures:

```typescript
// BEFORE (backend geometry.ts)
findLineIntersection(line1: LineSegment, line2: LineSegment): Point | null

// AFTER
getLineIntersection(line1: LineSegment, line2: LineSegment): Point | null

// BEFORE (frontend trim.ts)
findLineIntersection(line1, line2): Point | null

// AFTER - same but renamed
getLineIntersection(line1, line2): Point | null
```

## Breaking Changes

### 1. Function Renames

Some functions have been renamed for clarity:

- `findLineIntersection` → `getLineIntersection`
- `calculatePolygonArea` → `polygonArea`
- `calculateBoundingBox` → `bboxFromPoints`

### 2. Module Organization

Functions are now organized by purpose:

- Distance functions → `./distance`
- Intersection functions → `./intersection`
- Polygon functions → `./polygon`
- etc.

### 3. Type Imports

Types are now imported from `@dxf-fix/shared/types`:

```typescript
// BEFORE
interface Point {
  x: number;
  y: number;
}

// AFTER
import type { Point } from '@dxf-fix/shared/types';
```

## Backward Compatibility

For gradual migration, you can create re-exports in old locations:

```typescript
// /packages/backend/src/utils/geometryUtils.ts
// Re-export everything from shared library
export * from '@dxf-fix/shared/utils/geometry';

// Keep class-based API for backward compatibility
import {
  distance,
  polygonArea,
  // etc.
} from '@dxf-fix/shared/utils/geometry';

export class GeometryUtils {
  static distance = distance;
  static polygonArea = polygonArea;
  // etc.
}
```

This allows existing code to work while you gradually migrate.

## Testing

After migration, verify:

1. **Unit tests still pass**: All calculations should produce same results
2. **Integration tests**: Verify frontend-backend communication
3. **Performance**: Shared library should be as fast or faster
4. **Type safety**: TypeScript should compile without errors

## Rollback Plan

If issues arise:

1. Keep old code in place initially
2. Use feature flags to switch between old/new
3. Monitor for issues
4. Fix issues in shared library
5. Complete migration when confident

## Getting Help

- See README.md for complete API documentation
- Check JSDoc comments in source files
- Compare old and new implementations
- Run tests to verify behavior

## Summary

The migration path is:

1. **Install/update** `@dxf-fix/shared` package
2. **Update imports** from old locations to new shared library
3. **Test thoroughly** to ensure consistent behavior
4. **Remove old code** once migration is complete
5. **Enjoy** the benefits of a single, well-tested geometry library!
