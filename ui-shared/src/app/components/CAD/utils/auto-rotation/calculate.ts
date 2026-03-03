import type { AutoRotateResult, EdgeSegment, PartForRotation } from './types';

import {
  getInsideSegments,
  getPartPolygon,
  getSmallestRotationDelta,
  normalizeAngle,
} from './geometry';

export function calculateAutoRotation(
  draggedPart: PartForRotation,
  targetPart: PartForRotation,
  minIntersectionLength: number = 10
): AutoRotateResult {
  const polyA = getPartPolygon(draggedPart);
  const polyB = getPartPolygon(targetPart);

  const edgesA = getInsideSegments(polyA, polyB);
  const edgesB = getInsideSegments(polyB, polyA);
  const allEdges = [...edgesA, ...edgesB];

  if (allEdges.length === 0) {
    return { shouldRotate: false, suggestedAngle: draggedPart.rotation };
  }

  allEdges.sort((a, b) => b.length - a.length);
  const longestEdge = allEdges[0];

  if (longestEdge.length < minIntersectionLength) {
    return { shouldRotate: false, suggestedAngle: draggedPart.rotation };
  }

  const targetAngle = longestEdge.angle;
  const candidates = [
    targetAngle,
    normalizeAngle(targetAngle + 90),
    normalizeAngle(targetAngle + 180),
    normalizeAngle(targetAngle + 270),
  ];

  let bestAngle = draggedPart.rotation;
  let minDiff = Infinity;

  for (const candidate of candidates) {
    const diff = Math.abs(
      getSmallestRotationDelta(draggedPart.rotation, candidate)
    );
    if (diff < minDiff) {
      minDiff = diff;
      bestAngle = candidate;
    }
  }

  const rotationDelta = getSmallestRotationDelta(draggedPart.rotation, bestAngle);

  if (Math.abs(rotationDelta) < 1.0) {
    return { shouldRotate: false, suggestedAngle: draggedPart.rotation };
  }

  return {
    shouldRotate: true,
    suggestedAngle: bestAngle,
    rotationDelta,
    matchedEdgeAngle: targetAngle,
  };
}

export function findBestAutoRotation(
  draggedPart: PartForRotation,
  otherParts: PartForRotation[]
): AutoRotateResult {
  const polyA = getPartPolygon(draggedPart);
  const allEdges: EdgeSegment[] = [];

  for (const target of otherParts) {
    if (target.id === draggedPart.id) continue;

    const polyB = getPartPolygon(target);
    const edgesA = getInsideSegments(polyA, polyB);
    const edgesB = getInsideSegments(polyB, polyA);
    allEdges.push(...edgesA, ...edgesB);
  }

  if (allEdges.length === 0) {
    return { shouldRotate: false, suggestedAngle: draggedPart.rotation };
  }

  allEdges.sort((a, b) => b.length - a.length);
  const longestEdge = allEdges[0];

  if (longestEdge.length < 0.1) {
    return { shouldRotate: false, suggestedAngle: draggedPart.rotation };
  }

  const targetAngle = longestEdge.angle;
  const candidates = [
    targetAngle,
    normalizeAngle(targetAngle + 90),
    normalizeAngle(targetAngle + 180),
    normalizeAngle(targetAngle + 270),
  ];

  let bestAngle = draggedPart.rotation;
  let minDiff = Infinity;

  for (const candidate of candidates) {
    const diff = Math.abs(
      getSmallestRotationDelta(draggedPart.rotation, candidate)
    );
    if (diff < minDiff) {
      minDiff = diff;
      bestAngle = candidate;
    }
  }

  const rotationDelta = getSmallestRotationDelta(draggedPart.rotation, bestAngle);

  if (Math.abs(rotationDelta) < 1.0) {
    return { shouldRotate: false, suggestedAngle: draggedPart.rotation };
  }

  return {
    shouldRotate: true,
    suggestedAngle: bestAngle,
    rotationDelta,
    matchedEdgeAngle: targetAngle,
  };
}
