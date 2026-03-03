import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TFunction } from "i18next";
import { DimensionIcon } from "./RibbonMenu.icons";
import type { OpenRibbonMenu, DimensionAction, RibbonItem } from "./RibbonMenu.types";
import { getStyles } from "./RibbonMenu.styles";

interface DimensionSectionProps {
  openMenu: OpenRibbonMenu;
  hoveredItem: string | null;
  setOpenMenu: Dispatch<SetStateAction<OpenRibbonMenu>>;
  setHoveredItem: Dispatch<SetStateAction<string | null>>;
  ribbonStyles: ReturnType<typeof getStyles>;
  theme: "dark" | "light";
  items: Array<RibbonItem<DimensionAction>>;
  t: TFunction;
  onDimensionAction?: (action: DimensionAction) => void;
}

export const RibbonMenuDimensionSection: React.FC<DimensionSectionProps> = ({
  openMenu,
  hoveredItem,
  setOpenMenu,
  setHoveredItem,
  ribbonStyles,
  theme,
  items,
  t,
  onDimensionAction,
}) => {
  const handleDimensionClick = (action: DimensionAction) => {
    onDimensionAction?.(action);
    setOpenMenu(null);
  };

  return (
    <>
      <div style={ribbonStyles.menuGroup}>
        <button
          style={{
            ...ribbonStyles.menuButton,
            ...(openMenu === "dimension"
              ? ribbonStyles.menuButtonActive
              : hoveredItem === "menu-dimension"
                ? ribbonStyles.menuButtonHover
                : {}),
          }}
          onClick={(event) => {
            event.stopPropagation();
            setOpenMenu(openMenu === "dimension" ? null : "dimension");
          }}
          onMouseEnter={() => setHoveredItem("menu-dimension")}
          onMouseLeave={() => setHoveredItem(null)}
          data-menu="dimension"
        >
          <div style={ribbonStyles.menuIcon}>
            <DimensionIcon stroke={theme === "dark" ? "#eee" : "#333"} />
          </div>
          <div style={ribbonStyles.menuLabel}>
            {t("ribbon.dimension")} <span style={{ fontSize: "8px" }}>▼</span>
          </div>
        </button>

        {openMenu === "dimension" && (
          <div style={ribbonStyles.dropdown} data-dropdown="dimension">
            {items.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx === 7 && <div style={ribbonStyles.separator} />}
                <button
                  style={{
                    ...ribbonStyles.dropdownItem,
                    ...(hoveredItem === item.id ? ribbonStyles.dropdownItemHover : {}),
                  }}
                  onClick={() => handleDimensionClick(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span style={ribbonStyles.dropdownItemIcon}>{item.icon || ""}</span>
                  <span style={ribbonStyles.dropdownItemLabel}>{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      <div style={ribbonStyles.divider} />
    </>
  );
};
