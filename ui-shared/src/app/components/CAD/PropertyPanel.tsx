import React, { useState } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { useHistory } from '../../contexts/HistoryContext';
import { useEdit } from '../../contexts/EditContext';
import ValidationSection from './ValidationSection';
import OptimizationPanel from './OptimizationPanel';
import PropertyPanelHistoryTab from './PropertyPanelHistoryTab';
import PropertyPanelPropertiesTab from './PropertyPanelPropertiesTab';
import { getStyles } from './PropertyPanel.styles';
import { PropertyPanelProps } from './PropertyPanel.types';

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedEntityIds,
  entities,
  isNestingMode,
  selectedFileId,
  onIssueSelect,
  onHighlightEntities,
  onInspectionComplete,
  onReloadEntities,
  inspectionResult,
  theme = 'dark',
}) => {
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const collaboration = useCollaboration();
  const history = useHistory();
  const edit = useEdit();

  const [activeTab, setActiveTab] = useState<'properties' | 'history' | 'validation' | 'optimization'>('properties');
  const [editOperationStatus, setEditOperationStatus] = useState<string | null>(null);
  const selectedEntities = entities.filter((e) => selectedEntityIds.includes(e.id));

  const handleDelete = async () => {
    if (selectedEntityIds.length === 0) return;

    const entityId = selectedEntityIds[0];
    const fileId = entities.find((e) => e.id === entityId)?.fileId;

    if (!fileId) {
      setEditOperationStatus('错误: 无法确定文件 ID');
      setTimeout(() => setEditOperationStatus(null), 3000);
      return;
    }

    try {
      setEditOperationStatus('正在删除...');
      await edit.executeDelete(fileId, selectedEntityIds);
      setEditOperationStatus('✅ 删除成功');
      setTimeout(() => setEditOperationStatus(null), 2000);
    } catch (error) {
      console.error('Delete failed:', error);
      setEditOperationStatus('❌ 删除失败');
      setTimeout(() => setEditOperationStatus(null), 3000);
    }
  };

  const handleTrim = () => {
    if (selectedEntityIds.length === 0) return;
    setEditOperationStatus('✂️ 修剪模式: 请选择修剪边界实体');
    edit.setEditOperation({ step: 'select_boundary', boundaryEntityId: null });
    setTimeout(() => setEditOperationStatus(null), 3000);
  };

  const handleExtend = () => {
    if (selectedEntityIds.length === 0) return;
    setEditOperationStatus('📏 延伸模式: 请选择目标实体');
    edit.setEditOperation({ step: 'select_boundary', boundaryEntityId: null });
    setTimeout(() => setEditOperationStatus(null), 3000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabContainer}>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'properties' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('properties')}
        >
          📊 属性
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'history' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('history')}
        >
          📜 历史
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'validation' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('validation')}
        >
          🔍 检测
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'optimization' ? styles.tabActive : {}),
            position: 'relative',
          }}
          onClick={() => setActiveTab('optimization')}
        >
          🔧 优化
          {inspectionResult && inspectionResult.issues.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#FFC107',
                borderRadius: '50%',
                border: `1px solid ${theme === 'dark' ? '#1a1a1a' : '#fff'}`,
              }}
            />
          )}
        </div>
      </div>

      <div style={styles.tabContent}>
        {activeTab === 'properties' ? (
          <PropertyPanelPropertiesTab
            styles={styles}
            theme={theme}
            selectedEntityIds={selectedEntityIds}
            selectedEntities={selectedEntities}
            isNestingMode={isNestingMode}
            editOperationStatus={editOperationStatus}
            collaboration={collaboration}
            onDelete={handleDelete}
            onTrim={handleTrim}
            onExtend={handleExtend}
          />
        ) : activeTab === 'validation' ? (
          <div style={styles.section}>
            <ValidationSection
              fileId={selectedFileId || null}
              onIssueSelect={onIssueSelect}
              onHighlightEntities={onHighlightEntities}
              onInspectionComplete={onInspectionComplete}
              onQuickFix={() => {
                setActiveTab('optimization');
              }}
            />
          </div>
        ) : activeTab === 'optimization' ? (
          <div style={styles.section}>
            <OptimizationPanel
              fileId={selectedFileId || null}
              selectedEntityIds={selectedEntityIds}
              selectedEntities={selectedEntityIds
                .map((id) => entities.find((e) => e.id === id))
                .filter(Boolean)}
              onOptimizationApplied={(_, modifiedFileIds) => {
                if (onReloadEntities && modifiedFileIds && modifiedFileIds.length > 0) {
                  console.log('🔄 Reloading entities for files:', modifiedFileIds);
                  onReloadEntities(modifiedFileIds);
                }
              }}
            />
          </div>
        ) : (
          <PropertyPanelHistoryTab
            styles={styles}
            historyState={history.historyState}
            isLoading={history.isLoading}
            error={history.error}
          />
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;
