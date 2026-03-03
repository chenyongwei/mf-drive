import React from "react";
import type { TFunction } from "i18next";
import { getStyles } from "./RibbonMenu.styles";

interface NestingSectionProps {
  onNestingModeToggle?: () => void;
  isNestingMode: boolean;
  partSpacing: number;
  onPartSpacingChange?: (value: number) => void;
  stickToEdge: boolean;
  onStickToEdgeChange?: (value: boolean) => void;
  hoveredItem: string | null;
  setHoveredItem: (value: string | null) => void;
  theme: "dark" | "light";
  ribbonStyles: ReturnType<typeof getStyles>;
  t: TFunction;
}

export const RibbonMenuNestingSection: React.FC<NestingSectionProps> = ({
  onNestingModeToggle,
  isNestingMode,
  partSpacing,
  onPartSpacingChange,
  stickToEdge,
  onStickToEdgeChange,
  hoveredItem,
  setHoveredItem,
  theme,
  ribbonStyles,
  t,
}) => {
  if (!onNestingModeToggle) {
    return null;
  }

  return (
    <div style={ribbonStyles.smallMenuButtonGroup}>
      {isNestingMode && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              height: "36px",
              fontSize: "11px",
              color: theme === "dark" ? "#aaa" : "#666",
            }}
            title={t("ribbon.partSpacingTooltip") || "零件间距"}
          >
            <span>{t("ribbon.spacing")}</span>
            <input
              type="number"
              value={partSpacing}
              onChange={(event) => onPartSpacingChange?.(Number(event.target.value))}
              min={0}
              max={50}
              step={0.1}
              style={{
                width: "40px",
                height: "24px",
                padding: "2px 4px",
                fontSize: "11px",
                textAlign: "center",
                border: theme === "dark" ? "1px solid #4a4a4a" : "1px solid #ccc",
                borderRadius: "3px",
                backgroundColor: theme === "dark" ? "#2a2a2a" : "#fff",
                color: theme === "dark" ? "#eee" : "#333",
                outline: "none",
              }}
            />
            <span style={{ fontSize: "10px", color: theme === "dark" ? "#888" : "#999" }}>
              mm
            </span>
          </div>

          <button
            style={{
              ...ribbonStyles.smallMenuButton,
              width: "100px",
              ...(stickToEdge
                ? {
                    backgroundColor: theme === "dark" ? "#2e7d32" : "#e8f5e9",
                    borderColor: theme === "dark" ? "#388e3c" : "#81c784",
                  }
                : hoveredItem === "btn-stick-edge"
                  ? ribbonStyles.menuButtonHover
                  : {}),
            }}
            onClick={() => onStickToEdgeChange?.(!stickToEdge)}
            onMouseEnter={() => setHoveredItem("btn-stick-edge")}
            onMouseLeave={() => setHoveredItem(null)}
            title="零件可以吸附板材边缘"
          >
            <span style={{ fontSize: "14px" }}>🧲</span>
            <span>贴边</span>
          </button>
        </>
      )}
    </div>
  );
};
