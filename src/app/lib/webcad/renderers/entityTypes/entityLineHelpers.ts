export function toKonvaPoints(points: Array<{ x: number; y: number }>): number[] {
  const flatPoints: number[] = [];
  points.forEach((point) => {
    flatPoints.push(point.x, -point.y);
  });
  return flatPoints;
}
