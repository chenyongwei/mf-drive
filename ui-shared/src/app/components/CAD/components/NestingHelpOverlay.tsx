/**
 * Nesting Help Overlay Component
 *
 * Helpful hints and keyboard shortcuts for nesting mode:
 * - Contextual help based on selection
 * - Keyboard shortcut reference
 * - Mode indicators (penetration, snap status)
 */

import React from 'react';
export { ShortcutBar } from './NestingHelpOverlay.ShortcutBar';

interface NestingHelpOverlayProps {
  visible?: boolean;
  hasSelection?: boolean;
  isMultiSelect?: boolean;
  isPenetrationMode?: boolean;
  snappingEnabled?: boolean;
  theme?: 'light' | 'dark';
  position?: { x: number; y: number };
}

const shortcutGroups = [
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['Click'], action: 'Select part' },
      { keys: ['Ctrl+Click'], action: 'Toggle multi-select' },
      { keys: ['Drag'], action: 'Move selected part(s)' },
      { keys: ['Esc'], action: 'Deselect all' },
    ],
  },
  {
    title: 'Rotation',
    shortcuts: [
      { keys: ['A'], action: 'Rotate -90°' },
      { keys: ['D'], action: 'Rotate +90°' },
      { keys: ['Q'], action: 'Rotate -1°' },
      { keys: ['E'], action: 'Rotate +1°' },
    ],
  },
  {
    title: 'Mirroring',
    shortcuts: [
      { keys: ['W'], action: 'Mirror vertical' },
      { keys: ['S'], action: 'Mirror horizontal' },
    ],
  },
  {
    title: 'Special',
    shortcuts: [
      { keys: ['Shift+Drag'], action: 'Penetration mode (override collisions)' },
    ],
  },
];

/**
 * Single shortcut display
 */
const ShortcutItem: React.FC<{
  keys: string[];
  action: string;
}> = ({ keys, action }) => {
  const keyCombination = keys.join(' + ');
  return (
    <div className="shortcut-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
      <div className="keys" style={{ display: 'flex', gap: '4px', marginRight: '12px' }}>
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span style={{ color: '#9ca3af' }}>+</span>}
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#e5e7eb',
                minWidth: '20px',
                textAlign: 'center',
                display: 'inline-block',
              }}
              role="keyboard-key"
              aria-label={`Keyboard key: ${key}`}
            >
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
      <span style={{ fontSize: '12px', color: '#d1d5db' }}>{action}</span>
    </div>
  );
};

/**
 * Status badge component
 */
const StatusBadge: React.FC<{
  label: string;
  color: string;
  visible?: boolean;
}> = ({ label, color, visible = true }) => {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        backgroundColor: color,
        color: 'white',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        marginBottom: '8px',
      }}
    >
      {label}
    </div>
  );
};

/**
 * Main help overlay component
 */
export const NestingHelpOverlay: React.FC<NestingHelpOverlayProps> = ({
  visible = true,
  hasSelection = false,
  isMultiSelect = false,
  isPenetrationMode = false,
  snappingEnabled = true,
  theme = 'dark',
  position = { x: 20, y: 20 },
}) => {
  if (!visible) return null;

  const bgColor = theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const textColor = theme === 'dark' ? '#f3f4f6' : '#1f2937';
  const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <div
      role="complementary"
      aria-label="Nesting mode keyboard shortcuts"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '16px',
        color: textColor,
        fontSize: '13px',
        maxWidth: '280px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: '700', marginRight: '8px' }}>
          Manual Nesting
        </span>
        {isMultiSelect && (
          <StatusBadge label={`${hasSelection ? 'Multiple' : 'No'} parts selected`} color="#3b82f6" />
        )}
      </div>

      {/* Status badges */}
      <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <StatusBadge label={snappingEnabled ? 'Snapping ON' : 'Snapping OFF'} color={snappingEnabled ? '#22c55e' : '#6b7280'} />
        <StatusBadge label={isPenetrationMode ? 'Penetration Mode' : ''} color="#7c3aed" visible={isPenetrationMode} />
      </div>

      {/* Hint based on context */}
      {hasSelection && (
        <div
          style={{
            padding: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '12px',
          }}
        >
          {isMultiSelect
            ? `${hasSelection ? 'Multiple parts' : 'No part'} selected - use shortcuts to rotate/mirror all at once`
            : 'Part selected - drag to move, use shortcuts to rotate/mirror'}
        </div>
      )}

      {/* Keyboard shortcuts */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {shortcutGroups.map((group, index) => (
          <div key={index} style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#9ca3af',
                marginBottom: '6px',
              }}
            >
              {group.title}
            </div>
            {group.shortcuts.map((shortcut, shortcutIndex) => (
              <ShortcutItem
                key={shortcutIndex}
                keys={shortcut.keys}
                action={shortcut.action}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: `1px solid ${borderColor}`,
          fontSize: '11px',
          color: '#9ca3af',
          fontStyle: 'italic',
        }}
      >
        Parts snap to edges, corners, and centers automatically
      </div>
    </div>
  );
};

export default NestingHelpOverlay;
