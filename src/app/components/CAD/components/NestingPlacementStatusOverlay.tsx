import React from "react";
import type { PlacementBoundaryState } from "../hooks/usePartNesting.types";

interface NestingPlacementStatusOverlayProps {
  visible: boolean;
  theme: "dark" | "light";
  boundaryState: PlacementBoundaryState;
  hasCollision?: boolean;
  hasSpacingInterference?: boolean;
  isCopyPreview?: boolean;
  copyRemainingCount?: number;
}

const STATE_META: Record<
  PlacementBoundaryState,
  { label: string; tone: "success" | "info" | "warning" | "danger" }
> = {
  inside_placeable: { label: "板内可放", tone: "success" },
  outside_plate: { label: "板外未放", tone: "info" },
  inside_forbidden_band: { label: "留边禁放", tone: "warning" },
  cross_boundary: { label: "跨边界", tone: "danger" },
};

function resolveToneColor(
  tone: "success" | "info" | "warning" | "danger",
  theme: "dark" | "light",
): { background: string; border: string; text: string } {
  const dark = theme === "dark";
  switch (tone) {
    case "success":
      return dark
        ? {
            background: "rgba(22, 163, 74, 0.18)",
            border: "rgba(74, 222, 128, 0.5)",
            text: "#86efac",
          }
        : {
            background: "rgba(22, 163, 74, 0.12)",
            border: "rgba(22, 163, 74, 0.38)",
            text: "#166534",
          };
    case "warning":
      return dark
        ? {
            background: "rgba(217, 119, 6, 0.2)",
            border: "rgba(251, 191, 36, 0.5)",
            text: "#fcd34d",
          }
        : {
            background: "rgba(217, 119, 6, 0.12)",
            border: "rgba(217, 119, 6, 0.38)",
            text: "#92400e",
          };
    case "danger":
      return dark
        ? {
            background: "rgba(220, 38, 38, 0.2)",
            border: "rgba(248, 113, 113, 0.52)",
            text: "#fca5a5",
          }
        : {
            background: "rgba(220, 38, 38, 0.1)",
            border: "rgba(220, 38, 38, 0.38)",
            text: "#991b1b",
          };
    case "info":
    default:
      return dark
        ? {
            background: "rgba(37, 99, 235, 0.18)",
            border: "rgba(96, 165, 250, 0.48)",
            text: "#93c5fd",
          }
        : {
            background: "rgba(37, 99, 235, 0.1)",
            border: "rgba(37, 99, 235, 0.35)",
            text: "#1d4ed8",
          };
  }
}

export function NestingPlacementStatusOverlay({
  visible,
  theme,
  boundaryState,
  hasCollision = false,
  hasSpacingInterference = false,
  isCopyPreview = false,
  copyRemainingCount = 0,
}: NestingPlacementStatusOverlayProps) {
  if (!visible) {
    return null;
  }

  const meta = STATE_META[boundaryState];
  const color = resolveToneColor(meta.tone, theme);
  const hints: string[] = [];
  if (hasCollision) {
    hints.push("存在碰撞");
  }
  if (hasSpacingInterference) {
    hints.push("间距不足");
  }
  const highlightCopyPreview = isCopyPreview && copyRemainingCount >= 2;
  if (highlightCopyPreview) {
    hints.push(`余量 ${copyRemainingCount}`);
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "7px 14px",
        borderRadius: 8,
        border: highlightCopyPreview
          ? `1px dashed ${theme === "dark" ? "rgba(250, 204, 21, 0.68)" : "rgba(202, 138, 4, 0.55)"}`
          : `1px solid ${color.border}`,
        background: highlightCopyPreview
          ? theme === "dark"
            ? "linear-gradient(90deg, rgba(146, 64, 14, 0.3), rgba(22, 163, 74, 0.16))"
            : "linear-gradient(90deg, rgba(251, 191, 36, 0.16), rgba(22, 163, 74, 0.12))"
          : color.background,
        color: color.text,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.02em",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 1200,
        backdropFilter: "blur(6px)",
        boxShadow:
          theme === "dark"
            ? "0 8px 18px rgba(0, 0, 0, 0.35)"
            : "0 8px 18px rgba(15, 23, 42, 0.14)",
      }}
    >
      {highlightCopyPreview && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginRight: 8,
            padding: "1px 6px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.03em",
            color: theme === "dark" ? "#fef08a" : "#854d0e",
            border:
              theme === "dark"
                ? "1px solid rgba(250, 204, 21, 0.45)"
                : "1px solid rgba(202, 138, 4, 0.42)",
            background:
              theme === "dark"
                ? "rgba(250, 204, 21, 0.16)"
                : "rgba(250, 204, 21, 0.22)",
          }}
        >
          拷贝件
        </span>
      )}
      {meta.label}
      {hints.length > 0 && (
        <span style={{ marginLeft: 8, fontWeight: 500, opacity: 0.92 }}>
          ({hints.join(" / ")})
        </span>
      )}
    </div>
  );
}
