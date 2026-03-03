import { BoundingBox } from "../types/BoundingBox";
import { EXPANSION } from "../../../constants/layoutConstants";

export const OWNERSHIP_TARGET_NEW_FILE = "__new_file__";

export interface OwnershipCandidate {
  fileId: string;
  fileName: string;
  bounds: BoundingBox;
}

interface FileDescriptor {
  id: string;
  name: string;
  type: "DXF" | "PRTS";
}

interface FileLayoutDescriptor {
  fileId: string;
  offsetX: number;
  offsetY: number;
  boundingBox: BoundingBox;
}

export type EntityOwnershipResolution =
  | { kind: "existing"; targetFileId: string; candidates: OwnershipCandidate[] }
  | { kind: "choose"; candidates: OwnershipCandidate[] }
  | { kind: "new-file"; candidates: OwnershipCandidate[] };

export type OwnershipDialogSelection =
  | { kind: "existing"; targetFileId: string }
  | { kind: "new-file" };

interface ResolveEntityOwnershipInput {
  entityBBox: BoundingBox;
  fileLayouts: FileLayoutDescriptor[];
  files: FileDescriptor[];
  framePaddingMm?: number;
}

function intersects(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

function toFrameBounds(
  fileLayout: FileLayoutDescriptor,
  framePaddingMm: number,
): BoundingBox {
  return {
    minX: fileLayout.boundingBox.minX + fileLayout.offsetX - framePaddingMm,
    minY: fileLayout.boundingBox.minY + fileLayout.offsetY - framePaddingMm,
    maxX: fileLayout.boundingBox.maxX + fileLayout.offsetX + framePaddingMm,
    maxY: fileLayout.boundingBox.maxY + fileLayout.offsetY + framePaddingMm,
  };
}

export function resolveEntityOwnership(
  input: ResolveEntityOwnershipInput,
): EntityOwnershipResolution {
  const framePaddingMm = input.framePaddingMm ?? EXPANSION;
  const fileById = new Map(input.files.map((file) => [file.id, file]));

  const candidates: OwnershipCandidate[] = input.fileLayouts
    .map((layout) => {
      const file = fileById.get(layout.fileId);
      if (!file || file.type !== "DXF") {
        return null;
      }

      const bounds = toFrameBounds(layout, framePaddingMm);
      if (!intersects(input.entityBBox, bounds)) {
        return null;
      }

      return {
        fileId: file.id,
        fileName: file.name,
        bounds,
      };
    })
    .filter((candidate): candidate is OwnershipCandidate => candidate !== null);

  if (candidates.length === 0) {
    return { kind: "new-file", candidates: [] };
  }
  if (candidates.length === 1) {
    return {
      kind: "existing",
      targetFileId: candidates[0].fileId,
      candidates,
    };
  }
  return { kind: "choose", candidates };
}

export function resolveOwnershipDialogSelection(
  targetId: string | null,
): OwnershipDialogSelection | null {
  if (!targetId) {
    return null;
  }
  if (targetId === OWNERSHIP_TARGET_NEW_FILE) {
    return { kind: "new-file" };
  }
  return { kind: "existing", targetFileId: targetId };
}

