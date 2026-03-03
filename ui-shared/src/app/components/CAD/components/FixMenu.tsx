import React from 'react';
import { useTranslation } from 'react-i18next';
import { InspectionResult } from '@dxf-fix/shared/types/inspection';
import { shouldShowFixMenu } from '../../../utils/fixMenuVisibility';

interface FixMenuProps {
    inspectionResult: InspectionResult;
    onFixAll: () => void;
    theme?: 'dark' | 'light';
}

const FixMenu: React.FC<FixMenuProps> = ({
    inspectionResult,
    onFixAll,
    theme = 'dark',
}) => {
    const { t } = useTranslation();

    // Calculate stats
    const errorCount = inspectionResult.summary?.error || 0;
    const warningCount = inspectionResult.summary?.warning || 0;
    const totalIssues = inspectionResult.issues.length;

    if (!shouldShowFixMenu(inspectionResult)) {
        return null;
    }

    const styles = {
        wrapper: {
            position: 'absolute' as const,
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1000,
        },
        container: {
            width: '260px',
            backgroundColor: theme === 'dark' ? 'rgba(25, 25, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: theme === 'dark' ? '#eeeeee' : '#333333',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '12px',
            borderRadius: '8px',
            boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
        },
        body: {
            padding: '12px',
        },
        summaryBox: {
            marginBottom: '0',
        },
        title: {
            color: '#FFC107',
            fontWeight: 700,
            fontSize: '14px',
            marginBottom: '4px',
        },
        stats: {
            color: theme === 'dark' ? '#aaa' : '#666',
            marginBottom: '12px',
        },
        fixAllBtn: {
            width: '100%',
            padding: '8px',
            backgroundColor: '#FFC107',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
        },
    };

    return (
        <div style={styles.wrapper} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.container}>
                <div style={styles.body}>
                    <div style={styles.summaryBox}>
                        <div style={styles.title}>{t('optimize.issuesFound', { count: totalIssues })}</div>
                        <div style={styles.stats}>{t('optimize.severityError')}: {errorCount} | {t('optimize.severityWarning')}: {warningCount}</div>

                        <button style={styles.fixAllBtn} onClick={onFixAll}>
                            <span>✨</span> {t('optimize.fixAll')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FixMenu;
