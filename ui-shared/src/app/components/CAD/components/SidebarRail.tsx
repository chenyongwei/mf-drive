import React from 'react';

interface SidebarRailProps {
    children: React.ReactNode;
    theme: 'dark' | 'light';
    isVisible?: boolean;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({ children, theme, isVisible = true }) => {
    if (!isVisible) return null;

    // Check if there are any children (collapsed triggers). If not, we might want to hide the rail completely?
    // Or maybe we depend on isVisible prop. Let's rely on children presence implicitly or explicit prop.
    // For now, if children is empty/null/undefined, styling will just show empty strip.
    // But usually we want the space to collapse if nothing is there.
    // However, the logic in CADPageLayout will be: if (panel is collapsed), show trigger.
    // So if all panels are expanded, no triggers -> rail should be hidden or 0 width.

    // We can use a ref or simply check React.Children.count, but React.Children.count counts even nulls sometimes depending on logic.
    // CSS-based empty check is hard.
    // Let's rely on the parent to pass `isVisible={hasCollapsedPanels}`.

    return (
        <div
            style={{
                width: '40px',
                minWidth: '40px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: theme === 'dark' ? '#252525' : '#e0e0e0',
                borderLeft: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #ccc',
                paddingTop: '12px',
                gap: '12px',
                zIndex: 5,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {children}
        </div>
    );
};

export interface SidebarTriggerProps { // Exported for usage
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    theme: 'dark' | 'light';
    title?: string;
    isActive?: boolean;
}

export const SidebarTrigger: React.FC<SidebarTriggerProps> = ({ onClick, icon, label, theme, title, isActive }) => {
    return (
        <div
            onClick={onClick}
            title={title}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                gap: '12px',
                width: '100%',
                paddingBottom: '12px',
                paddingTop: '12px',
                backgroundColor: isActive
                    ? (theme === 'dark' ? '#333' : '#d0d0d0')
                    : 'transparent',
                borderLeft: isActive
                    ? `3px solid ${'#4a9eff'}`
                    : '3px solid transparent',
                transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2a2a2a' : '#eaeaea';
            }}
            onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <div style={{ fontSize: '18px', filter: theme === 'dark' ? 'none' : 'invert(1)', opacity: isActive ? 1 : 0.7 }}>
                {icon}
            </div>
            <div style={{
                writingMode: 'vertical-rl',
                fontSize: '11px',
                color: theme === 'dark' ? (isActive ? '#fff' : '#888') : (isActive ? '#000' : '#666'),
                fontWeight: 600,
                letterSpacing: '1px',
                whiteSpace: 'nowrap'
            }}>
                {label}
            </div>
        </div>
    );
};
