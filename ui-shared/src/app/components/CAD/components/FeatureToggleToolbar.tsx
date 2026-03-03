/**
 * Feature Toggle Toolbar Component
 *
 * A horizontal toolbar showing feature toggles grouped by category.
 * Matches the design in the user-provided screenshot.
 */

import React from 'react';
import { useFeatureFlags } from '../../../contexts/FeatureFlagContext';
import {
    FeaturePackage,
    DrawingFeature,
    PartFeature,
    NestingFeature,
    CommonFeature
} from '@dxf-fix/shared';

interface FeatureToggle {
    package: FeaturePackage;
    feature: DrawingFeature | PartFeature | NestingFeature | CommonFeature;
    label: string;
}

export interface FeatureToggleToolbarProps {
    theme?: 'dark' | 'light';
    isNestingMode?: boolean;
    onToggleNestingMode?: () => void;
}

// Styles
const getStyles = (theme: 'dark' | 'light') => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
        borderBottom: theme === 'dark' ? '1px solid #333' : '1px solid #ddd',
        gap: '12px',
        flexWrap: 'wrap' as const,
        minHeight: '48px',
    },
    groupContainer: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? '#252526' : '#ffffff',
        border: theme === 'dark' ? '1px solid #3e3e42' : '1px solid #e0e0e0',
        borderRadius: '6px',
        padding: '4px',
        gap: '8px',
    },
    groupHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        borderRight: theme === 'dark' ? '1px solid #3e3e42' : '1px solid #e0e0e0',
        height: '20px',
    },
    groupLabel: {
        fontSize: '12px',
        fontWeight: 600,
        color: theme === 'dark' ? '#4ec9b0' : '#0078d4', // Distinct color for headers
        letterSpacing: '0.5px',
    },
    features: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        paddingRight: '4px',
    },
    button: {
        padding: '4px 8px',
        fontSize: '11px',
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        borderRadius: '4px',
        color: theme === 'dark' ? '#ccc' : '#555',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap' as const,
    },
    buttonHover: {
        backgroundColor: theme === 'dark' ? '#3e3e42' : '#f0f0f0',
        color: theme === 'dark' ? '#fff' : '#000',
    },
    buttonActive: {
        backgroundColor: theme === 'dark' ? '#0078d4' : '#e6f2ff',
        borderColor: theme === 'dark' ? '#0078d4' : '#cce4f7',
        color: theme === 'dark' ? '#fff' : '#0078d4',
    },
});

// Feature groups matching the screenshot
const FEATURE_GROUPS = [
    {
        label: '图纸',
        package: FeaturePackage.DRAWING,
        features: [
            { feature: DrawingFeature.EDIT, label: '编辑功能' },
            { feature: DrawingFeature.INSPECTION, label: '图形检查' },
            { feature: DrawingFeature.OPTIMIZATION, label: '图形优化' },
            { feature: DrawingFeature.PART_RECOGNITION, label: '切割零件' },
        ],
    },
    {
        label: '零件',
        package: FeaturePackage.PART,
        features: [
            { feature: PartFeature.FILL_COLOR, label: '填充色' },
            { feature: PartFeature.LAYER_EDIT, label: '图层编辑' },
            { feature: PartFeature.PROCESS, label: '图形工艺' },
        ],
    },
    // Nesting group is handled separately now
    {
        label: '通用',
        package: FeaturePackage.COMMON,
        features: [
            { feature: CommonFeature.BOUNDING_BOX, label: '边框' },
            { feature: CommonFeature.NAME_LABEL, label: '名称' },
            { feature: CommonFeature.OPERATION_HISTORY, label: '操作历史' },
        ],
    },
];

export const FeatureToggleToolbar: React.FC<FeatureToggleToolbarProps> = ({
    theme = 'dark',
    isNestingMode = false,
    onToggleNestingMode
}) => {
    const { isFeatureEnabled, toggleFeature } = useFeatureFlags();
    const styles = React.useMemo(() => getStyles(theme), [theme]);
    const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

    const handleToggle = (pkg: FeaturePackage, feature: DrawingFeature | PartFeature | NestingFeature | CommonFeature) => {
        toggleFeature(pkg, feature);
    };

    return (
        <div style={styles.container}>
            {/* Custom Nesting Group */}
            <div style={styles.groupContainer}>
                <div style={styles.groupHeader}>
                    <span style={styles.groupLabel}>排样</span>
                </div>
                <div style={styles.features}>
                    <button
                        style={{
                            ...styles.button,
                            ...(hoveredButton === 'nesting-mode' ? styles.buttonHover : {}),
                            ...(isNestingMode ? styles.buttonActive : {}),
                        }}
                        onMouseEnter={() => setHoveredButton('nesting-mode')}
                        onMouseLeave={() => setHoveredButton(null)}
                        onClick={onToggleNestingMode}
                        title={isNestingMode ? "退出排样模式" : "进入排样模式"}
                    >
                        排样模式
                    </button>
                </div>
            </div>

            {FEATURE_GROUPS.map((group) => (
                <div key={group.label} style={styles.groupContainer}>
                    <div style={styles.groupHeader}>
                        <span style={styles.groupLabel}>{group.label}</span>
                    </div>
                    <div style={styles.features}>
                        {group.features.map((item) => {
                            const isEnabled = isFeatureEnabled(group.package, item.feature);
                            const isHovered = hoveredButton === item.feature;
                            return (
                                <button
                                    key={item.feature}
                                    style={{
                                        ...styles.button,
                                        ...(isHovered ? styles.buttonHover : {}),
                                        ...(isEnabled ? styles.buttonActive : {}),
                                    }}
                                    onMouseEnter={() => setHoveredButton(item.feature)}
                                    onMouseLeave={() => setHoveredButton(null)}
                                    onClick={() => handleToggle(group.package, item.feature)}
                                    title={`点击${isEnabled ? '禁用' : '启用'} ${item.label}`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FeatureToggleToolbar;
