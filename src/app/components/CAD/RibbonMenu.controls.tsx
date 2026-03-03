import React from "react";
import type { i18n as I18nType } from "i18next";
import i18nInstance from "../../i18n/i18n";
import { LanguageIcon, ThemeIcon } from "./RibbonMenu.icons";
import { getStyles } from "./RibbonMenu.styles";

interface ControlsProps {
  hoveredItem: string | null;
  setHoveredItem: (value: string | null) => void;
  theme: "dark" | "light";
  onThemeToggle?: () => void;
  i18n: I18nType;
  ribbonStyles: ReturnType<typeof getStyles>;
}

const languageLabel = (language: string): string => {
  if (language === "zh-TW") {
    return "繁體中文";
  }
  if (language === "zh-CN") {
    return "简体中文";
  }
  if (language === "ja") {
    return "日本語";
  }
  return "English";
};

export const RibbonMenuControlsSection: React.FC<ControlsProps> = ({
  hoveredItem,
  setHoveredItem,
  theme,
  onThemeToggle,
  i18n,
  ribbonStyles,
}) => {
  return (
    <div style={{ ...ribbonStyles.smallMenuButtonGroup, alignItems: "flex-end" }}>
      <button
        style={{
          ...ribbonStyles.smallMenuButton,
          width: "auto",
          minWidth: "100px",
          ...(hoveredItem === "btn-lang" ? ribbonStyles.menuButtonHover : {}),
        }}
        onClick={() => {
          const langs = ["en", "ja", "zh-TW", "zh-CN"];
          const currentLang = i18n.language;
          const idx = langs.indexOf(currentLang);
          const nextLang = langs[(idx + 1) % langs.length];
          i18nInstance.changeLanguage(nextLang);
        }}
        onMouseEnter={() => setHoveredItem("btn-lang")}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <LanguageIcon stroke={theme === "dark" ? "#eee" : "#333"} />
        <span>{languageLabel(i18n.language)}</span>
      </button>

      <button
        style={{
          ...ribbonStyles.smallMenuButton,
          width: "auto",
          minWidth: "100px",
          ...(hoveredItem === "btn-theme" ? ribbonStyles.menuButtonHover : {}),
        }}
        onClick={onThemeToggle}
        onMouseEnter={() => setHoveredItem("btn-theme")}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <ThemeIcon stroke={theme === "dark" ? "#eee" : "#333"} isDark={theme === "dark"} />
        <span>{theme === "dark" ? "深色模式" : "浅色模式"}</span>
      </button>
    </div>
  );
};
