import React from 'react';

export const Icons = {
    Select: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="m13 13 6 6" />
        </svg>
    ),
    Pan: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
    ),
    ZoomIn: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
    ),
    ZoomOut: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
    ),
    FitView: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 8V5a2 2 0 0 1 2-2h3" />
            <path d="M16 3h3a2 2 0 0 1 2 2v3" />
            <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
            <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
            <rect width="10" height="8" x="7" y="8" rx="1" />
        </svg>
    ),
    Trim: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
    ),
    Extend: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M5 12h14" />
            <path d="M15 8l4 4-4 4" />
            <path d="M20 4v16" />
        </svg>
    ),
    Explode: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m13 2 2 2" />
            <path d="m19 5-2 2" />
            <path d="m22 13-2-2" />
            <path d="m19 19-2-2" />
            <path d="m13 22-2-2" />
            <path d="m5 19 2-2" />
            <path d="m2 13 2-2" />
            <path d="m5 5 2-2" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Delete: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    ),
    Line: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="5" cy="19" r="2" />
            <circle cx="19" cy="5" r="2" />
            <line x1="7" y1="17" x2="17" y2="7" />
        </svg>
    ),
    Polyline: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m7 7 3 10 8-10" />
            <circle cx="7" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
            <circle cx="18" cy="7" r="2" />
        </svg>
    ),
    Circle: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    Ellipse: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <ellipse cx="12" cy="12" rx="10" ry="6" />
        </svg>
    ),
    Arc: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M18 10a8 8 0 0 1-8 8" />
            <path d="M10 18a8 8 0 0 1-8-8" />
            <path d="M12 12 l4 -4" strokeWidth="0.5" strokeDasharray="2 2" />
        </svg>
    ),
    Arc3Pt: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M 4 18 A 20 20 0 0 1 20 18" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
            <circle cx="12" cy="10" r="1.5" fill="currentColor" />
            <circle cx="20" cy="18" r="1.5" fill="currentColor" />
        </svg>
    ),
    Bezier: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 12c4-8 14 8 18 0" />
            <circle cx="3" cy="12" r="2" />
            <circle cx="21" cy="12" r="2" />
        </svg>
    ),
    Rect: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect width="18" height="14" x="3" y="5" rx="2" />
        </svg>
    ),
    Undo: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
    ),
    Redo: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
    ),
    Dimension: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M21 21L3 3" />
            <path d="M21 3L3 21" stroke="transparent" /> {/* Spacer */}
            <path d="M4 18h16" /> {/* Dimension line */}
            <path d="M4 16v4" /> {/* End ticks */}
            <path d="M20 16v4" />
        </svg>
    ),
    Text: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M4 6h16" />
            <path d="M12 6v12" />
            <path d="M8 18h8" />
        </svg>
    ),
};
