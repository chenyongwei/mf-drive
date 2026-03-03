import type { NestingPart } from "../../../components/CAD/types/NestingTypes";

export function buildFileToPartIds(parts: NestingPart[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  parts.forEach((part) => {
    const fileId = String(part.fileId ?? "").trim();
    if (!fileId) return;
    const bucket = map.get(fileId);
    if (bucket) {
      bucket.push(part.id);
      return;
    }
    map.set(fileId, [part.id]);
  });
  return map;
}

export function buildPartToFileId(parts: NestingPart[]): Map<string, string> {
  const map = new Map<string, string>();
  parts.forEach((part) => {
    const fileId = String(part.fileId ?? "").trim();
    if (!fileId) return;
    map.set(part.id, fileId);
  });
  return map;
}

export function mapFileSelectionToPartIds(
  selectedFileIds: Set<string>,
  fileToPartIds: Map<string, string[]>,
): string[] {
  const selectedPartIds: string[] = [];
  selectedFileIds.forEach((fileId) => {
    const ids = fileToPartIds.get(fileId);
    if (!ids || ids.length === 0) return;
    selectedPartIds.push(...ids);
  });
  return selectedPartIds;
}

export function mapPartSelectionToFileIds(
  selectedPartIds: string[],
  partToFileId: Map<string, string>,
): Set<string> {
  const selectedFileIds = new Set<string>();
  selectedPartIds.forEach((partId) => {
    const fileId = partToFileId.get(partId);
    if (fileId) selectedFileIds.add(fileId);
  });
  return selectedFileIds;
}

export function toggleListFileSelection(
  prev: Set<string>,
  fileId: string,
  additive: boolean,
): Set<string> {
  if (!additive) {
    return new Set([fileId]);
  }

  const next = new Set(prev);
  if (next.has(fileId)) next.delete(fileId);
  else next.add(fileId);
  return next;
}

export function areSetsEqual<T>(left: Set<T>, right: Set<T>): boolean {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

export function areStringArraysEqualAsSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  for (const value of left) {
    if (!rightSet.has(value)) return false;
  }
  return true;
}

export function firstSelectedFileId(selectedFileIds: Set<string>): string | null {
  const first = selectedFileIds.values().next();
  return first.done ? null : first.value;
}
