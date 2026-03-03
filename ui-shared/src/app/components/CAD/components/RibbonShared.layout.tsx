import React from 'react';
import type { RibbonGroupProps } from './RibbonShared.types';

export const RibbonGroup: React.FC<RibbonGroupProps> = ({
    title,
    children,
    theme,
    showLabels = true,
}) => {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#2a2a2a' : '#ffffff';
    const textColor = isDark ? '#999' : '#666';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0 8px',
                borderLeft: isDark ? '1px solid #3a3a3a' : '1px solid #e0e0e0',
                height: '100%',
                position: 'relative',
                flexShrink: 0,
                overflow: 'visible',
                marginLeft: showLabels && title ? '4px' : '0',
            }}
        >
            {showLabels && title && (
                <div
                    style={{
                        position: 'absolute',
                        transform: 'translateX(-50%)',
                        left: '0',
                        top: '0',
                        bottom: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            fontSize: '10px',
                            color: textColor,
                            background: bgColor,
                            padding: '6px 0',
                            whiteSpace: 'nowrap',
                            writingMode: 'vertical-rl',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            lineHeight: 1,
                            userSelect: 'none',
                        }}
                    >
                        {title}
                    </div>
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    alignItems: 'center',
                    gap: '8px',
                    height: '100%',
                    justifyContent: 'center',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export const RibbonVerticalSeparator: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => (
    <div
        style={{
            width: '1px',
            height: '40px',
            background: theme === 'dark' ? '#3a3a3a' : '#e0e0e0',
            margin: '0 8px',
            alignSelf: 'center',
            opacity: 0.6,
        }}
    />
);

export const RibbonSlider: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100px', gap: '2px', padding: '0 4px' }}>
        <input type="range" style={{ width: '100%', accentColor: '#4285f4', cursor: 'pointer', height: '4px' }} />
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '8px',
                color: theme === 'dark' ? '#888' : '#999',
                opacity: 0.5,
            }}
        >
            {Array.from({ length: 9 }).map((_, i) => (
                <span key={i}>|</span>
            ))}
        </div>
    </div>
);

export const PlaybackControls: React.FC<{ icons: any }> = ({ icons: I }) => (
    <div style={{ display: 'flex', gap: '4px', color: '#4285f4' }}>
        <button style={playStyle}><I.Rewind /></button>
        <button style={playStyle}><I.Prev /></button>
        <button style={playStyle}><I.Play /></button>
        <button style={playStyle}><I.Next /></button>
        <button style={playStyle}><I.Forward /></button>
    </div>
);

const playStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '1px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: 'inherit',
};
