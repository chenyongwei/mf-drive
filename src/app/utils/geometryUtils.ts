export interface Point {
    x: number;
    y: number;
}

export interface Contour {
    points: Point[];
    closed: boolean;
    centerPoint?: Point;
}

/**
 * Check if point is inside polygon (ray casting algorithm)
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        if ((((yi <= point.y) && (point.y < yj)) || ((yj <= point.y) && (point.y < yi))) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Calculate area of a polygon
 */
export function calculatePolygonArea(points: Point[]): number {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }

    return Math.abs(area / 2);
}

/**
 * Chain individual entities (LINE, ARC) into closed contours
 */
export function chainEntities(entities: any[]): Contour[] {
    const segments: { start: Point; end: Point; original: any }[] = [];

    // 1. Extract segments
    for (const e of entities) {
        const type = (e.type || '').toUpperCase();
        if (type === 'LINE') {
            if (e.geometry?.start && e.geometry?.end) {
                segments.push({ start: e.geometry.start, end: e.geometry.end, original: e });
            }
        } else if (type === 'ARC') {
            // Approximate ARC
            const g = e.geometry;
            if (g.center && g.radius && g.startAngle !== undefined && g.endAngle !== undefined) {
                // Tessellate Arc
                const segmentsCount = 16;
                let startAngle = g.startAngle;
                let endAngle = g.endAngle;
                if (endAngle < startAngle) endAngle += Math.PI * 2;

                let prev = {
                    x: g.center.x + g.radius * Math.cos(startAngle),
                    y: g.center.y + g.radius * Math.sin(startAngle)
                };

                for (let i = 1; i <= segmentsCount; i++) {
                    const angle = startAngle + (endAngle - startAngle) * (i / segmentsCount);
                    const next = {
                        x: g.center.x + g.radius * Math.cos(angle),
                        y: g.center.y + g.radius * Math.sin(angle)
                    };
                    segments.push({ start: prev, end: next, original: e });
                    prev = next;
                }
            } else if (g.start && g.end) {
                segments.push({ start: g.start, end: g.end, original: e });
            }
        } else if (type === 'POLYLINE' || type === 'LWPOLYLINE') {
            // Treat polylines as pre-chained segments if we want to mix them, 
            // OR return them directly as contours if they are closed.
            // For mixed geometry (lines + polyline segments), we should decompose them.
            // But typically critical contours are either all lines/arcs OR a single polyline.
            // For robustness, let's just use the vertices.
            if (e.geometry?.points) {
                const pts = e.geometry.points;
                for (let i = 0; i < pts.length - 1; i++) {
                    segments.push({ start: pts[i], end: pts[i + 1], original: e });
                }
                if (e.geometry.closed && pts.length > 1) {
                    segments.push({ start: pts[pts.length - 1], end: pts[0], original: e });
                }
            }
        }
    }

    if (segments.length === 0) return [];

    // 2. Build Chains (Greedy)
    const tolerance = 0.001;
    const areSame = (p1: Point, p2: Point) => Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;

    const used = new Set<number>();
    const contours: Contour[] = [];

    for (let i = 0; i < segments.length; i++) {
        if (used.has(i)) continue;

        const chain: Point[] = [segments[i].start, segments[i].end];
        used.add(i);
        let currentEnd = segments[i].end;
        let foundNext = true;

        // Grow Forward
        while (foundNext) {
            foundNext = false;
            for (let j = 0; j < segments.length; j++) {
                if (used.has(j)) continue;

                const seg = segments[j];
                if (areSame(currentEnd, seg.start)) {
                    chain.push(seg.end);
                    used.add(j);
                    currentEnd = seg.end;
                    foundNext = true;
                    break;
                } else if (areSame(currentEnd, seg.end)) {
                    // Connected but reversed
                    chain.push(seg.start);
                    used.add(j);
                    currentEnd = seg.start;
                    foundNext = true;
                    break;
                }
            }
        }

        // Attempt to grow Backward if not closed
        if (!areSame(chain[0], chain[chain.length - 1])) {
            let currentStart = chain[0];
            let foundPrev = true;
            while (foundPrev) {
                foundPrev = false;
                for (let k = 0; k < segments.length; k++) {
                    if (used.has(k)) continue;
                    const seg = segments[k];
                    if (areSame(seg.end, currentStart)) {
                        chain.unshift(seg.start);
                        used.add(k);
                        currentStart = seg.start;
                        foundPrev = true;
                        break;
                    } else if (areSame(seg.start, currentStart)) {
                        chain.unshift(seg.end);
                        used.add(k);
                        currentStart = seg.end;
                        foundPrev = true;
                        break;
                    }
                }
            }
        }

        // Check closure
        if (chain.length >= 3 && areSame(chain[0], chain[chain.length - 1])) {
            // It's closed
            // Remove duplicate end point for polygon math if desired, but pointInPolygon usually doesn't care if last == first or not,
            // but strictly speaking a polygon definition is usually unique vertices.
            // Let's pop the last one to be clean.
            chain.pop();
            if (chain.length >= 3) {
                contours.push({ points: chain, closed: true });
            }
        }
    }

    return contours;
}

/**
 * Check if a point (local coordinates) is inside the part (defined by entities)
 * Considers holes (inner contours).
 */
export function isPointInPart(x: number, y: number, entities: any[]): boolean {
    const contours: Contour[] = [];

    // 1. Gather all contours (Circles, Chained Lines/Arcs/Polylines)
    // Direct Circles (other entities handled by chainEntities)
    for (const e of entities) {
        const type = (e.type || '').toUpperCase();
        if (type === 'CIRCLE' && e.geometry?.center && e.geometry?.radius) {
            // Sample circle
            const center = e.geometry.center;
            const radius = e.geometry.radius;
            const segments = 32;
            const pts = [];
            for (let i = 0; i < segments; i++) {
                const a = (i / segments) * 2 * Math.PI;
                pts.push({ x: center.x + radius * Math.cos(a), y: center.y + radius * Math.sin(a) });
            }
            contours.push({ points: pts, closed: true });
        }
    }

    // Chained segments (handles LINE, ARC, POLYLINE, LWPOLYLINE)
    const chained = chainEntities(entities);
    contours.push(...chained);

    if (contours.length === 0) {
        // Fallback: If no closed contours found (e.g. open lines), assume BBox check (done by caller) is sufficient/correct.
        // This ensures we can still select/drag parts with poor geometry.
        return true;
    }

    // 2. Classify Outer vs Holes
    // Simple heuristic: Largest area is Outer. Everything else inside Outer is Hole.
    // Let's assume one main outer contour.

    let outerIdx = -1;
    let maxArea = -1;
    const contourAreas = contours.map(c => calculatePolygonArea(c.points));

    for (let i = 0; i < contours.length; i++) {
        if (contourAreas[i] > maxArea) {
            maxArea = contourAreas[i];
            outerIdx = i;
        }
    }

    if (outerIdx === -1) return false;

    // 3. Check Point
    const p = { x, y };

    // Must be IN Outer
    if (!pointInPolygon(p, contours[outerIdx].points)) {
        return false;
    }

    // Must NOT be IN any Hole (any other contour that contains the point)
    // Note: We assume all other contours are holes inside the outer one.
    for (let i = 0; i < contours.length; i++) {
        if (i === outerIdx) continue;
        if (pointInPolygon(p, contours[i].points)) {
            // It's in a hole!
            return false;
        }
    }

    return true;
}
