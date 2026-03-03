import React, { useState, useRef, useEffect } from 'react';

interface DraggablePanelProps {
    children: React.ReactNode;
    initialPosition?: { x: number; y: number } | 'center';
    theme?: 'dark' | 'light';
    className?: string;
    style?: React.CSSProperties;
    rulerSize?: { width: number; height: number };
    snapThreshold?: number;
    snapGap?: number;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({
    children,
    initialPosition = 'center',
    theme = 'dark',
    className,
    style,
    rulerSize = { width: 20, height: 20 },
    snapThreshold = 20,
    snapGap = 8,
}) => {
    const [position, setPosition] = useState(() => {
        if (initialPosition === 'center') {
            return { x: 28, y: 0 }; // Will be overridden by CSS centering
        }
        return initialPosition;
    });
    const [isCentered, setIsCentered] = useState(initialPosition === 'center');
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !panelRef.current) return;

            e.preventDefault();

            let parentX = 0;
            let parentY = 0;
            let parentWidth = window.innerWidth;
            let parentHeight = window.innerHeight;

            const offsetParent = panelRef.current.offsetParent as HTMLElement;
            if (offsetParent) {
                const parentRect = offsetParent.getBoundingClientRect();
                parentX = parentRect.left;
                parentY = parentRect.top;
                parentWidth = parentRect.width;
                parentHeight = parentRect.height;
            }

            const panelRect = panelRef.current.getBoundingClientRect();
            const panelWidth = panelRect.width;
            const panelHeight = panelRect.height;

            let newX = e.clientX - dragOffset.current.x - parentX;
            let newY = e.clientY - dragOffset.current.y - parentY;

            // Apply boundary constraints (respect rulers)
            const minX = rulerSize.width;
            const minY = rulerSize.height;
            const maxX = parentWidth - panelWidth;
            const maxY = parentHeight - panelHeight;

            // Snapping logic with gap
            if (newX < minX + snapThreshold) {
                newX = minX + snapGap;
            } else if (newX > maxX - snapThreshold) {
                newX = maxX - snapGap;
            }

            if (newY < minY + snapThreshold) {
                newY = minY + snapGap;
            } else if (newY > maxY - snapThreshold) {
                newY = maxY - snapGap;
            }

            // Final clamp
            newX = Math.max(minX, Math.min(newX, maxX));
            newY = Math.max(minY, Math.min(newY, maxY));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only allow dragging from the handle
        // But for better UX, maybe we should check if the target is the handle
        // For now, we'll put the handle explicitly in the render
    };

    const handleDragStart = (e: React.MouseEvent) => {
        if (!panelRef.current) return;

        // If currently centered, switch to absolute positioning
        if (isCentered) {
            setIsCentered(false);
            const rect = panelRef.current.getBoundingClientRect();
            const parent = panelRef.current.offsetParent as HTMLElement;
            if (parent) {
                const parentRect = parent.getBoundingClientRect();
                setPosition({
                    x: position.x,
                    y: rect.top - parentRect.top
                });
            }
        }

        setIsDragging(true);
        const rect = panelRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const styles = {
        container: {
            position: 'absolute' as const,
            left: `${position.x}px`,
            top: isCentered ? '50%' : `${position.y}px`,
            transform: isCentered ? 'translateY(-50%)' : undefined,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column' as const,
            // Add shadow and rounded corners for the container itself
            boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            ...style,
        },
        dragHandle: {
            height: '14px',
            width: '100%',
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #e0e0e0',
            padding: '2px 0',
        },
        dragHandleIcon: {
            width: '24px',
            height: '4px',
            backgroundColor: theme === 'dark' ? '#4a4a4a' : '#cccccc',
            borderRadius: '2px',
        },
        content: {
            // Ensure children have a solid background if they are transparent
            backgroundColor: theme === 'dark' ? 'rgba(25, 25, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            // overflow: 'hidden', // Removed to allow submenus to display outside the panel
        }
    };

    return (
        <div
            ref={panelRef}
            className={className}
            style={styles.container}
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging the canvas underneath
        >
            <div
                style={styles.dragHandle}
                onMouseDown={handleDragStart}
                data-testid="drag-handle"
                title="Drag to move"
            >
                <div style={styles.dragHandleIcon} />
            </div>
            <div style={styles.content}>
                {children}
            </div>
        </div>
    );
};

export default DraggablePanel;
