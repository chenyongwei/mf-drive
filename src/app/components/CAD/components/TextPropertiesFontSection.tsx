import React from 'react';
import type { FontInfo } from '../../../services/fontsApi';
import type { TextUpdatePayload } from './TextPropertiesPanel.types';

interface TextPropertiesFontSectionProps {
  theme: 'dark' | 'light';
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  inputBackground: string;
  form: TextUpdatePayload;
  setForm: React.Dispatch<React.SetStateAction<TextUpdatePayload>>;
  fonts: FontInfo[];
  isAuthenticated: boolean;
  isUploading: boolean;
  selectedFont: FontInfo | null;
  canDeleteSelectedFont: boolean;
  onUploadFont: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteSelectedFont: () => Promise<void>;
}

export const TextPropertiesFontSection: React.FC<TextPropertiesFontSectionProps> = ({
  theme,
  textColor,
  mutedTextColor,
  borderColor,
  inputBackground,
  form,
  setForm,
  fonts,
  isAuthenticated,
  isUploading,
  selectedFont,
  canDeleteSelectedFont,
  onUploadFont,
  onDeleteSelectedFont,
}) => (
  <>
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: mutedTextColor }}>字体</span>
      <select
        value={form.fontId}
        onChange={(event) => {
          const fontId = event.target.value;
          const font = fonts.find((item) => item.id === fontId);
          setForm((prev) => ({ ...prev, fontId, fontFamily: font?.family ?? prev.fontFamily }));
        }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 6,
          border: borderColor,
          background: inputBackground,
          color: textColor,
          padding: '6px 8px',
        }}
      >
        {fonts.map((font) => (
          <option key={font.id} value={font.id}>
            {font.family} · {font.source}
          </option>
        ))}
      </select>
    </label>

    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, color: mutedTextColor }}>字体管理</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label
          style={{
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px 10px',
            borderRadius: 6,
            border: borderColor,
            background: inputBackground,
            color: isAuthenticated ? textColor : mutedTextColor,
            cursor: isAuthenticated ? 'pointer' : 'not-allowed',
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          上传字体
          <input
            type="file"
            accept=".ttf,.otf,.woff2"
            disabled={!isAuthenticated || isUploading}
            onChange={(event) => void onUploadFont(event)}
            style={{ display: 'none' }}
          />
        </label>
        {!isAuthenticated && <span style={{ fontSize: 12, color: mutedTextColor }}>未登录时不可上传</span>}
      </div>
      {selectedFont && canDeleteSelectedFont && (
        <button
          type="button"
          onClick={() => void onDeleteSelectedFont()}
          style={{
            justifySelf: 'start',
            padding: '5px 10px',
            borderRadius: 6,
            border: borderColor,
            background: theme === 'dark' ? 'rgba(127,29,29,0.55)' : 'rgba(254,226,226,0.9)',
            color: theme === 'dark' ? '#fecaca' : '#991b1b',
            cursor: 'pointer',
          }}
        >
          删除当前私有字体
        </button>
      )}
    </div>
  </>
);
