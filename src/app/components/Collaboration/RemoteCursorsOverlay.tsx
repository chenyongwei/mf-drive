/**
 * Remote Cursors Overlay Component
 *
 * Displays remote users' cursors on the canvas
 * Shows username and cursor position with smooth animation
 */

import React from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';

const styles = {
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    zIndex: 2000,
    overflow: 'hidden' as const,
  },
  cursor: (color: string) => ({
    position: 'absolute' as const,
    pointerEvents: 'none' as const,
    transition: 'all 0.1s ease-out',
  }),
  cursorIcon: {
    width: 0,
    height: 0,
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
    borderBottom: '18px solid',
    transform: 'rotate(-30deg)',
  },
  label: {
    position: 'absolute' as const,
    top: '24px', // Moved down slightly to avoid covering cursor icon
    left: '16px',
    padding: '4px 10px', // Increased padding
    fontSize: '13px', // Increased font size
    fontWeight: 'bold' as const,
    color: '#ffffff',
    borderRadius: '4px',
    whiteSpace: 'nowrap' as const,
    pointerEvents: 'none' as const,
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)', // Added shadow
    textShadow: '0 1px 2px rgba(0,0,0,0.5)', // Added text shadow
    zIndex: 2001,
  },
};

const RemoteCursorsOverlay: React.FC = () => {
  const { remoteCursors, remoteUsers } = useCollaboration();

  return (
    <div style={styles.overlay}>
      {Array.from(remoteCursors.entries()).map(([userId, position]) => {
        const user = remoteUsers.get(userId);
        if (!user) return null;

        return (
          <div
            key={userId}
            style={{
              ...styles.cursor(user.color),
              left: position.x,
              top: position.y,
            }}
          >
            {/* Cursor icon */}
            <div style={{
              ...styles.cursorIcon,
              borderBottomColor: user.color,
            }} />

            {/* Username label */}
            <div
              style={{
                ...styles.label,
                backgroundColor: user.color,
              }}
            >
              {user.username}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RemoteCursorsOverlay;
