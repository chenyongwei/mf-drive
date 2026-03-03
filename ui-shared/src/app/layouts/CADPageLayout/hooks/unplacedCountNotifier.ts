function normalizeCount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

export function shouldNotifyAllPlaced(
  previousTotalUnplacedCount: number | null | undefined,
  nextTotalUnplacedCount: number,
): boolean {
  const previous = normalizeCount(previousTotalUnplacedCount);
  const next = normalizeCount(nextTotalUnplacedCount) ?? 0;
  return previous !== null && previous > 0 && next === 0;
}
