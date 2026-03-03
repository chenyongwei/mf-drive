import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import * as Groups from "./components/RibbonGroups";
import {
    type RibbonWidthConfig,
    useRibbonFrame,
} from "./ribbonShared";

interface DrawingRibbonProps {
    theme?: "dark" | "light";
    onAction?: (action: string) => void;
    onThemeToggle?: () => void;
    onLanguageChange?: (lang: "en" | "ja" | "zh-TW" | "zh-CN") => void;
    currentLanguage?: "en" | "ja" | "zh-TW" | "zh-CN";
    showDimensions?: boolean;
}

type DrawingRibbonSection = "view" | "parts" | "optimization" | "geometry" | "process" | "settings";

const DRAWING_WIDTHS: RibbonWidthConfig<DrawingRibbonSection> = {
    view: { expanded: 130, collapsed: 80 },
    parts: { expanded: 200, collapsed: 120 },
    optimization: { expanded: 380, collapsed: 250 },
    geometry: { expanded: 100, collapsed: 60 },
    process: { expanded: 380, collapsed: 280 },
    settings: { expanded: 140, collapsed: 60 },
    padding: 20,
};

const DRAWING_HIDE_ORDER: readonly DrawingRibbonSection[] = [
    "settings",
    "geometry",
    "process",
    "parts",
    "optimization",
    "view",
];

const DrawingRibbon: React.FC<DrawingRibbonProps> = ({
    theme = "dark",
    onAction,
    onThemeToggle,
    onLanguageChange,
    showDimensions = false,
}) => {
    const { i18n } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const { visibility, containerStyle, handleLanguageChange, baseProps } = useRibbonFrame({
        containerRef,
        widthConfig: DRAWING_WIDTHS,
        hideOrder: DRAWING_HIDE_ORDER,
        language: i18n.language,
        theme,
        onAction,
        onLanguageChange,
    });

    return (
        <div ref={containerRef} style={containerStyle} data-drawing-ribbon>
            <Groups.DrawingViewGroup {...baseProps} showLabels={visibility.view} showDimensions={showDimensions} />
            <Groups.PartsGroup {...baseProps} showLabels={visibility.parts} />
            {/* NotchGroup temporarily removed as per request */}
            <Groups.DrawingOptimizationGroup {...baseProps} showLabels={visibility.optimization} />
            <Groups.GeometryGroup {...baseProps} showLabels={visibility.geometry} />
            <Groups.DrawingToolGroup {...baseProps} showLabels={visibility.process} />
            <Groups.ProcessGroup {...baseProps} showLabels={visibility.process} />

            <div style={{ flex: 1, minWidth: '10px' }} />

            <Groups.SettingsGroup
                {...baseProps}
                showLabels={visibility.settings}
                lang={i18n.language}
                onThemeToggle={onThemeToggle || (() => { })}
                onLanguageChange={handleLanguageChange}
            />
        </div>
    );
};

export default DrawingRibbon;
