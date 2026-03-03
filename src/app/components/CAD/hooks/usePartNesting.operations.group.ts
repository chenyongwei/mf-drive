import type { NestingPart, Plate } from "../types/NestingTypes";

interface GroupCommonArgs {
  parts: NestingPart[];
  selectedPartIds: string[];
  updateParts: (updatedParts: NestingPart[]) => void;
  findPlateForPart: (part: NestingPart, position: { x: number; y: number }) => Plate | null;
}

interface MoveSelectedArgs extends GroupCommonArgs {
  offsetX: number;
  offsetY: number;
  checkCollision: (
    partId: string,
    newPosition: { x: number; y: number },
    rotation: number,
    useSimplified: boolean,
  ) => boolean;
}

export function moveSelectedPartsAction({
  offsetX,
  offsetY,
  parts,
  selectedPartIds,
  checkCollision,
  findPlateForPart,
  updateParts,
}: MoveSelectedArgs): boolean {
  if (selectedPartIds.length === 0) return false;

  const partsToMove = parts.filter((p) => selectedPartIds.includes(p.id));
  if (partsToMove.length === 0) return false;

  const hasCollision = selectedPartIds.some((partId) => {
    const part = parts.find((p) => p.id === partId);
    if (!part) return false;

    const newPosition = {
      x: part.position.x + offsetX,
      y: part.position.y + offsetY,
    };

    return checkCollision(partId, newPosition, part.rotation, false);
  });

  if (hasCollision) return false;

  updateParts(
    parts.map((p) => {
      if (selectedPartIds.includes(p.id)) {
        const newPosition = {
          x: p.position.x + offsetX,
          y: p.position.y + offsetY,
        };
        const targetPlate = findPlateForPart(p, newPosition);

        return {
          ...p,
          position: newPosition,
          plateId: targetPlate ? targetPlate.id : null,
          status: targetPlate ? "placed" : "unplaced",
        };
      }
      return p;
    }),
  );

  return true;
}

interface RotateSelectedArgs extends GroupCommonArgs {
  angle: number;
  checkCollision: (
    partId: string,
    newPosition: { x: number; y: number },
    rotation: number,
    useSimplified: boolean,
  ) => boolean;
}

export function rotateSelectedPartsAction({
  angle,
  parts,
  selectedPartIds,
  checkCollision,
  findPlateForPart,
  updateParts,
}: RotateSelectedArgs): void {
  if (selectedPartIds.length === 0) return;

  const partsToRotate = parts.filter((p) => selectedPartIds.includes(p.id));
  if (partsToRotate.length === 0) return;

  let sumX = 0;
  let sumY = 0;
  for (const part of partsToRotate) {
    const bbox = part.boundingBox;
    sumX += part.position.x + (bbox.minX + bbox.maxX) / 2;
    sumY += part.position.y + (bbox.minY + bbox.maxY) / 2;
  }

  const centroid = {
    x: sumX / partsToRotate.length,
    y: sumY / partsToRotate.length,
  };

  const hasCollision = selectedPartIds.some((partId) => {
    const part = parts.find((p) => p.id === partId);
    if (!part) return false;
    const newRotation = (part.rotation + angle) % 360;
    return checkCollision(partId, part.position, newRotation, false);
  });

  if (hasCollision) return;

  const angleRad = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  updateParts(
    parts.map((p) => {
      if (!selectedPartIds.includes(p.id)) return p;

      const bbox = p.boundingBox;
      const centerX = p.position.x + (bbox.minX + bbox.maxX) / 2;
      const centerY = p.position.y + (bbox.minY + bbox.maxY) / 2;
      const dx = centerX - centroid.x;
      const dy = centerY - centroid.y;
      const newDx = dx * cos - dy * sin;
      const newDy = dx * sin + dy * cos;

      const newPosition = {
        x: centroid.x + newDx - (bbox.minX + bbox.maxX) / 2,
        y: centroid.y + newDy - (bbox.minY + bbox.maxY) / 2,
      };

      const targetPlate = findPlateForPart(p, newPosition);
      return {
        ...p,
        position: newPosition,
        rotation: (p.rotation + angle) % 360,
        plateId: targetPlate ? targetPlate.id : null,
        status: targetPlate ? "placed" : "unplaced",
      };
    }),
  );
}

interface MirrorSelectedArgs {
  direction: "horizontal" | "vertical";
  parts: NestingPart[];
  selectedPartIds: string[];
  updateParts: (updatedParts: NestingPart[]) => void;
}

export function mirrorSelectedPartsAction({
  direction,
  parts,
  selectedPartIds,
  updateParts,
}: MirrorSelectedArgs): void {
  if (selectedPartIds.length === 0) return;

  updateParts(
    parts.map((p) =>
      selectedPartIds.includes(p.id)
        ? {
            ...p,
            mirroredX: direction === "horizontal" ? !p.mirroredX : p.mirroredX,
            mirroredY: direction === "vertical" ? !p.mirroredY : p.mirroredY,
          }
        : p,
    ),
  );
}

export function getUtilizationValue(parts: NestingPart[], plates: Plate[]): number {
  if (plates.length === 0) return 0;

  const totalPlateArea = plates.reduce((sum, plate) => sum + plate.width * plate.height, 0);
  if (totalPlateArea === 0) return 0;

  const partsArea = parts
    .filter((p) => p.status === "placed")
    .reduce((sum, part) => {
      const w = part.boundingBox.maxX - part.boundingBox.minX;
      const h = part.boundingBox.maxY - part.boundingBox.minY;
      return sum + w * h;
    }, 0);

  return (partsArea / totalPlateArea) * 100;
}
