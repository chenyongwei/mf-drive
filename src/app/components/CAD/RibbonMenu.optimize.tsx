import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TFunction } from "i18next";
import { OptimizeIcon } from "./RibbonMenu.icons";
import type { OpenRibbonMenu, OptimizeAction, RibbonItem } from "./RibbonMenu.types";
import type { InspectionResult } from "@dxf-fix/shared/types/inspection";
import { getStyles } from "./RibbonMenu.styles";

interface OptimizeSectionProps {
  openMenu: OpenRibbonMenu;
  hoveredItem: string | null;
  setOpenMenu: Dispatch<SetStateAction<OpenRibbonMenu>>;
  setHoveredItem: Dispatch<SetStateAction<string | null>>;
  ribbonStyles: ReturnType<typeof getStyles>;
  theme: "dark" | "light";
  items: Array<RibbonItem<OptimizeAction>>;
  inspectionResult?: InspectionResult | null;
  t: TFunction;
  onOptimizeAction?: (action: OptimizeAction) => void;
  onRunInspection?: () => void;
  onFixAll?: () => void;
}

export const RibbonMenuOptimizeSection: React.FC<OptimizeSectionProps> = ({
  openMenu,
  hoveredItem,
  setOpenMenu,
  setHoveredItem,
  ribbonStyles,
  theme,
  items,
  inspectionResult,
  t,
  onOptimizeAction,
  onRunInspection,
  onFixAll,
}) => {
  const handleOptimizeClick = (action: OptimizeAction) => {
    onOptimizeAction?.(action);
    setOpenMenu(null);
  };

  return (
    <>
      <div style={ribbonStyles.menuGroup}>
        <button
          style={{
            ...ribbonStyles.menuButton,
            ...(openMenu === "optimize"
              ? ribbonStyles.menuButtonActive
              : hoveredItem === "menu-optimize"
                ? ribbonStyles.menuButtonHover
                : {}),
          }}
          onClick={(event) => {
            event.stopPropagation();
            setOpenMenu(openMenu === "optimize" ? null : "optimize");
          }}
          onMouseEnter={() => setHoveredItem("menu-optimize")}
          onMouseLeave={() => setHoveredItem(null)}
          data-menu="optimize"
        >
          <div style={ribbonStyles.menuIcon}>
            <OptimizeIcon stroke={theme === "dark" ? "#eee" : "#333"} />
          </div>
          <div style={ribbonStyles.menuLabel}>
            {t("ribbon.optimize")} <span style={{ fontSize: "8px" }}>▼</span>
          </div>
        </button>

        {openMenu === "optimize" && (
          <div style={ribbonStyles.dropdown} data-dropdown="optimize">
            {!inspectionResult && (
              <>
                <button
                  style={{
                    ...ribbonStyles.dropdownItem,
                    backgroundColor: theme === "dark" ? "#3a3a3a" : "#f0f7ff",
                    borderBottom:
                      theme === "dark" ? "1px solid #4a4a4a" : "1px solid #e0e0e0",
                    ...(hoveredItem === "smart-inspect"
                      ? ribbonStyles.dropdownItemHover
                      : {}),
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRunInspection?.();
                    setOpenMenu(null);
                  }}
                  onMouseEnter={() => setHoveredItem("smart-inspect")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span style={ribbonStyles.dropdownItemIcon}>🔍</span>
                  <span
                    style={{
                      ...ribbonStyles.dropdownItemLabel,
                      fontWeight: "bold",
                      color: "#4a9eff",
                    }}
                  >
                    {t("optimize.smartInspect")}
                  </span>
                </button>
                <div style={ribbonStyles.separator} />
              </>
            )}

            {inspectionResult && inspectionResult.issues.length > 0 && (
              <>
                <div
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(255, 193, 7, 0.1)"
                        : "rgba(255, 193, 7, 0.05)",
                    borderLeft: "4px solid #FFC107",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color: theme === "dark" ? "#FFC107" : "#d97706",
                      marginBottom: "2px",
                    }}
                  >
                    {t("optimize.issuesFound", { count: inspectionResult.issues.length })}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: theme === "dark" ? "#aaa" : "#666",
                    }}
                  >
                    {t("optimize.severityError")}: {inspectionResult.summary.error} | {" "}
                    {t("optimize.severityWarning")}: {inspectionResult.summary.warning}
                  </div>
                  <button
                    style={{
                      marginTop: "6px",
                      padding: "4px 12px",
                      backgroundColor: "#FFC107",
                      color: "#000",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      width: "100%",
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onFixAll?.();
                      setOpenMenu(null);
                    }}
                  >
                    ✨ {t("optimize.fixAll")}
                  </button>
                </div>
                <div style={ribbonStyles.separator} />
              </>
            )}

            {items.map((item, idx) => {
              const isHighlighted = Boolean(
                inspectionResult &&
                  ((item.id === "remove-duplicates" && inspectionResult.summary.error > 0) ||
                    (item.id === "merge-connected" && inspectionResult.summary.warning > 0)),
              );

              return (
                <React.Fragment key={item.id}>
                  {idx === 2 && <div style={ribbonStyles.separator} />}
                  <button
                    style={{
                      ...ribbonStyles.dropdownItem,
                      ...(hoveredItem === item.id ? ribbonStyles.dropdownItemHover : {}),
                      ...(isHighlighted
                        ? {
                            backgroundColor:
                              theme === "dark"
                                ? "rgba(74, 158, 255, 0.1)"
                                : "rgba(74, 158, 255, 0.05)",
                          }
                        : {}),
                    }}
                    onClick={() => handleOptimizeClick(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span style={ribbonStyles.dropdownItemIcon}>{item.icon || ""}</span>
                    <span
                      style={{
                        ...ribbonStyles.dropdownItemLabel,
                        ...(isHighlighted
                          ? { fontWeight: "bold", color: "#4a9eff" }
                          : {}),
                      }}
                    >
                      {item.label}
                      {isHighlighted && (
                        <span style={{ fontSize: "10px", marginLeft: "4px" }}>
                          ⭐ {t("optimize.recommended")}
                        </span>
                      )}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
      <div style={ribbonStyles.divider} />
    </>
  );
};
