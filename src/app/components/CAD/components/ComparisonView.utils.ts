export function getDifferences(leftOperations: any[], rightOperations: any[]) {
  const leftOpIds = new Set(leftOperations.map((op) => op.id));
  const rightOpIds = new Set(rightOperations.map((op) => op.id));

  const addedOps = rightOperations.filter((op) => !leftOpIds.has(op.id));
  const removedOps = leftOperations.filter((op) => !rightOpIds.has(op.id));

  return { addedOps, removedOps };
}
