import React from 'react';
import type { CollaborationState } from '../../contexts/CollaborationContext';
import type { Entity } from '../../lib/webgpu/EntityToVertices';
import { getStyles } from './PropertyPanel.styles';

interface PropertyPanelPropertiesTabProps {
  styles: ReturnType<typeof getStyles>;
  theme: 'dark' | 'light';
  selectedEntityIds: string[];
  selectedEntities: Entity[];
  isNestingMode: boolean;
  editOperationStatus: string | null;
  collaboration: CollaborationState;
  onDelete: () => void;
  onTrim: () => void;
  onExtend: () => void;
}

const PropertyPanelPropertiesTab: React.FC<PropertyPanelPropertiesTabProps> = ({
  styles,
  theme,
  selectedEntityIds,
  selectedEntities,
  isNestingMode,
  editOperationStatus,
  collaboration,
  onDelete,
  onTrim,
  onExtend,
}) => (
  <>
    <div style={styles.section}>
      <div style={styles.title}>📊 选择信息</div>
      {selectedEntityIds.length === 0 ? (
        <div style={styles.emptyState}>
          未选择实体<br />点击画布中的实体进行选择
        </div>
      ) : (
        <div>
          <div style={styles.label}>已选择实体数</div>
          <div style={styles.value}>{selectedEntityIds.length} 个</div>

          {selectedEntities.slice(0, 5).map(entity => (
            <div key={`${entity.fileId || 'unknown'}_${entity.id}`} style={styles.entityCard}>
              <div style={styles.label}>ID: {entity.id}</div>
              <div style={styles.value}>类型: {entity.type}</div>
              {entity.color && <div style={styles.value}>颜色: {entity.color}</div>}
            </div>
          ))}

          {selectedEntities.length > 5 && (
            <div style={styles.value}>...还有 {selectedEntities.length - 5} 个实体</div>
          )}
        </div>
      )}
    </div>

    {!isNestingMode && (
      <div style={styles.section}>
        <div style={styles.title}>✏️ 编辑工具</div>

        {editOperationStatus && (
          <div
            style={{
              ...styles.statusMessage,
              ...(editOperationStatus.includes('✅') ? styles.statusSuccess : {}),
              ...(editOperationStatus.includes('❌') ? styles.statusError : {}),
              ...(editOperationStatus.includes('⚠️') ? styles.statusWarning : {}),
            }}
          >
            {editOperationStatus}
          </div>
        )}

        {selectedEntityIds.length > 0 ? (
          <>
            <button
              style={{
                ...styles.button,
                ...(selectedEntityIds.length === 0 ? styles.buttonDisabled : {}),
              }}
              onClick={onDelete}
              disabled={selectedEntityIds.length === 0}
              onMouseEnter={(e) => {
                if (selectedEntityIds.length > 0) {
                  e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = styles.button.backgroundColor;
              }}
            >
              🗑️ 删除选中实体
            </button>

            <button
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(selectedEntityIds.length !== 1 ? styles.buttonDisabled : {}),
              }}
              onClick={onTrim}
              disabled={selectedEntityIds.length !== 1}
              onMouseEnter={(e) => {
                if (selectedEntityIds.length === 1) {
                  e.currentTarget.style.backgroundColor = styles.buttonSecondaryHover.backgroundColor;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = styles.buttonSecondary.backgroundColor;
              }}
            >
              ✂️ 修剪 (T)
            </button>

            <button
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(selectedEntityIds.length !== 1 ? styles.buttonDisabled : {}),
              }}
              onClick={onExtend}
              disabled={selectedEntityIds.length !== 1}
              onMouseEnter={(e) => {
                if (selectedEntityIds.length === 1) {
                  e.currentTarget.style.backgroundColor = styles.buttonSecondaryHover.backgroundColor;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = styles.buttonSecondary.backgroundColor;
              }}
            >
              📏 延伸 (E)
            </button>

            <div style={{ ...styles.label, marginTop: '12px' }}>快捷键提示:</div>
            <div style={styles.value}>T - 修剪工具</div>
            <div style={styles.value}>E - 延伸工具</div>
            <div style={styles.value}>Del/Backspace - 删除</div>
          </>
        ) : (
          <div style={styles.emptyState}>选择实体后启用工具</div>
        )}
      </div>
    )}

    {isNestingMode && (
      <div style={styles.section}>
        <div style={styles.title}>📦 排样工具</div>
        <div style={styles.value}>
          <div style={styles.label}>操作提示:</div>
          <div style={styles.value}>- 拖动零件移动位置</div>
          <div style={styles.value}>- Shift+拖动: 穿透模式</div>
          <div style={styles.value}>- 旋转按钮调整角度</div>
        </div>
      </div>
    )}

    <div style={styles.section}>
      <div style={styles.title}>
        👥 协同用户 {collaboration.isConnected && <span style={{ color: '#4caf50' }}>●</span>}
      </div>
      {!collaboration.isConnected ? (
        <div style={styles.emptyState}>连接中...</div>
      ) : (
        <>
          <div style={styles.value}>在线: {collaboration.remoteUsers.size + 1}</div>

          <div
            style={{
              padding: '4px 8px',
              marginBottom: '4px',
              backgroundColor: 'rgba(74, 158, 255, 0.1)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(74, 158, 255, 0.2)',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: collaboration.myColor || '#4a9eff',
              }}
            />
            <span style={{ ...styles.value, fontWeight: 'bold', marginBottom: 0 }}>
              {collaboration.myUsername || '你'} (自己)
            </span>
          </div>

          {Array.from(collaboration.remoteUsers.values()).map(user => (
            <div
              key={user.userId}
              style={{
                padding: '4px 8px',
                marginBottom: '4px',
                backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f0f0f0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: user.color,
                }}
              />
              <span style={{ ...styles.value, marginBottom: 0 }}>{user.username}</span>
            </div>
          ))}
        </>
      )}
    </div>
  </>
);

export default PropertyPanelPropertiesTab;
