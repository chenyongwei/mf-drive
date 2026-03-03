/**
 * Version Preview Overlay
 * 
 * Shows a preview of what the CAD state will look like at a specific version
 * Displayed when hovering over a history item
 */

import React, { useState, useEffect } from 'react';

interface VersionPreviewProps {
    fileId: string;
    targetVersion: number;
    theme: 'dark' | 'light';
    onClose: () => void;
    style?: React.CSSProperties;
}

const VersionPreview: React.FC<VersionPreviewProps> = ({
    fileId,
    targetVersion,
    theme,
    onClose,
    style = {},
}) => {
    const [loading, setLoading] = useState(true);
    const [operations, setOperations] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPreview = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/history/${fileId}/preview/${targetVersion}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch preview');
                }

                const result = await response.json();

                if (result.success) {
                    setOperations(result.data.operations);
                } else {
                    throw new Error(result.error || 'Failed to load preview');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [fileId, targetVersion]);

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        border: '2px solid #4a9eff',
        borderRadius: '12px',
        padding: '20px',
        minWidth: '400px',
        maxWidth: '600px',
        maxHeight: '70vh',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)',
        boxShadow: theme === 'dark' ? '0 10px 40px rgba(0, 0, 0, 0.5)' : '0 10px 40px rgba(0, 0, 0, 0.1)',
        zIndex: 10000,
        ...style,
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: theme === 'dark' ? '1px solid #4a4a4a' : '1px solid #ddd',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: 'bold',
        color: theme === 'dark' ? '#ffffff' : '#333333',
    };

    const closeButtonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        color: theme === 'dark' ? '#888' : '#666',
        cursor: 'pointer',
        padding: '0',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        transition: 'all 0.2s',
    };

    const operationItemStyle: React.CSSProperties = {
        padding: '8px 12px',
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
        borderRadius: '6px',
        marginBottom: '8px',
        borderLeft: '3px solid #4a9eff',
    };

    const operationTypeStyle: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#4a9eff',
        marginBottom: '4px',
    };

    const operationDetailStyle: React.CSSProperties = {
        fontSize: '12px',
        color: theme === 'dark' ? '#888' : '#666',
    };

    if (loading) {
        return (
            <div style={containerStyle}>
                <div style={{ textAlign: 'center', color: '#4a9eff', padding: '20px' }}>
                    ⏳ 加载预览中...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <div style={titleStyle}>预览错误</div>
                    <button
                        style={closeButtonStyle}
                        onClick={onClose}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#3a3a3a';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#888';
                        }}
                    >
                        ✕
                    </button>
                </div>
                <div style={{ color: '#ff6b6b', textAlign: 'center' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={titleStyle}>
                    📋 版本 {targetVersion} 预览
                </div>
                <button
                    style={closeButtonStyle}
                    onClick={onClose}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a3a3a';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#888';
                    }}
                >
                    ✕
                </button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#888' }}>
                此版本包含 {operations.length} 个操作
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {operations.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        初始状态 (无操作)
                    </div>
                ) : (
                    operations.map((op, index) => (
                        <div key={op.id || index} style={operationItemStyle}>
                            <div style={operationTypeStyle}>
                                {op.operationType.toUpperCase()}
                            </div>
                            {op.entityId && (
                                <div style={operationDetailStyle}>
                                    实体: {op.entityId.slice(0, 8)}...
                                </div>
                            )}
                            <div style={operationDetailStyle}>
                                用户: {op.username} • v{op.version}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #4a4a4a',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
            }}>
                点击历史项以跳转到此版本
            </div>
        </div>
    );
};

export default VersionPreview;
