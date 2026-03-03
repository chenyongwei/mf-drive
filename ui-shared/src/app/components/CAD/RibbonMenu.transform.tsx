import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TFunction } from "i18next";
import { TransformIcon } from "./RibbonMenu.icons";
import type { OpenRibbonMenu, TransformAction } from "./RibbonMenu.types";
import type { TransformItem } from "./RibbonMenu.data";
import { getStyles } from "./RibbonMenu.styles";

interface TransformSectionProps {
  openMenu: OpenRibbonMenu;
  hoveredItem: string | null;
  activeSubmenu: string | null;
  hasSelection: boolean;
  setOpenMenu: Dispatch<SetStateAction<OpenRibbonMenu>>;
  setHoveredItem: Dispatch<SetStateAction<string | null>>;
  setActiveSubmenu: Dispatch<SetStateAction<string | null>>;
  ribbonStyles: ReturnType<typeof getStyles>;
  theme: "dark" | "light";
  items: TransformItem[];
  t: TFunction;
  onTransformAction?: (action: TransformAction) => void;
}

export const RibbonMenuTransformSection: React.FC<TransformSectionProps> = ({
  openMenu,
  hoveredItem,
  activeSubmenu,
  hasSelection,
  setOpenMenu,
  setHoveredItem,
  setActiveSubmenu,
  ribbonStyles,
  theme,
  items,
  t,
  onTransformAction,
}) => {
  const handleTransformClick = (action: TransformAction) => {
    onTransformAction?.(action);
    setOpenMenu(null);
  };

  return (
    <div style={ribbonStyles.menuGroup}>
      <button
        style={{
          ...ribbonStyles.menuButton,
          opacity: hasSelection ? 1 : 0.5,
          ...(openMenu === "transform"
            ? ribbonStyles.menuButtonActive
            : hoveredItem === "menu-transform" && hasSelection
              ? ribbonStyles.menuButtonHover
              : {}),
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (hasSelection) {
            setOpenMenu(openMenu === "transform" ? null : "transform");
          }
        }}
        onMouseEnter={() => setHoveredItem("menu-transform")}
        onMouseLeave={() => setHoveredItem(null)}
        disabled={!hasSelection}
        title={hasSelection ? "" : t("ribbon.selectEntityFirst")}
        data-menu="transform"
      >
        <div style={ribbonStyles.menuIcon}>
          <TransformIcon stroke={theme === "dark" ? "#eee" : "#333"} />
        </div>
        <div style={ribbonStyles.menuLabel}>
          {t("ribbon.transform")} <span style={{ fontSize: "8px" }}>▼</span>
        </div>
      </button>

      {openMenu === "transform" && (
        <div style={ribbonStyles.dropdown} data-dropdown="transform">
          {items.map((item, idx) => (
            <React.Fragment key={item.id}>
              {(idx === 2 || idx === 6) && <div style={ribbonStyles.separator} />}
              <div style={{ position: "relative" }}>
                <button
                  style={{
                    ...ribbonStyles.dropdownItem,
                    ...(hoveredItem === item.id || activeSubmenu === item.id
                      ? ribbonStyles.dropdownItemHover
                      : {}),
                  }}
                  onClick={() => {
                    if (!item.children) {
                      handleTransformClick(item.id);
                    }
                  }}
                  onMouseEnter={() => {
                    setHoveredItem(item.id);
                    if (item.children) {
                      setActiveSubmenu(item.id);
                    } else {
                      setActiveSubmenu(null);
                    }
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span style={ribbonStyles.dropdownItemIcon}>{item.icon || ""}</span>
                  <span style={ribbonStyles.dropdownItemLabel}>{item.label}</span>
                  {item.children && <span style={ribbonStyles.submenuArrow}>▶</span>}
                </button>

                {item.children && activeSubmenu === item.id && (
                  <div
                    style={ribbonStyles.submenu}
                    onMouseEnter={() => setActiveSubmenu(item.id)}
                    onMouseLeave={() => setActiveSubmenu(null)}
                  >
                    {item.children.map((subItem) => (
                      <button
                        key={subItem.id}
                        style={{
                          ...ribbonStyles.dropdownItem,
                          ...(hoveredItem === subItem.id
                            ? ribbonStyles.dropdownItemHover
                            : {}),
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleTransformClick(subItem.id);
                        }}
                        onMouseEnter={() => setHoveredItem(subItem.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <span style={ribbonStyles.dropdownItemIcon}>{subItem.icon || ""}</span>
                        <span style={ribbonStyles.dropdownItemLabel}>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
