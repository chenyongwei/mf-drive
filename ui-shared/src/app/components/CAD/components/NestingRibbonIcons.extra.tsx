import React from 'react';

export const SkeletonCutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" stroke="#999" />
        <path d="M4 10h16M4 14h16M10 4v16M14 4v16" stroke="#eee" strokeWidth="1" />
        <path d="M8 4v16M16 4v16" stroke="#ff4d4f" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
);

export const StickToEdgeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="16" width="16" height="4" fill="#52c41a" stroke="none" />
        <path d="M12 4v8M9 9l3 3 3-3" stroke="#52c41a" />
        <rect x="6" y="14" width="12" height="2" stroke="#4285f4" strokeWidth="1" />
    </svg>
);

export const VIPIcon = () => (
    <svg viewBox="0 0 16 16" width="12" height="12">
        <rect width="16" height="16" rx="2" fill="#faad14" />
        <text x="2" y="12" fontSize="9" fill="white" fontWeight="bold">VIP</text>
    </svg>
);

export const CheckIcon = () => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#4285f4" strokeWidth="2">
        <path d="M3 8l3 3 7-7" />
    </svg>
);

export const PartSortIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="18" r="3" stroke="#faad14" fill="#fff7e6" />
        <rect x="15" y="4" width="6" height="6" stroke="#4285f4" fill="#e3f2fd" />
        <path d="M9 15l6-8" stroke="#ccc" strokeDasharray="2 2" />
        <path d="M14 7l1-1-2-1" fill="#ccc" stroke="none" />
    </svg>
);

export const InnerSortIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" stroke="#52c41a" fill="#f6ffed" />
        <path d="M8 8h8v8H8z" stroke="#52c41a" fill="none" strokeDasharray="2 1" />
        <path d="M12 12l2-2-1-1" fill="#52c41a" stroke="none" />
    </svg>
);

export const SortToFrontIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="6" width="10" height="10" stroke="#ccc" />
        <rect x="10" y="10" width="10" height="10" stroke="#faad14" fill="#fff7e6" />
        <path d="M4 12l2-2m0 4l-2-2" stroke="#faad14" />
    </svg>
);

export const SortToBackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="10" y="10" width="10" height="10" stroke="#ccc" />
        <rect x="6" y="6" width="10" height="10" stroke="#faad14" fill="#fff7e6" />
        <path d="M20 12l-2-2m0 4l2-2" stroke="#faad14" />
    </svg>
);

export const SortForwardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="12" height="12" stroke="#faad14" fill="#fff7e6" />
        <path d="M4 12h4m-2-2l2 2-2 2" stroke="#faad14" />
    </svg>
);

export const SortBackwardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="8" width="12" height="12" stroke="#faad14" fill="#fff7e6" />
        <path d="M20 12h-4m2-2l-2 2 2 2" stroke="#faad14" />
    </svg>
);

export const ExportIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2">
        <path d="M12 3v12m0-12l-4 4m4-4l4 4" />
        <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
    </svg>
);

export const PushIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2">
        <path d="M5 12h14m-4-4l4 4-4 4" />
        <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
    </svg>
);

export const ReportIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" strokeWidth="1.5" strokeOpacity="0.7" />
    </svg>
);

export const SimulationIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2">
        <rect x="2" y="4" width="20" height="15" rx="2" />
        <path d="M7 21h10" />
        <path d="M12 19v2" />
        <path d="M6 10l4 4 8-8" stroke="#52c41a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const UnclosedFrameIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M4 4h16v16H8" strokeDasharray="2 2" /></svg>;
export const UnclosedRedIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff4d4f"><path d="M4 4h16v16H8" /></svg>;
export const PathStartIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="4" cy="4" r="2" /></svg>;
export const ProcessPathIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M4 12l4-4 4 4 4-4 4 4" /></svg>;
export const MicroJointMarkIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3" strokeWidth="2" /></svg>;
export const BevelTrajIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M4 20L20 4" /><path d="M4 16L20 4" strokeDasharray="2 2" /></svg>;
export const ErrorIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff4d4f"><circle cx="12" cy="12" r="10" /><line x1="12" y1="7" x2="12" y2="13" /><line x1="12" y1="16" x2="12" y2="16" strokeWidth="2" /></svg>;
export const ViewAllIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="12" cy="12" r="6" /></svg>;
export const FitSelectionIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><rect x="4" y="4" width="16" height="16" strokeDasharray="2 2" /><circle cx="12" cy="12" r="4" /></svg>;
export const FileInfoIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" /></svg>;
export const ChamferIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M4 4h10l6 6v10H4z" /></svg>;
export const SplitIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><line x1="4" y1="4" x2="10" y2="10" /><line x1="14" y1="14" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" stroke="red" /></svg>;
export const SortSmallIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><rect x="4" y="4" width="6" height="6" /><rect x="12" y="12" width="6" height="6" /></svg>;

export const ReverseDirectionIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M4 12h16m-4-4l4 4-4 4" /></svg>;
export const RotateCCWIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M4 12a8 8 0 1 1 2.3 5.3" /><path d="M4 12V8M4 12H8" /></svg>;
export const RotateCWIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M20 12a8 8 0 1 0-2.3 5.3" /><path d="M20 12V8M20 12H16" /></svg>;
