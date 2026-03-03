import React from 'react';
import { useCollaboration } from '../../../contexts/CollaborationContext';

interface CollaborationOverlayProps {
  theme?: 'dark' | 'light';
}

const CollaborationOverlay: React.FC<CollaborationOverlayProps> = ({ theme = 'dark' }) => {
  const collaboration = useCollaboration();

  const styles = {
    container: {
      position: 'absolute' as const,
      bottom: '10px',
      right: '10px',
      padding: '8px 12px',
      backgroundColor: theme === 'dark' ? 'rgba(42, 42, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '12px',
      color: theme === 'dark' ? '#eee' : '#333',
      zIndex: 100,
      backdropFilter: 'blur(4px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      pointerEvents: 'auto' as const,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: 'bold' as const,
      marginBottom: '2px',
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: collaboration.isConnected ? '#4caf50' : '#ff9800',
    },
    userItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 0',
    },
    userColor: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
    },
    count: {
      color: theme === 'dark' ? '#888' : '#666',
      fontSize: '11px',
    }
  };

  if (!collaboration.isConnected) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.header, color: '#ff9800' }}>
          ⚠️ 协同连接中...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.header,
        borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #eee',
        paddingBottom: '6px',
        marginBottom: '4px',
        justifyContent: 'space-between',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: theme === 'dark' ? '#888' : '#666',
      }}>
        <span>协同在线</span>
        <span style={styles.count}>
          {collaboration.remoteUsers.size + 1} 位用户
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {Array.from(collaboration.remoteUsers.values()).map(user => (
          <div key={user.userId} style={styles.userItem}>
            <div style={{ ...styles.userColor, backgroundColor: user.color }} />
            <span style={{ fontWeight: 'bold' }}>{user.username}</span>
          </div>
        ))}

        <div style={styles.userItem}>
          <div style={{ ...styles.userColor, backgroundColor: collaboration.myColor || '#4a9eff' }} />
          <span style={{ fontWeight: 'bold' }}>{collaboration.myUsername || '你'} (自己)</span>
        </div>
      </div>
    </div>
  );
};

export default CollaborationOverlay;
