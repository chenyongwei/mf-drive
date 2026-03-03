import React from 'react';
import { LanguageIconBase, ThemeIconBase } from './AppearanceIcons';

// Dropdown Icons for Select
export const SelectAllIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="6" y="6" width="12" height="12" fill="currentColor" opacity="0.4" /></svg>;
export const InvertSelectIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="12" y="4" width="8" height="8" fill="currentColor" /><rect x="4" y="12" width="8" height="8" fill="currentColor" /></svg>;
export const DeselectIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" /></svg>;

// Dropdown Icons for Display
export const ShowNumbersIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h4v4H4z M10 4h4v4h-4z M4 10h4v4H4z" /></svg>;
export const ShowPathIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12l4-4 4 4 4-4" /></svg>;

export const SelectIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
);

export const ApplyCurrentIcon = () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor">
        <rect x="2" y="2" width="10" height="12" rx="1" strokeWidth="1" />
        <path d="M10 10l4 4-1 1-4-4z" fill="currentColor" stroke="none" />
    </svg>
);

export const ApplyAllIcon = () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor">
        <rect x="2" y="4" width="8" height="10" rx="1" strokeWidth="1" />
        <rect x="5" y="2" width="8" height="10" rx="1" strokeWidth="1" />
        <path d="M10 10l4 4-1 1-4-4z" fill="currentColor" stroke="none" />
    </svg>
);

export const ApplySelectedIcon = () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#ccc">
        <rect x="2" y="2" width="10" height="12" rx="1" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M10 10l4 4-1 1-4-4z" fill="#ccc" stroke="none" />
    </svg>
);

export const PierceIcon = () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#52c41a">
        <path d="M4 2v4l4 6 4-6V2" strokeWidth="1.5" />
        <path d="M8 12v3" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 14l4 0" strokeWidth="1" />
        <circle cx="8" cy="12" r="1.5" fill="#52c41a" />
    </svg>
);

export const DisplayIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4" />
        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
        <path d="M12 16l-1-1h2l-1 1z" fill="currentColor" />
    </svg>
);

export const EnableIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="8" rx="4" />
        <circle cx="15" cy="12" r="3.2" fill="currentColor" stroke="none" />
    </svg>
);

// Group: Process Settings
export const LeadIcon = () => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M8 32c0-8 6-16 16-16s16 8 16 16" stroke="#4285f4" />
        <path d="M24 16l4-4-4 4-4-4 4 4z" fill="#ff4d4f" stroke="none" />
        <path d="M4 32h40" stroke="#52c41a" />
    </svg>
);

export const DeleteIcon = () => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3">
        <rect x="8" y="8" width="32" height="32" stroke="#52c41a" />
        <line x1="12" y1="12" x2="36" y2="36" stroke="#ff4d4f" />
        <line x1="36" y1="12" x2="12" y2="36" stroke="#ff4d4f" />
    </svg>
);

export const StartPointIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="red"><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="white" /></svg>;
export const DockIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#4285f4"><path d="M4 4h16v2H4zM11 8v12h2V8z" /></svg>;
export const MicroJointIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#ff9c6e"><path d="M4 12h6m4 0h6M12 4v6m0 4v6" stroke="currentColor" strokeWidth="2" /></svg>;
export const MicroJointEditIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 12h6m4 0h6M12 4v6m0 4v6" />
        <path d="M15.5 5.5l3 3" stroke="#ff9c6e" />
        <path d="M14.5 9.5l4-4" stroke="#ff9c6e" />
    </svg>
);
export const MicroJointAutoIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h6m4 0h6M12 4v6m0 4v6" stroke="currentColor" strokeWidth="2" />
        <path d="M7 6a4 4 0 0 1 6.2-1.2" stroke="#52c41a" strokeWidth="1.8" />
        <path d="M13.5 3.8l.2 2.7-2.6-.4" fill="none" stroke="#52c41a" strokeWidth="1.6" />
    </svg>
);
export const MicroJointBatchIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" />
        <rect x="6" y="6" width="2.5" height="2" rx="1" fill="#4285f4" stroke="none" />
        <rect x="11" y="11" width="2.5" height="2" rx="1" fill="#4285f4" stroke="none" />
        <rect x="16" y="16" width="2.5" height="2" rx="1" fill="#4285f4" stroke="none" />
    </svg>
);
export const MicroJointLongEdgeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
        <path d="M7 10v4M17 10v4" stroke="#52c41a" strokeWidth="2" />
        <path d="M8.5 7h7" stroke="#52c41a" strokeWidth="1.6" strokeDasharray="1.5 1.5" />
    </svg>
);
export const CoolPointIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#52c41a"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
export const CompensationIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="#4285f4" fill="none"><path d="M4 12c4 0 4-4 8-4s4 4 8 4" strokeWidth="2" /></svg>;
export const SealIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff4d4f" strokeWidth="2">
        <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
export const GapIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#52c41a" strokeWidth="2">
        <path d="M4 12h6v4h4v-4h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
export const OvercutIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff4d4f" strokeWidth="2">
        <path d="M4 12h12 M14 8l4 4-4 4 M16 12h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SuperNestIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#d4af37" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="rgba(212, 175, 55, 0.1)" />
        <path d="M6 6h12v12H6z" strokeDasharray="2 1" />
        <path d="M8 8h8v8H8z" fill="rgba(212, 175, 55, 0.3)" />
    </svg>
);

export const RenestIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4285f4" strokeWidth="2">
        <path d="M4 4v5h5M20 20v-5h-5" />
        <path d="M4 9c2-5 8-7 13-5s7 8 5 13 M20 15c-2 5-8 7-13 5s-7-8-5-13" />
    </svg>
);

export const AdjustPlateIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4285f4" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" />
        <path d="M2 12h20M12 2v20" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
);

export const SortingIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M3 12h12M3 18h6" />
    </svg>
);

export const PlaybackIcons = {
    Rewind: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" /></svg>,
    Prev: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>,
    Play: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>,
    Next: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 18l8.5-6L6 6zM16 6v12h2V6z" /></svg>,
    Forward: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4 18l8.5-6L4 6zm9-12v12l8.5-6z" /></svg>,
};

export const ToolIcons = {
    Measure: () => (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 12h20M2 10v4M22 10v4M7 10v2M12 10v3M17 10v2" />
        </svg>
    ),
    Dimension: () => (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 8h16" />
            <path d="M4 8v8" />
            <path d="M20 8v8" />
            <path d="M8 16h8" />
            <path d="M12 12v4" />
            <path d="M8 12h8" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
    ),
    Craft: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#52c41a"><path d="M12 2l10 10-10 10L2 12z" /></svg>,
    Export: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#4285f4"><path d="M12 2v12m-4-4l4 4 4-4M4 20h16" stroke="currentColor" strokeWidth="2" /></svg>,
    Tag: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#faad14"><path d="M12 2L4 10v10h16V10L12 2z" /></svg>,
    Report: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#ff4d4f"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" stroke="white" strokeWidth="2" /></svg>,
    Push: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#1890ff"><path d="M12 22V10m-4 4l4-4 4 4M2 10h20" stroke="currentColor" strokeWidth="2" /></svg>,
};

export const ArrayIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#999" strokeWidth="1">
        <rect x="4" y="4" width="4" height="4" fill="currentColor" opacity="0.1" />
        <rect x="10" y="4" width="4" height="4" fill="currentColor" opacity="0.1" />
        <rect x="16" y="4" width="4" height="4" fill="currentColor" opacity="0.1" />
        <rect x="4" y="10" width="4" height="4" fill="currentColor" opacity="0.1" />
        <rect x="10" y="10" width="4" height="4" fill="currentColor" opacity="0.1" />
        <rect x="16" y="10" width="4" height="4" fill="currentColor" opacity="0.1" />
        <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4z" stroke="currentColor" strokeWidth="0.5" />
    </svg>
);

export const CommonEdgeArrayIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#ccc" stroke="none">
        <rect x="4" y="4" width="4" height="4" />
        <rect x="9" y="4" width="4" height="4" />
        <rect x="14" y="4" width="4" height="4" />
        <rect x="4" y="9" width="4" height="4" />
        <rect x="9" y="9" width="4" height="4" />
        <rect x="14" y="9" width="4" height="4" />
    </svg>
);

export const LanguageIcon = ({ stroke = 'currentColor' }) => <LanguageIconBase stroke={stroke} />;

export const ThemeIcon = ({ stroke = 'currentColor', isDark = true }) => (
    <ThemeIconBase stroke={stroke} isDark={isDark} />
);

export const AdvancedSortIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" stroke="#999" />
        <path d="M8 6v12M12 6v12M16 6v12" stroke="#52c41a" strokeWidth="1" />
        <path d="M12 10h4M8 14h4" stroke="#52c41a" strokeWidth="1" />
    </svg>
);

export const ManualSortIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <rect x="4" y="4" width="7" height="7" fill="#b7eb8f" stroke="#52c41a" />
        <rect x="13" y="4" width="7" height="7" fill="#91d5ff" stroke="#40a9ff" />
        <rect x="4" y="13" width="7" height="7" fill="#fff1b8" stroke="#d4af37" />
        <rect x="13" y="13" width="7" height="7" fill="#ffccc7" stroke="#ff4d4f" />
    </svg>
);

export const ScrapIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" stroke="#999" fill="rgba(0,0,0,0.05)" />
        <path d="M4 12h8v8" stroke="#52c41a" fill="#b7eb8f" opacity="0.5" />
        <path d="M4 12h8v8" stroke="#52c41a" fill="none" />
    </svg>
);

export * from './NestingRibbonIcons.extra';

export const MeasureIcon = ToolIcons.Measure;
export const DimensionIcon = ToolIcons.Dimension;


export const CraftIcon = ToolIcons.Craft;
export const LabelIcon = ToolIcons.Tag;
