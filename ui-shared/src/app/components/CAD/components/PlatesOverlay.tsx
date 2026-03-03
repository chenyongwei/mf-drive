/**
 * Plates Overlay
 *
 * Visualizes the nesting plates on the canvas including:
 * - Plate boundaries
 * - Margins
 * - Plate names/IDs
 */

import React from 'react';
import { Plate } from '../types/NestingTypes';
import { Viewport } from '../../../contexts/ViewportContext';

interface PlatesOverlayProps {
    plates: Plate[];
    viewport: Viewport;
    theme: 'dark' | 'light';
    stickToEdge: boolean;
    activePlateId?: string | null;
}

const PlatesOverlay: React.FC<PlatesOverlayProps> = ({
    plates,
    viewport,
    theme,
    stickToEdge,
    activePlateId = null,
}) => {
    const { zoom, pan } = viewport;
    const isDark = theme === 'dark';
    const plateBorderColor = isDark ? 'rgba(163, 176, 189, 0.92)' : 'rgba(94, 107, 121, 0.86)';
    const plateEdgeColor = isDark ? 'rgba(218, 228, 238, 0.25)' : 'rgba(255, 255, 255, 0.75)';
    const plateBaseColor = isDark
        ? 'linear-gradient(to top right, rgba(62, 72, 82, 0.94) 0%, rgba(42, 50, 59, 0.97) 38%, rgba(25, 32, 40, 0.98) 100%)'
        : 'linear-gradient(to top right, rgba(212, 219, 227, 0.95) 0%, rgba(195, 203, 212, 0.96) 42%, rgba(176, 186, 198, 0.98) 100%)';
    const plateTopLight = isDark
        ? 'linear-gradient(to top right, rgba(192, 203, 214, 0.34) 0%, rgba(113, 129, 146, 0.16) 36%, rgba(0,0,0,0) 100%)'
        : 'linear-gradient(to top right, rgba(255,255,255,0.72) 0%, rgba(229, 235, 243, 0.34) 44%, rgba(0,0,0,0) 100%)';
    const marginBorder = isDark ? 'rgba(250, 204, 21, 0.72)' : 'rgba(217, 119, 6, 0.65)';
    const placeableBorder = isDark ? 'rgba(74, 222, 128, 0.62)' : 'rgba(22, 163, 74, 0.58)';
    const forbiddenFill = isDark ? 'rgba(120, 53, 15, 0.16)' : 'rgba(245, 158, 11, 0.13)';
    const placeableFill = isDark ? 'rgba(22, 163, 74, 0.1)' : 'rgba(34, 197, 94, 0.08)';
    const marginGuideBorder = isDark ? 'rgba(148, 163, 184, 0.58)' : 'rgba(100, 116, 139, 0.58)';
    const marginGuideFill = isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(100, 116, 139, 0.05)';

    const hasActivePlate = activePlateId !== null;

    const getStyle = (plate: Plate, isActive: boolean): React.CSSProperties => {
        // Transform plate coordinates to screen coordinates
        const left = plate.position.x * zoom + pan.x;
        const top = plate.position.y * zoom + pan.y;
        const width = plate.width * zoom;
        const height = plate.height * zoom;

        return {
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            border: `2px solid ${isActive ? (isDark ? 'rgba(96, 165, 250, 0.95)' : 'rgba(37, 99, 235, 0.9)') : plateBorderColor}`,
            borderRadius: '3px',
            backgroundImage: `${plateTopLight}, ${plateBaseColor}`,
            pointerEvents: 'none', // Allow clicking through to parts
            boxSizing: 'border-box',
            zIndex: 1,
            opacity: hasActivePlate ? (isActive ? 1 : 0.72) : 1,
            boxShadow: isDark
                ? `0 0 0 1px rgba(130, 146, 162, 0.2), 0 14px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 ${plateEdgeColor}, inset 0 -1px 0 rgba(0,0,0,0.42), inset 0 0 18px rgba(0,0,0,0.2), ${isActive ? '0 0 0 1px rgba(96, 165, 250, 0.42), 0 0 24px rgba(96, 165, 250, 0.18)' : ''}`
                : `0 0 0 1px rgba(118, 131, 144, 0.22), 0 11px 20px rgba(69, 79, 94, 0.2), inset 0 1px 0 ${plateEdgeColor}, inset 0 -1px 0 rgba(117, 127, 139, 0.3), inset 0 0 14px rgba(255,255,255,0.24), ${isActive ? '0 0 0 1px rgba(37, 99, 235, 0.38), 0 0 20px rgba(37, 99, 235, 0.14)' : ''}`,
        };
    };

    const getMarginScreenPx = (plate: Plate): number => {
        const rawMargin = plate.margin * zoom;
        const maxMargin = Math.max(
            0,
            Math.min(plate.width * zoom, plate.height * zoom) / 2 - 1,
        );
        return Math.max(0, Math.min(rawMargin, maxMargin));
    };

    const getForbiddenBandStyle = (): React.CSSProperties => ({
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        background: forbiddenFill,
        border: `1px solid ${marginBorder}`,
        boxSizing: 'border-box',
        pointerEvents: 'none',
    });

    const getPlaceableAreaStyle = (plate: Plate): React.CSSProperties => {
        const margin = getMarginScreenPx(plate);
        const hasMargin = plate.margin > 0;
        const isMarginConstrained = hasMargin && !stickToEdge;

        return {
            position: 'absolute',
            left: `${margin}px`,
            top: `${margin}px`,
            right: `${margin}px`,
            bottom: `${margin}px`,
            border: `1px dashed ${isMarginConstrained ? placeableBorder : marginGuideBorder}`,
            background: isMarginConstrained ? placeableFill : marginGuideFill,
            pointerEvents: 'none',
            boxSizing: 'border-box',
        };
    };

    const getNameStyle = (plate: Plate, isActive: boolean): React.CSSProperties => {
        const left = plate.position.x * zoom + pan.x;
        const top = (plate.position.y - 20) * zoom + pan.y; // Position above plate

        return {
            position: 'absolute',
            left: `${left}px`,
            top: `${top < 0 ? 0 : top}px`, // Keep visible
            color: isActive ? (isDark ? '#dbeafe' : '#1d4ed8') : (isDark ? '#d1dde8' : '#364b63'),
            fontSize: '11px',
            fontWeight: 600,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
            padding: '3px 7px',
            borderRadius: '4px',
            border: isActive
                ? (isDark ? '1px solid rgba(96, 165, 250, 0.55)' : '1px solid rgba(37, 99, 235, 0.55)')
                : (isDark ? '1px solid rgba(132, 150, 167, 0.45)' : '1px solid rgba(112, 125, 138, 0.4)'),
            background: isActive
                ? (isDark ? 'rgba(23, 37, 54, 0.82)' : 'rgba(219, 234, 254, 0.92)')
                : (isDark ? 'rgba(17, 25, 34, 0.7)' : 'rgba(239, 244, 250, 0.86)'),
            textShadow: isDark ? '0 1px 1px rgba(0,0,0,0.7)' : '0 1px 0 rgba(255,255,255,0.66)',
            zIndex: 3,
            opacity: hasActivePlate ? (isActive ? 1 : 0.7) : 1,
        };
    };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {plates.map(plate => {
                const isActive = activePlateId !== null && plate.id === activePlateId;
                const hasMargin = plate.margin > 0;
                const showForbiddenBand = hasMargin && !stickToEdge;
                return (
                <React.Fragment key={plate.id}>
                    <div style={getNameStyle(plate, isActive)}>
                        {plate.name} ({plate.width}x{plate.height})
                    </div>
                    <div style={getStyle(plate, isActive)}>
                        {showForbiddenBand && <div style={getForbiddenBandStyle()} />}
                        <div style={getPlaceableAreaStyle(plate)} />
                    </div>
                </React.Fragment>
            )})}
        </div>
    );
};

export default PlatesOverlay;
