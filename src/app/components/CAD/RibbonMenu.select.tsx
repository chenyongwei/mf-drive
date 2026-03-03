import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TFunction } from "i18next";
import { SelectIcon } from "./RibbonMenu.icons";
import type { SelectItem } from "./RibbonMenu.data";
import type { OpenRibbonMenu, SelectAction } from "./RibbonMenu.types";
import { getStyles } from "./RibbonMenu.styles";

interface SelectSectionProps {
  openMenu: OpenRibbonMenu;
  hoveredItem: string | null;
  setOpenMenu: Dispatch<SetStateAction<OpenRibbonMenu>>;
  setHoveredItem: Dispatch<SetStateAction<string | null>>;
  ribbonStyles: ReturnType<typeof getStyles>;
  theme: "dark" | "light";
  items: SelectItem[];
  t: TFunction;
  onSelectAction?: (action: SelectAction) => void;
}

export const RibbonMenuSelectSection: React.FC<SelectSectionProps> = ({
  openMenu,
  hoveredItem,
  setOpenMenu,
  setHoveredItem,
  ribbonStyles,
  theme,
  items,
  t,
  onSelectAction,
}) => {
  const handleSelectClick = (action: SelectAction) => {
    onSelectAction?.(action);
    setOpenMenu(null);
  };

  return (
    <>
      <div style={ribbonStyles.menuGroup}>
        <button
          style={{
            ...ribbonStyles.menuButton,
            ...(openMenu === "select"
              ? ribbonStyles.menuButtonActive
              : hoveredItem === "menu-select"
                ? ribbonStyles.menuButtonHover
                : {}),
          }}
          onClick={(event) => {
            event.stopPropagation();
            setOpenMenu(openMenu === "select" ? null : "select");
          }}
          onMouseEnter={() => setHoveredItem("menu-select")}
          onMouseLeave={() => setHoveredItem(null)}
          data-menu="select"
        >
          <div style={ribbonStyles.menuIcon}>
            <SelectIcon stroke={theme === "dark" ? "#eee" : "#333"} />
          </div>
          <div style={ribbonStyles.menuLabel}>
            {t("ribbon.select")} <span style={{ fontSize: "8px" }}>▼</span>
          </div>
        </button>

        {openMenu === "select" && (
          <div style={ribbonStyles.dropdown} data-dropdown="select">
            {items.map((item, idx) => (
              <React.Fragment key={item.id}>
                {(idx === 3 || idx === 4) && <div style={ribbonStyles.separator} />}
                <button
                  style={{
                    ...ribbonStyles.dropdownItem,
                    ...(hoveredItem === item.id ? ribbonStyles.dropdownItemHover : {}),
                  }}
                  onClick={() => handleSelectClick(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span style={ribbonStyles.dropdownItemIcon}>{item.icon || ""}</span>
                  <span style={ribbonStyles.dropdownItemLabel}>{item.label}</span>
                  {item.shortcut && (
                    <span style={ribbonStyles.dropdownItemShortcut}>{item.shortcut}</span>
                  )}
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
