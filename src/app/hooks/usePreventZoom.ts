import { useEffect } from 'react';

/**
 * Hook to prevent browser zoom via keyboard shortcuts and mouse wheel.
 * Targets: 
 * - Ctrl/Cmd + +/-/= (Zoom in/out/reset)
 * - Ctrl/Cmd + Mouse Wheel (Zoom in/out)
 */
export const usePreventZoom = () => {
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl/Cmd key
            const isControlKey = e.ctrlKey || e.metaKey;

            if (isControlKey) {
                // '+' (187, 107), '-' (189, 109), '0' (48, 96), '=' (187)
                const zoomKeys = [
                    '=', '+', '-', '0',
                    'Digit0', 'Minus', 'Equal',
                    'NumpadAdd', 'NumpadSubtract', 'Numpad0'
                ];

                if (zoomKeys.includes(e.key) || zoomKeys.includes(e.code)) {
                    e.preventDefault();
                }
            }
        };

        // Add listeners with { passive: false } to allow preventDefault
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
};
