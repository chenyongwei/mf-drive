// Vivid palette for part fills.
// Excludes colors close to process stroke colors:
// white (#ffffff), cut green (#22c55e), slow-cut yellow (#facc15), mark cyan (#22d3ee).
const PANTONE_COLORS = [
  "#ef4444", "#dc2626", "#b91c1c", "#f43f5e", "#e11d48", "#be123c",
  "#ec4899", "#db2777", "#be185d", "#ff4d6d", "#ff375f", "#ff006e",
  "#f97316", "#ea580c", "#c2410c", "#ff3d00", "#ff5f1f", "#d7263d",
  "#f72585", "#b5179e", "#a21caf", "#c026d3", "#d946ef", "#9333ea",
  "#7e22ce", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#6b21a8",
  "#6366f1", "#4f46e5", "#4338ca", "#3b82f6", "#2563eb", "#1d4ed8",
  "#1e40af", "#1e3a8a", "#172554", "#312e81", "#1e1b4b", "#581c87",
  "#701a75", "#881337", "#9f1239", "#831843", "#d00000", "#9a3412",
  "#7f1d1d", "#7c2d12", "#92400e", "#78350f", "#854d0e", "#134e4a",
  "#115e59", "#0f766e", "#075985", "#0369a1", "#0b4f6c", "#5f0f40",
];

const PROCESS_STROKE_COLORS = ["#ffffff", "#22c55e", "#facc15", "#22d3ee"];
const SAFE_COLOR_DISTANCE = 96;
const DISTINCT_COLOR_DISTANCE_GOAL = 90;
const COLOR_VARIANTS = [0, 0.12, -0.1, 0.22, -0.18, 0.32, -0.26];

function normalizeHex(hexColor: string): string {
  return hexColor.trim().toLowerCase();
}

function hexToRgb(hexColor: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hexColor).replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/.test(normalized)) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function colorDistance(left: string, right: string): number {
  const leftRgb = hexToRgb(left);
  const rightRgb = hexToRgb(right);
  if (!leftRgb || !rightRgb) {
    return Number.POSITIVE_INFINITY;
  }
  const dr = leftRgb.r - rightRgb.r;
  const dg = leftRgb.g - rightRgb.g;
  const db = leftRgb.b - rightRgb.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isSafeAgainstProcessStroke(candidate: string): boolean {
  const normalized = normalizeHex(candidate);
  return PROCESS_STROKE_COLORS.every(
    (strokeColor) => colorDistance(normalized, strokeColor) >= SAFE_COLOR_DISTANCE,
  );
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function adjustColorLightness(hexColor: string, factor: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb || factor === 0) {
    return normalizeHex(hexColor);
  }

  const adjustChannel = (channel: number) => {
    if (factor >= 0) {
      return Math.round(channel + (255 - channel) * factor);
    }
    return Math.round(channel * (1 + factor));
  };

  const r = Math.max(0, Math.min(255, adjustChannel(rgb.r)));
  const g = Math.max(0, Math.min(255, adjustChannel(rgb.g)));
  const b = Math.max(0, Math.min(255, adjustChannel(rgb.b)));
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildCandidatePalette(requiredCount: number): string[] {
  const base = PANTONE_COLORS
    .map((color) => normalizeHex(color))
    .filter((color) => isSafeAgainstProcessStroke(color));
  const seen = new Set<string>();
  const candidates: string[] = [];

  base.forEach((color) => {
    if (seen.has(color)) return;
    seen.add(color);
    candidates.push(color);
  });

  if (candidates.length >= requiredCount) {
    return candidates;
  }

  for (const variant of COLOR_VARIANTS) {
    if (variant === 0) continue;
    for (const color of base) {
      const adjusted = adjustColorLightness(color, variant);
      if (seen.has(adjusted)) continue;
      if (!isSafeAgainstProcessStroke(adjusted)) continue;
      seen.add(adjusted);
      candidates.push(adjusted);
      if (candidates.length >= requiredCount) {
        return candidates;
      }
    }
  }

  return candidates;
}

function selectDistinctColors(candidates: string[], count: number): string[] {
  if (count <= 0 || candidates.length === 0) return [];
  if (count === 1) return [candidates[0]];

  const distanceToStrokeSet = (candidate: string) =>
    Math.min(...PROCESS_STROKE_COLORS.map((stroke) => colorDistance(candidate, stroke)));

  let firstIndex = 0;
  let bestStrokeDistance = -Infinity;
  for (let index = 0; index < candidates.length; index += 1) {
    const score = distanceToStrokeSet(candidates[index]);
    if (score > bestStrokeDistance) {
      bestStrokeDistance = score;
      firstIndex = index;
    }
  }

  const selectedIndices = [firstIndex];
  const selected = [candidates[firstIndex]];
  const used = new Set<number>(selectedIndices);

  while (selected.length < count && used.size < candidates.length) {
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (let index = 0; index < candidates.length; index += 1) {
      if (used.has(index)) continue;
      const candidate = candidates[index];
      const minDistanceToSelected = Math.min(
        ...selected.map((picked) => colorDistance(candidate, picked)),
      );
      const strokeDistance = distanceToStrokeSet(candidate) * 0.05;
      const score = minDistanceToSelected + strokeDistance;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    if (bestIndex < 0) break;
    used.add(bestIndex);
    selectedIndices.push(bestIndex);
    selected.push(candidates[bestIndex]);
  }

  if (selected.length >= count) {
    return selected.slice(0, count);
  }

  let cursor = 0;
  while (selected.length < count) {
    selected.push(candidates[cursor % candidates.length]);
    cursor += 1;
  }
  return selected;
}

export function buildDistinctPartTypeColorMap(typeKeys: string[]): Map<string, string> {
  const uniqueTypeKeys = Array.from(
    new Set(
      typeKeys
        .map((key) => key.trim())
        .filter((key) => key.length > 0),
    ),
  );
  uniqueTypeKeys.sort((left, right) => {
    const hashDiff = hashString(left) - hashString(right);
    return hashDiff !== 0 ? hashDiff : left.localeCompare(right);
  });
  if (uniqueTypeKeys.length === 0) {
    return new Map<string, string>();
  }

  const requiredCount = Math.max(uniqueTypeKeys.length, PANTONE_COLORS.length);
  const candidates = buildCandidatePalette(requiredCount);
  const selectedColors = selectDistinctColors(candidates, uniqueTypeKeys.length);

  const colorMap = new Map<string, string>();
  uniqueTypeKeys.forEach((typeKey, index) => {
    colorMap.set(typeKey, selectedColors[index % selectedColors.length]);
  });

  // For very high type counts where variants are needed, ensure extra separation where possible.
  if (uniqueTypeKeys.length > PANTONE_COLORS.length) {
    const keys = Array.from(colorMap.keys());
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        const leftKey = keys[i];
        const rightKey = keys[j];
        const leftColor = colorMap.get(leftKey);
        const rightColor = colorMap.get(rightKey);
        if (!leftColor || !rightColor) continue;
        if (colorDistance(leftColor, rightColor) >= DISTINCT_COLOR_DISTANCE_GOAL) continue;
        const alternative = candidates.find((candidate) => {
          if (candidate === rightColor) return false;
          return Array.from(colorMap.entries())
            .filter(([key]) => key !== rightKey)
            .every(([, existing]) => colorDistance(candidate, existing) >= DISTINCT_COLOR_DISTANCE_GOAL);
        });
        if (alternative) {
          colorMap.set(rightKey, alternative);
        }
      }
    }
  }

  return colorMap;
}

export function getRandomPantoneColor(partId: string): string {
  if (!partId) return PANTONE_COLORS[0];

  const hash = hashString(partId);

  const colorIndex = Math.abs(hash) % PANTONE_COLORS.length;
  for (let offset = 0; offset < PANTONE_COLORS.length; offset += 1) {
    const candidate = PANTONE_COLORS[(colorIndex + offset) % PANTONE_COLORS.length];
    if (isSafeAgainstProcessStroke(candidate)) {
      return candidate;
    }
  }
  return PANTONE_COLORS[colorIndex];
}

export function getStyles(theme: "dark" | "light") {
  return {
    container: {
      display: "flex",
      flexDirection: "column" as const,
      height: "100vh",
      width: "100%",
      backgroundColor: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
      color: theme === "dark" ? "#ffffff" : "#333333",
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      padding: "8px 16px",
      backgroundColor: theme === "dark" ? "#2a2a2a" : "#e0e0e0",
      borderBottom: theme === "dark" ? "1px solid #3a3a3a" : "1px solid #cccccc",
      gap: "12px",
      color: theme === "dark" ? "#ffffff" : "#333333",
    },
    mainContent: {
      display: "flex",
      flex: 1,
      overflow: "hidden",
    },
    leftPanel: {
      width: "280px",
      backgroundColor: theme === "dark" ? "#252525" : "#eaeaea",
      borderRight: theme === "dark" ? "1px solid #3a3a3a" : "1px solid #cccccc",
      overflow: "auto",
      color: theme === "dark" ? "#ffffff" : "#333333",
    },
    canvas: {
      flex: 1,
      position: "relative" as const,
      overflow: "hidden",
    },
    rightPanel: {
      width: "320px",
      backgroundColor: theme === "dark" ? "#252525" : "#eaeaea",
      borderLeft: theme === "dark" ? "1px solid #3a3a3a" : "1px solid #cccccc",
      overflow: "auto",
      color: theme === "dark" ? "#ffffff" : "#333333",
    },
    button: {
      padding: "8px 16px",
      backgroundColor: theme === "dark" ? "#3a3a3a" : "#ffffff",
      border: theme === "dark" ? "1px solid #4a4a4a" : "1px solid #bbbbbb",
      borderRadius: "4px",
      color: theme === "dark" ? "#ffffff" : "#333333",
      cursor: "pointer",
      fontSize: "14px",
    },
    buttonHover: {
      backgroundColor: theme === "dark" ? "#4a4a4a" : "#f0f0f0",
    },
  };
}
