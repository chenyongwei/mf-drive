/**
 * Version Comparison View
 * 
 * Shows side-by-side comparison of two versions
 * Highlights differences between the states
 */

import React, { useState, useEffect } from 'react';
import type {
    ComparisonViewProps,
    VersionData,
} from './ComparisonView.types';
import { getDifferences } from './ComparisonView.utils';

const ComparisonView: React.FC<ComparisonViewProps> = ({
    fileId,
    version1,
    version2,
    theme,
    onClose,
}) => {
    const [leftVersion, setLeftVersion] = useState<VersionData>({
        version: version1,
        operations: [],
        loading: true,
        error: null,
    });

    const [rightVersion, setRightVersion] = useState<VersionData>({
        version: version2,
        operations: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const fetchVersionData = async (version: number, setter: React.Dispatch<React.SetStateAction<VersionData>>) => {
            setter(prev => ({ ...prev, loading: true, error: null }));

            try {
                const response = await fetch(`/api/history/${fileId}/preview/${version}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch version data');
                }

                const result = await response.json();

                if (result.success) {
                    setter({
                        version,
                        operations: result.data.operations,
                        loading: false,
                        error: null,
                    });
                } else {
                    throw new Error(result.error || 'Failed to load version');
                }
            } catch (err) {
                setter({
                    version,
                    operations: [],
                    loading: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        };

        fetchVersionData(version1, setLeftVersion);
        fetchVersionData(version2, setRightVersion);
    }, [fileId, version1, version2]);

    const { addedOps, removedOps } = getDifferences(
        leftVersion.operations,
        rightVersion.operations
    );

    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90vw',
        maxWidth: '1200px',
        height: '80vh',
        backgroundColor: theme === 'dark' ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        border: '2px solid #4a9eff',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: theme === 'dark' ? '0 10px 40px rgba(0, 0, 0, 0.5)' : '0 10px 40px rgba(0, 0, 0, 0.1)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
    };

    const headerStyle: React.CSSProperties = {
        padding: '20px',
        borderBottom: theme === 'dark' ? '1px solid #4a4a4a' : '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const comparisonContainerStyle: React.CSSProperties = {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
    };

    const versionPaneStyle: React.CSSProperties = {
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        borderRight: theme === 'dark' ? '1px solid #4a4a4a' : '1px solid #ddd',
    };

    const paneHeaderStyle: React.CSSProperties = {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#4a9eff',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #eee',
    };

    const operationItemStyle = (isAdded?: boolean, isRemoved?: boolean): React.CSSProperties => ({
        padding: '8px 12px',
        backgroundColor: isAdded ? (theme === 'dark' ? '#2a4a2a' : '#e6ffec')
            : isRemoved ? (theme === 'dark' ? '#4a2a2a' : '#ffebe9')
                : (theme === 'dark' ? '#2a2a2a' : '#f8f8f8'),
        borderRadius: '6px',
        marginBottom: '8px',
        borderLeft: isAdded ? '3px solid #1dd1a1' : isRemoved ? '3px solid #ff6b6b' : '3px solid #4a9eff',
    });

    const summaryStyle: React.CSSProperties = {
        padding: '20px',
        borderTop: theme === 'dark' ? '1px solid #4a4a4a' : '1px solid #ddd',
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
    };

    const statItemStyle: React.CSSProperties = {
        textAlign: 'center',
    };

    const statNumberStyle: React.CSSProperties = {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '4px',
        color: theme === 'dark' ? '#fff' : '#333',
    };

    const statLabelStyle: React.CSSProperties = {
        fontSize: '12px',
        color: '#888',
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                    🔍 版本对比: v{version1} ↔ v{version2}
                </div>
                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        color: '#888',
                        cursor: 'pointer',
                        padding: '0',
                        width: '30px',
                        height: '30px',
                    }}
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>

            <div style={comparisonContainerStyle}>
                {/* Left Version */}
                <div style={versionPaneStyle}>
                    <div style={paneHeaderStyle}>版本 {version1}</div>

                    {leftVersion.loading && (
                        <div style={{ textAlign: 'center', color: '#4a9eff', padding: '20px' }}>
                            ⏳ 加载中...
                        </div>
                    )}

                    {leftVersion.error && (
                        <div style={{ color: '#ff6b6b', textAlign: 'center' }}>
                            {leftVersion.error}
                        </div>
                    )}

                    {!leftVersion.loading && !leftVersion.error && (
                        <>
                            {leftVersion.operations.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                    初始状态 (无操作)
                                </div>
                            ) : (
                                leftVersion.operations.map((op) => {
                                    const isRemoved = removedOps.some(removed => removed.id === op.id);
                                    return (
                                        <div key={op.id} style={operationItemStyle(false, isRemoved)}>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: isRemoved ? '#ff6b6b' : '#4a9eff' }}>
                                                {op.operationType.toUpperCase()}
                                                {isRemoved && ' ❌'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>
                                                v{op.version} • {op.username}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>

                {/* Right Version */}
                <div style={{ ...versionPaneStyle, borderRight: 'none' }}>
                    <div style={paneHeaderStyle}>版本 {version2}</div>

                    {rightVersion.loading && (
                        <div style={{ textAlign: 'center', color: '#4a9eff', padding: '20px' }}>
                            ⏳ 加载中...
                        </div>
                    )}

                    {rightVersion.error && (
                        <div style={{ color: '#ff6b6b', textAlign: 'center' }}>
                            {rightVersion.error}
                        </div>
                    )}

                    {!rightVersion.loading && !rightVersion.error && (
                        <>
                            {rightVersion.operations.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                    初始状态 (无操作)
                                </div>
                            ) : (
                                rightVersion.operations.map((op) => {
                                    const isAdded = addedOps.some(added => added.id === op.id);
                                    return (
                                        <div key={op.id} style={operationItemStyle(isAdded, false)}>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: isAdded ? '#1dd1a1' : '#4a9eff' }}>
                                                {op.operationType.toUpperCase()}
                                                {isAdded && ' ✨'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>
                                                v{op.version} • {op.username}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div style={summaryStyle}>
                <div style={statItemStyle}>
                    <div style={{ ...statNumberStyle, color: '#1dd1a1' }}>
                        +{addedOps.length}
                    </div>
                    <div style={statLabelStyle}>新增操作</div>
                </div>

                <div style={statItemStyle}>
                    <div style={{ ...statNumberStyle, color: '#ff6b6b' }}>
                        -{removedOps.length}
                    </div>
                    <div style={statLabelStyle}>移除操作</div>
                </div>

                <div style={statItemStyle}>
                    <div style={{ ...statNumberStyle, color: '#4a9eff' }}>
                        {Math.abs(version2 - version1)}
                    </div>
                    <div style={statLabelStyle}>版本差距</div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonView;
