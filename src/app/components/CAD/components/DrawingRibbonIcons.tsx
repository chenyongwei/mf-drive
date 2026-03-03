import React from 'react';
import {
    SelectAllIcon, DisplayIcon, MeasureIcon, LeadIcon, DeleteIcon,
    StartPointIcon, MicroJointIcon, CoolPointIcon, CompensationIcon, SealIcon,
    ExportIcon, ToolIcons
} from './NestingRibbonIcons';

// Re-export existing icons that are shared
export {
    SelectAllIcon, DisplayIcon, MeasureIcon, LeadIcon, DeleteIcon,
    StartPointIcon, MicroJointIcon, CoolPointIcon, CompensationIcon, SealIcon,
    ExportIcon
};

// ==========================================
// View Group (查看)
// ==========================================
export const SelectIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
);

// ==========================================
// Parts Group (零件)
// ==========================================
export const IdentifyPartIcon = () => (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="8" width="14" height="14" fill="#e6f7ff" stroke="#1890ff" strokeWidth="1.8" strokeDasharray="2 1.5" />
        <path d="M22 23l2 2 4-4" stroke="#52c41a" strokeWidth="2" />
    </svg>
);

export const SetAsPartIcon = () => (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="8" width="14" height="14" fill="#f6ffed" stroke="#52c41a" strokeWidth="1.8" />
        <circle cx="24" cy="10" r="5" fill="#f6ffed" stroke="#52c41a" strokeWidth="1.8" />
        <path d="M24 7v6M21 10h6" stroke="#52c41a" strokeWidth="2" />
    </svg>
);

export const CancelPartIcon = () => (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="8" width="14" height="14" fill="#fff1f0" stroke="#ff4d4f" strokeWidth="1.8" />
        <path d="M24 20a7 7 0 0 0-7-7h-4" stroke="#ff4d4f" strokeWidth="2" />
        <path d="M13 10l-4 3 4 3" stroke="#ff4d4f" strokeWidth="2" />
    </svg>
);

// ==========================================
// Notch Group (坡口)
// ==========================================
export const NotchPropIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 20h16M4 16l4-8h8l4 8" />
        <path d="M12 8v12" strokeDasharray="2 2" />
    </svg>
);

export const ManualNotchIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M6 21l3-12h6l3 12" />
        <path d="M12 9v4" />
    </svg>
);

export const AutoNotchIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" strokeDasharray="2 2" />
        <path d="M7 19l2-8h6l2 8" />
    </svg>
);

export const NotchExtendIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 12h16M16 8l4 4-4 4" />
        <rect x="4" y="6" width="8" height="12" fill="currentColor" opacity="0.1" />
    </svg>
);

export const MergeNotchIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 12h5M15 12h5" />
        <rect x="9" y="8" width="6" height="8" rx="1" />
    </svg>
);

export const NotchMappingIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 8h5v8H4zM15 8h5v8h-5z" />
        <path d="M9 12h6" strokeDasharray="2 2" />
        <path d="M12 9l3 3-3 3" />
    </svg>
);

// ==========================================
// Drawing Optimization Group (图纸优化)
// ==========================================
export const SplitIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
        <path d="M8 12l-2-2m0 4l2-2" /> {/* Arrow left */}
        <path d="M16 12l2-2m0 4l-2-2" /> {/* Arrow right */}
    </svg>
);

export const CurveSplitIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" fill="#0000FF" fillOpacity="0.2" stroke="#0000FF" /> {/* Center circle */}
        <path d="M8 12H2m3-3l-3 3l3 3" stroke="#008000" strokeWidth="2" /> {/* Left Arrow */}
        <path d="M16 12h6m-3-3l3 3l-3 3" stroke="#008000" strokeWidth="2" /> {/* Right Arrow */}
    </svg>
);

export const TrimIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 20L20 4" stroke="currentColor" strokeWidth="2" /> {/* Diagonal line */}
        <path d="M4 4l5 5" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" /> {/* Dashed cut part */}
        <path d="M20 20l-5-5" stroke="currentColor" strokeWidth="2" />
    </svg>
);

export const SimplifyIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12c2-4 5-6 9-6s7 2 9 6" strokeOpacity="0.3" strokeDasharray="2 2" />
        <path d="M3 12l9-6 9 6" />
    </svg>
);

export const ExtendIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h10" />
        <path d="M14 12h6" strokeDasharray="2 2" />
        <path d="M20 9v6" />
    </svg>
);

export const ChamferIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h10 M4 4v10" />
        <path d="M14 4l-4 4" strokeDasharray="2 2" />
        <line x1="14" y1="4" x2="20" y2="4" strokeOpacity="0.2" />
        <line x1="4" y1="14" x2="4" y2="20" strokeOpacity="0.2" />
        <line x1="14" y1="4" x2="4" y2="14" />
    </svg>
);

export const BridgeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="6" height="16" />
        <rect x="14" y="4" width="6" height="16" />
        <path d="M10 12h4" strokeWidth="4" />
    </svg>
);

export const ReleaseAngleIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20h16M4 4h16" />
        <circle cx="20" cy="4" r="3" />
        <circle cx="20" cy="20" r="3" />
    </svg>
);

export const ArrayIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" opacity="0.5" />
        <rect x="4" y="14" width="6" height="6" opacity="0.5" />
        <rect x="14" y="14" width="6" height="6" opacity="0.5" />
    </svg>
);

export const OptimizeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
);

export const TextExplodeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <text x="4" y="18" fontSize="16" fontWeight="bold">T</text>
        <path d="M16 18l4-4" stroke="red" />
        <path d="M16 14l4 4" stroke="red" />
    </svg>
);

export const GeomReplaceIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="6" width="6" height="6" />
        <path d="M12 9h4l-1-1 1 1-1 1" />
        <circle cx="19" cy="9" r="3" />
    </svg>
);

export const FilletIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h8" />
        <path d="M4 4v8" />
        <path d="M12 4a8 8 0 0 1-8 8" strokeDasharray="2 2" />
        <path d="M12 4v0" />
        <path d="M4 12h0" />
    </svg>
);

// ==========================================
// Geometry Group (几何变换)
// ==========================================
export const SizeIcon = () => (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="8" width="20" height="16" strokeDasharray="2 2" />
        <path d="M4 16h24M16 4v24" strokeOpacity="0.2" />
        <path d="M6 6l4 4M26 26l-4-4" />
    </svg>
);

export const TransformIcon = () => (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="10" height="10" strokeOpacity="0.5" />
        <rect x="14" y="14" width="10" height="10" fill="currentColor" fillOpacity="0.1" />
        <path d="M18 18l-4-4" />
    </svg>
);

// ==========================================
// Process Group Extensions (工艺设置)
// ==========================================
export const PositiveCutIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" />
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
    </svg>
);

export const NegativeCutIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" fill="currentColor" fillOpacity="0.2" />
        <circle cx="12" cy="12" r="4" fill="white" stroke="currentColor" />
    </svg>
);

export const ReverseDirectionIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 16h10a4 4 0 0 0 0-8h-2" />
        <path d="M16 8l-3 3 3 3" />
    </svg>
);

export const LoopIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12a8 8 0 0 1 16 0A8 8 0 0 1 4 12z" />
        <path d="M20 12l-4-4M20 12l-4 4" />
    </svg>
);

export const KnifeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.5 3.5l6 6-13 13h-6v-6l13-13z" />
        <path d="M10 14L20 4" />
    </svg>
);

// ==========================================
// Tool Constants Mapping
// ==========================================
export const CountIcon = () => (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <text x="6" y="20" fontSize="16" fontWeight="bold">123</text>
    </svg>
);

export const SaveIcon = () => (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 4h16l6 6v18H6V4z" />
        <path d="M10 4v10h12V4" />
        <path d="M8 28v-8h16v8" />
    </svg>
);
