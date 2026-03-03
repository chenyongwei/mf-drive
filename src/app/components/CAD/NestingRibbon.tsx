import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import * as Groups from "./components/RibbonGroups";
import type {
    DropdownItem,
    NestingProcessActionDef,
    SortingModeId,
} from "./components/RibbonDropdowns";
import type { NestingProcessOperation } from "./types/NestingTypes";
import {
    type RibbonWidthConfig,
    useRibbonFrame,
} from "./ribbonShared";

interface NestingRibbonProps {
    theme?: "dark" | "light";
    onAction?: (action: string) => void;
    onThemeToggle?: () => void;
    onLanguageChange?: (lang: "en" | "ja" | "zh-TW" | "zh-CN") => void;
    currentLanguage?: "en" | "ja" | "zh-TW" | "zh-CN";
    showDimensions?: boolean;
    sortingMode?: SortingModeId;
    partSpacing?: number;
    onPartSpacingChange?: (value: number) => void;
    showDistanceGuides?: boolean;
    distanceGuideMaxDistance?: number;
    commonEdgeEnabled?: boolean;
    stickToEdgeEnabled?: boolean;
    snappingEnabled?: boolean;
    snapTolerance?: number;
    processAddMenu?: DropdownItem[];
    processDeleteMenu?: DropdownItem[];
    processFavoriteActions?: NestingProcessActionDef[];
    processPrimaryActionByOperation?: Partial<Record<NestingProcessOperation, string>>;
    processPrimaryActionDefByOperation?: Partial<Record<NestingProcessOperation, NestingProcessActionDef>>;
    onProcessPrimaryClick?: (operation: NestingProcessOperation) => void;
    onProcessPinToggle?: (actionId: string) => void;
}

type NestingRibbonSection = "view" | "process" | "nesting" | "sorting" | "path" | "tool" | "settings";

const NESTING_WIDTHS: RibbonWidthConfig<NestingRibbonSection> = {
    view: { expanded: 140, collapsed: 88 },
    process: { expanded: 460, collapsed: 300 },
    nesting: { expanded: 280, collapsed: 180 },
    sorting: { expanded: 170, collapsed: 120 },
    path: { expanded: 190, collapsed: 120 },
    tool: { expanded: 190, collapsed: 120 },
    settings: { expanded: 140, collapsed: 60 },
    spacer: 8,
    padding: 20,
};

const NESTING_HIDE_ORDER: readonly NestingRibbonSection[] = [
    "settings",
    "path",
    "tool",
    "sorting",
    "nesting",
    "process",
    "view",
];

const NestingRibbon: React.FC<NestingRibbonProps> = ({
    theme = "dark",
    onAction,
    onThemeToggle,
    onLanguageChange,
    showDimensions = false,
    sortingMode,
    partSpacing = 5,
    onPartSpacingChange,
    showDistanceGuides = true,
    distanceGuideMaxDistance = 40,
    commonEdgeEnabled = true,
    stickToEdgeEnabled = false,
    snappingEnabled = true,
    snapTolerance = 15,
    processAddMenu = [],
    processDeleteMenu = [],
    processFavoriteActions = [],
    processPrimaryActionByOperation,
    processPrimaryActionDefByOperation,
    onProcessPrimaryClick,
    onProcessPinToggle,
}) => {
    const { i18n } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const { visibility, containerStyle, handleLanguageChange, baseProps } = useRibbonFrame({
        containerRef,
        widthConfig: NESTING_WIDTHS,
        hideOrder: NESTING_HIDE_ORDER,
        language: i18n.language,
        theme,
        onAction,
        onLanguageChange,
    });

    return (
        <div ref={containerRef} style={containerStyle} data-nesting-ribbon>
            <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
                <Groups.ViewGroup
                    {...baseProps}
                    showLabels={visibility.view}
                    showDimensions={showDimensions}
                    showDistanceGuides={showDistanceGuides}
                    distanceGuideMaxDistance={distanceGuideMaxDistance}
                    commonEdgeEnabled={commonEdgeEnabled}
                    stickToEdgeEnabled={stickToEdgeEnabled}
                    snappingEnabled={snappingEnabled}
                    snapTolerance={snapTolerance}
                />
                <Groups.ProcessSettingsGroup
                    {...baseProps}
                    showLabels={visibility.process}
                    processAddMenu={processAddMenu}
                    processDeleteMenu={processDeleteMenu}
                    processFavoriteActions={processFavoriteActions}
                    processPrimaryActionByOperation={processPrimaryActionByOperation}
                    processPrimaryActionDefByOperation={processPrimaryActionDefByOperation}
                    onProcessPrimaryClick={onProcessPrimaryClick}
                    onProcessPinToggle={onProcessPinToggle}
                />
                <Groups.NestingGroup
                    {...baseProps}
                    showLabels={visibility.nesting}
                    partSpacing={partSpacing}
                    onPartSpacingChange={onPartSpacingChange}
                />
                <Groups.SortingGroup {...baseProps} showLabels={visibility.sorting} sortingMode={sortingMode} />
                <Groups.PathGroup {...baseProps} showLabels={visibility.path} />
                <Groups.ToolGroup {...baseProps} showLabels={visibility.tool} />
            </div>

            <div style={{ width: '8px', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0, marginLeft: 'auto' }}>
                <Groups.SettingsGroup
                    {...baseProps}
                    showLabels={visibility.settings}
                    lang={i18n.language}
                    onThemeToggle={onThemeToggle || (() => { })}
                    onLanguageChange={handleLanguageChange}
                />
            </div>
        </div>
    );
};

export default NestingRibbon;
