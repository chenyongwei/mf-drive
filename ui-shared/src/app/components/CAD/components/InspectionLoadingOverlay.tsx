/**
 * Inspection Loading Overlay
 * 
 * A friendly loading animation shown while drawing inspection is in progress.
 */

import React from 'react';

interface InspectionLoadingOverlayProps {
    isVisible: boolean;
    message?: string;
    theme?: 'dark' | 'light';
}

const styles = {
    overlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'opacity 0.3s ease-in-out',
    },
    overlayLight: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    spinner: {
        width: '60px',
        height: '60px',
        border: '4px solid rgba(74, 158, 255, 0.3)',
        borderTop: '4px solid #4a9eff',
        borderRadius: '50%',
        animation: 'inspectSpin 1s linear infinite',
        marginBottom: '16px',
    },
    message: {
        fontSize: '16px',
        fontWeight: 500,
        color: '#ffffff',
        marginBottom: '8px',
    },
    messageLight: {
        color: '#333333',
    },
    subMessage: {
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    subMessageLight: {
        color: 'rgba(0, 0, 0, 0.5)',
    },
    pulsingDots: {
        display: 'flex',
        gap: '6px',
        marginTop: '12px',
    },
    dot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#4a9eff',
        animation: 'inspectPulse 1.4s ease-in-out infinite',
    },
};

// CSS keyframes for animations (injected once)
const injectStyles = () => {
    const styleId = 'inspection-loading-styles';
    if (document.getElementById(styleId)) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
    @keyframes inspectSpin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes inspectPulse {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
  `;
    document.head.appendChild(styleSheet);
};

const InspectionLoadingOverlay: React.FC<InspectionLoadingOverlayProps> = ({
    isVisible,
    message = '正在智能诊断图纸...',
    theme = 'dark',
}) => {
    React.useEffect(() => {
        injectStyles();
    }, []);

    if (!isVisible) return null;

    const isLight = theme === 'light';

    return (
        <div
            style={{
                ...styles.overlay,
                ...(isLight ? styles.overlayLight : {}),
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
        >
            <div style={styles.spinner} />
            <div style={{ ...styles.message, ...(isLight ? styles.messageLight : {}) }}>
                {message}
            </div>
            <div style={{ ...styles.subMessage, ...(isLight ? styles.subMessageLight : {}) }}>
                分析图纸质量问题中，请稍候
            </div>
            <div style={styles.pulsingDots}>
                <div style={{ ...styles.dot, animationDelay: '0s' }} />
                <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
                <div style={{ ...styles.dot, animationDelay: '0.4s' }} />
            </div>
        </div>
    );
};

export default InspectionLoadingOverlay;
