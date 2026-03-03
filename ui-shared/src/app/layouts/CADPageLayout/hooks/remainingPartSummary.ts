import type { RemainingPartSummaryItem } from "../../../components/CAD/types/CADCanvasTypes";
import type { NestingLayoutViewMode, NestingPart } from "../../../components/CAD/types/NestingTypes";
import type { FileData } from "../CADPageLayout.file-utils";

const COPY_SUFFIX_PATTERN = /__copy-\d+$/i;

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveNestingPartSourceId(part: NestingPart): string | null {
  const explicitSource = toNonEmptyString(part.sourcePartId);
  if (explicitSource) return explicitSource;

  const partId = toNonEmptyString(part.id);
  if (!partId) return null;
  return partId.replace(COPY_SUFFIX_PATTERN, "");
}

export function isNestingPartPlaced(part: Pick<NestingPart, "plateId">): boolean {
  if (typeof part.plateId === "string") {
    return part.plateId.trim().length > 0;
  }
  return Boolean(part.plateId);
}

interface BuildRemainingPartSummaryArgs {
  files: FileData[];
  checkedFileIds: Set<string>;
  nestingParts: NestingPart[];
  isNestingMode: boolean;
  layoutViewMode: NestingLayoutViewMode;
}

export function buildRemainingPartSummary({
  files,
  checkedFileIds,
  nestingParts,
  isNestingMode,
  layoutViewMode,
}: BuildRemainingPartSummaryArgs): RemainingPartSummaryItem[] {
  if (!isNestingMode || layoutViewMode !== "multi") {
    return [];
  }

  const checkedSourceMeta = new Map<string, { fileId: string; name: string }>();
  files.forEach((file) => {
    if (file.type !== "PRTS") return;
    if (!checkedFileIds.has(file.id)) return;
    const sourcePartId = toNonEmptyString(file.partId || file.id);
    if (!sourcePartId) return;
    if (checkedSourceMeta.has(sourcePartId)) return;
    checkedSourceMeta.set(sourcePartId, {
      fileId: file.id,
      name: toNonEmptyString(file.name) ?? sourcePartId,
    });
  });

  if (checkedSourceMeta.size === 0) {
    return [];
  }

  const grouped = new Map<string, RemainingPartSummaryItem>();
  nestingParts.forEach((part) => {
    const sourcePartId = resolveNestingPartSourceId(part);
    if (!sourcePartId) return;

    const checkedMeta = checkedSourceMeta.get(sourcePartId);
    if (!checkedMeta) return;

    const current = grouped.get(sourcePartId);
    if (current) {
      current.total += 1;
      if (isNestingPartPlaced(part)) current.placed += 1;
      else current.unplaced += 1;
      return;
    }

    grouped.set(sourcePartId, {
      sourcePartId,
      fileId: checkedMeta.fileId,
      name: checkedMeta.name,
      total: 1,
      placed: isNestingPartPlaced(part) ? 1 : 0,
      unplaced: isNestingPartPlaced(part) ? 0 : 1,
    });
  });

  return Array.from(grouped.values())
    .filter((item) => item.unplaced > 0)
    .sort((left, right) => {
      const byName = left.name.localeCompare(right.name, "zh-Hans-CN", { sensitivity: "base" });
      if (byName !== 0) return byName;
      return left.sourcePartId.localeCompare(right.sourcePartId);
    });
}
