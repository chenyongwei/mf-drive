import React, { useId, useMemo } from "react";
import type { NestingPart } from "../types/NestingTypes";
import { buildPartHatchPath } from "../utils/partHatchContours";

interface SelectedPartHatchOverlayProps {
  parts: NestingPart[];
  selectedPartIds: string[];
  theme: "dark" | "light";
}

export function SelectedPartHatchOverlay({
  parts,
  selectedPartIds,
  theme,
}: SelectedPartHatchOverlayProps) {
  const patternBaseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const patternId = `selected-part-hatch-${patternBaseId}`;
  const hatchColor =
    theme === "dark" ? "rgba(255,255,255,0.42)" : "rgba(15,23,42,0.30)";

  const selectedPaths = useMemo(() => {
    if (!Array.isArray(parts) || parts.length === 0) return [];
    if (!Array.isArray(selectedPartIds) || selectedPartIds.length === 0) return [];
    const selectedSet = new Set(selectedPartIds);
    return parts
      .filter((part) => selectedSet.has(part.id))
      .map((part) => ({
        id: part.id,
        path: buildPartHatchPath(part),
      }))
      .filter((entry) => entry.path.length > 0);
  }, [parts, selectedPartIds]);

  if (selectedPaths.length === 0) {
    return null;
  }

  return (
    <>
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={8}
          height={8}
        >
          <line
            x1={0}
            y1={0}
            x2={8}
            y2={8}
            stroke={hatchColor}
            strokeWidth={1}
          />
          <line
            x1={8}
            y1={0}
            x2={0}
            y2={8}
            stroke={hatchColor}
            strokeWidth={1}
          />
        </pattern>
      </defs>
      {selectedPaths.map((entry) => (
        <path
          key={entry.id}
          d={entry.path}
          fill={`url(#${patternId})`}
          fillRule="evenodd"
          opacity={0.95}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </>
  );
}
