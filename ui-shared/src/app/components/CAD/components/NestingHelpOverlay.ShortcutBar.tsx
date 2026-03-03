import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEditableNumberInput } from './useEditableNumberInput';

const CompactNumberInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  theme: 'light' | 'dark';
  step?: number;
  min?: number;
  width?: number;
  disabled?: boolean;
}> = ({
  value,
  onChange,
  theme,
  step = 0.1,
  min = 0,
  width = 45,
  disabled = false,
}) => {
  const { isStale, displayValue, handleChange, handleFocus, handleBlur } = useEditableNumberInput({
    value,
    onValidChange: onChange,
  });

  const normalTextColor = theme === 'dark' ? '#fff' : '#000';
  const staleTextColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

  return (
    <input
      type="number"
      step={step}
      min={min}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        width: `${width}px`,
        height: '20px',
        backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.5)',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        borderRadius: '4px',
        color: isStale ? staleTextColor : normalTextColor,
        fontSize: '11px',
        textAlign: 'center',
        padding: '0 2px',
        margin: '0 2px',
        outline: 'none',
        transition: 'color 0.2s',
        opacity: disabled ? 0.55 : 1,
      }}
    />
  );
};

export const ShortcutBar: React.FC<{
  visible?: boolean;
  theme?: 'light' | 'dark';
  rotationStep?: number;
  onRotationStepChange?: (val: number) => void;
}> = ({
  visible = true,
  theme = 'dark',
  rotationStep = 1,
  onRotationStepChange,
}) => {
  const { t } = useTranslation();
  if (!visible) return null;

  const bgColor = theme === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const textColor = theme === 'dark' ? '#f3f4f6' : '#1f2937';

  const shortcuts = [
    { key: 'A/D', desc: t('nestingHelp.shortcutBar.rotate90') },
    { key: 'Q/E', desc: t('nestingHelp.shortcutBar.rotate'), hasInput: true },
    { key: 'W/S', desc: t('nestingHelp.shortcutBar.mirror') },
    { key: 'Shift+Drag', desc: t('nestingHelp.shortcutBar.penetration') },
  ];

  return (
    <div
      role="toolbar"
      aria-label={t('nestingHelp.shortcutBar.ariaLabel')}
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '16px',
        padding: '8px 16px',
        backgroundColor: bgColor,
        borderRadius: '20px',
        border: '1px solid rgba(107, 114, 128, 0.3)',
        color: textColor,
        fontSize: '12px',
        pointerEvents: 'auto',
        userSelect: 'none',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
      }}
    >
      {shortcuts.map((shortcut, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <kbd
            style={{
              padding: '2px 6px',
              backgroundColor: 'rgba(107, 114, 128, 0.3)',
              border: '1px solid rgba(107, 114, 128, 0.5)',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: '600',
            }}
            role="keyboard-key"
            aria-label={`Keyboard shortcut: ${shortcut.key} for ${shortcut.desc}`}
          >
            {shortcut.key}
          </kbd>
          <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {shortcut.desc}
            {shortcut.hasInput && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <CompactNumberInput
                  value={rotationStep}
                  onChange={(val) => onRotationStepChange?.(val)}
                  theme={theme}
                />
                °
              </span>
            )}
          </span>
          {index < shortcuts.length - 1 && <span style={{ color: '#4b5563', paddingLeft: '8px' }}>|</span>}
        </div>
      ))}
    </div>
  );
};
