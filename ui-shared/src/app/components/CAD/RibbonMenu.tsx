/**
 * Ribbon Menu Component
 *
 * Office-style ribbon menu with dimension and transform dropdowns
 * for both drawing and part operations.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  buildDimensionItems,
  buildOptimizeItems,
  buildSelectItems,
  buildTransformItems,
} from "./RibbonMenu.data";
import { RibbonMenuControlsSection } from "./RibbonMenu.controls";
import { RibbonMenuDimensionSection } from "./RibbonMenu.dimension";
import { RibbonMenuNestingSection } from "./RibbonMenu.nesting";
import { RibbonMenuOptimizeSection } from "./RibbonMenu.optimize";
import { RibbonMenuSelectSection } from "./RibbonMenu.select";
import { getStyles } from "./RibbonMenu.styles";
import { RibbonMenuTransformSection } from "./RibbonMenu.transform";
import type { OpenRibbonMenu, RibbonMenuProps } from "./RibbonMenu.types";

const RibbonMenu: React.FC<RibbonMenuProps> = ({
  onDimensionAction,
  onTransformAction,
  onSelectAction,
  onOptimizeAction,
  onRunInspection,
  onFixAll,
  inspectionResult,
  hasSelection = false,
  isDrawingMode = true,
  theme = "dark",
  onThemeToggle,
  onLanguageChange,
  currentLanguage = "en",
  isNestingMode = false,
  onNestingModeToggle,
  partSpacing = 5,
  onPartSpacingChange,
  fineRotationStep = 1,
  onFineRotationStepChange,
  stickToEdge = false,
  onStickToEdgeChange,
  penetrationMode = false,
  onPenetrationModeChange,
}) => {
  const [openMenu, setOpenMenu] = useState<OpenRibbonMenu>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  const ribbonStyles = useMemo(() => getStyles(theme), [theme]);
  const dimensionItems = useMemo(() => buildDimensionItems(t), [t]);
  const transformItems = useMemo(() => buildTransformItems(t), [t]);
  const selectItems = useMemo(() => buildSelectItems(t), [t]);
  const optimizeItems = useMemo(() => buildOptimizeItems(t), [t]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={ribbonStyles.container} data-ribbon-menu>
      {isDrawingMode && (
        <RibbonMenuSelectSection
          openMenu={openMenu}
          hoveredItem={hoveredItem}
          setOpenMenu={setOpenMenu}
          setHoveredItem={setHoveredItem}
          ribbonStyles={ribbonStyles}
          theme={theme}
          items={selectItems}
          t={t}
          onSelectAction={onSelectAction}
        />
      )}

      {isDrawingMode && (
        <RibbonMenuOptimizeSection
          openMenu={openMenu}
          hoveredItem={hoveredItem}
          setOpenMenu={setOpenMenu}
          setHoveredItem={setHoveredItem}
          ribbonStyles={ribbonStyles}
          theme={theme}
          items={optimizeItems}
          inspectionResult={inspectionResult}
          t={t}
          onOptimizeAction={onOptimizeAction}
          onRunInspection={onRunInspection}
          onFixAll={onFixAll}
        />
      )}

      {isDrawingMode && (
        <RibbonMenuDimensionSection
          openMenu={openMenu}
          hoveredItem={hoveredItem}
          setOpenMenu={setOpenMenu}
          setHoveredItem={setHoveredItem}
          ribbonStyles={ribbonStyles}
          theme={theme}
          items={dimensionItems}
          t={t}
          onDimensionAction={onDimensionAction}
        />
      )}

      {isDrawingMode && (
        <RibbonMenuTransformSection
          openMenu={openMenu}
          hoveredItem={hoveredItem}
          activeSubmenu={activeSubmenu}
          hasSelection={hasSelection}
          setOpenMenu={setOpenMenu}
          setHoveredItem={setHoveredItem}
          setActiveSubmenu={setActiveSubmenu}
          ribbonStyles={ribbonStyles}
          theme={theme}
          items={transformItems}
          t={t}
          onTransformAction={onTransformAction}
        />
      )}

      <div style={{ flex: 1 }} />

      <RibbonMenuNestingSection
        onNestingModeToggle={onNestingModeToggle}
        isNestingMode={isNestingMode}
        partSpacing={partSpacing}
        onPartSpacingChange={onPartSpacingChange}
        stickToEdge={stickToEdge}
        onStickToEdgeChange={onStickToEdgeChange}
        hoveredItem={hoveredItem}
        setHoveredItem={setHoveredItem}
        theme={theme}
        ribbonStyles={ribbonStyles}
        t={t}
      />

      <RibbonMenuControlsSection
        hoveredItem={hoveredItem}
        setHoveredItem={setHoveredItem}
        theme={theme}
        onThemeToggle={onThemeToggle}
        i18n={i18n}
        ribbonStyles={ribbonStyles}
      />
    </div>
  );
};

export default RibbonMenu;
