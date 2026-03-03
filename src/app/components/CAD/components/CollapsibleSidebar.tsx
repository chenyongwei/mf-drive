import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CollapsibleSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    width: number;
    onResize: (width: number) => void;
    theme: 'dark' | 'light';
    title: string;
    children: React.ReactNode;
    icon: React.ReactNode;
    collapsedLabel: string;
    side?: 'left' | 'right';
    hideCollapsedHandle?: boolean;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
    isOpen,
    onToggle,
    width,
    onResize,
    theme,
    title,
    children,
    icon,
    collapsedLabel,
    side = 'right',
    hideCollapsedHandle = false
}) => {
    const [isResizing, setIsResizing] = useState(false);
    const isResizingRef = useRef(false);
    const isOpenRef = useRef(isOpen);

    // Sync refs
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    useEffect(() => {
        isResizingRef.current = isResizing;
    }, [isResizing]);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!isResizingRef.current) return;

        // Calculate new width based on side
        // Assuming right sidebar for now as per requirement
        const newWidth = window.innerWidth - e.clientX;

        // This is a bit simplified, in real multi-panel setup, e.clientX relative to window might not be enough if there are other panels to the right.
        // But for "absolute right" panel it works.
        // For a panel that is to the left of another panel, we might need more complex logic.
        // However, the prompt asks for "simultaneous expand", implies they might be side-by-side.
        // If they are side-by-side in a flex container, simpler resizing logic (based on movement delta) might be better?
        // Let's stick to the HistoryPanel logic for now which uses absolute window coordinates because it was the only right panel.
        // Wait, if we have TWO panels, using window.innerWidth - clientX only works for the Right-most panel.
        // If we have [Canvas][Layouts][History], rescaling Layouts needs to know where it is.
        // But `CADPageLayout` implementation of resize uses `window.innerWidth - e.clientX`.

        // Let's use simple delta movement instead for better robustness in flexbox?
        // Actually, let's keep it simple: The parent component should probably handle the specific resize math if it involves multiple panels?
        // But the prop is `onResize(width)`. 
        // For this component to be reusable, maybe it shouldn't assume it's pinned to the right of the window.
        // BUT, the existing implementation does exactly that.

        // Let's implement a ref-based delta resize.
    }, []);

    // We will leave the specific global mouse move resize logic to the component, 
    // BUT since we might have multiple, we need to be careful.
    // The previous implementation used `window.innerWidth - e.clientX` which assumes it's the only thing on the right.
    // If we have [Layout][History], resizing [Layout] using that formula will include [History]'s width!
    // Solution: pass `onResize` that takes a DELTA or just let the parent handle the mouse move?
    // Or, simpler: calculate width change based on movement.

    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const deltaX = e.clientX - startXRef.current;
        // If resizing from left edge of a right-aligned panel: moving left (negative delta) INCREASES width.
        // So newWidth = startWidth - deltaX
        const newWidth = startWidthRef.current - deltaX;

        const MIN_WIDTH = 200;
        const MAX_WIDTH = 600;
        const COLLAPSE_THRESHOLD = 80;

        if (newWidth < COLLAPSE_THRESHOLD) {
            if (isOpenRef.current) {
                onToggle(); // Collapse
                stopResizingInternal(); // Stop resizing if we collapsed
            }
        } else {
            const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
            onResize(clampedWidth);
        }
    }, [onResize, onToggle]);

    const stopResizingInternal = useCallback(() => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseUp = useCallback(() => {
        stopResizingInternal();
    }, [stopResizingInternal]);

    // Clean up
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f0f0f0',
                borderLeft: theme === 'dark' ? '1px solid #333' : '1px solid #ccc'
            }}
        >
            {/* Resizer Handle */}
            {isOpen && (
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        left: '-3px',
                        top: 0,
                        width: '6px',
                        height: '100%',
                        cursor: 'col-resize',
                        zIndex: 10,
                        backgroundColor: isResizing ? '#4a9eff' : 'transparent',
                        transition: 'background-color 0.2s',
                    }}
                />
            )}

            {/* Collapsed Vertical Strip */}
            {!hideCollapsedHandle && (
                <div
                    style={{
                        width: !isOpen ? '40px' : '0px',
                        minWidth: !isOpen ? '40px' : '0px',
                        backgroundColor: theme === 'dark' ? '#252525' : '#e0e0e0',
                        borderLeft: !isOpen ? (theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #ccc') : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingTop: '12px',
                        gap: '12px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        cursor: !isOpen ? 'pointer' : 'default',
                        zIndex: 5,
                    }}
                    onClick={() => !isOpen && onToggle()}
                    title={!isOpen ? `Expand ${title}` : ''}
                >
                    <div style={{ fontSize: '18px', filter: theme === 'dark' ? 'none' : 'invert(1)', opacity: 0.7 }}>
                        {icon}
                    </div>
                    <div style={{
                        writingMode: 'vertical-rl',
                        fontSize: '11px',
                        color: theme === 'dark' ? '#888' : '#666',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        opacity: !isOpen ? 1 : 0,
                        whiteSpace: 'nowrap'
                    }}>
                        {collapsedLabel}
                    </div>
                </div>
            )}

            {/* Collapse Toggle Button (Visible when expanded) */}
            {isOpen && (
                <div
                    onClick={onToggle}
                    style={{
                        width: '12px',
                        backgroundColor: theme === 'dark' ? '#252525' : '#e0e0e0',
                        borderLeft: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #ccc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 5,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#333' : '#d0d0d0';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#252525' : '#e0e0e0';
                    }}
                    title="Collapse Panel"
                >
                    <span style={{ color: '#666', fontSize: '9px' }}>≫</span>
                </div>
            )}

            {/* Panel Content */}
            <div
                style={{
                    width: !isOpen ? '0px' : `${width}px`,
                    minWidth: !isOpen ? '0px' : `${width}px`,
                    overflow: 'hidden',
                    transition: isResizing ? 'none' : 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderLeft: 'none',
                    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        minWidth: 0,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};
