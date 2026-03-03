import React from 'react';
import type { FontInfo } from '../../../services/fontsApi';
import type { TextUpdatePayload } from './TextPropertiesPanel.types';
import { degreesToRadians, toFiniteNumber } from './TextPropertiesPanel.utils';
import { TextPropertiesFontSection } from './TextPropertiesFontSection';

interface TextPropertiesFormProps {
  theme: 'dark' | 'light';
  hasValidSelection: boolean;
  form: TextUpdatePayload;
  setForm: React.Dispatch<React.SetStateAction<TextUpdatePayload>>;
  fonts: FontInfo[];
  selectedFont: FontInfo | null;
  canDeleteSelectedFont: boolean;
  onDeleteSelectedFont: () => Promise<void>;
  onUploadFont: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isAuthenticated: boolean;
  isUploading: boolean;
  isApplying: boolean;
  isLoadingFonts: boolean;
  rotationDegrees: number;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  inputBackground: string;
  onApply: () => void;
}

export const TextPropertiesForm: React.FC<TextPropertiesFormProps> = ({
  theme,
  hasValidSelection,
  form,
  setForm,
  fonts,
  selectedFont,
  canDeleteSelectedFont,
  onDeleteSelectedFont,
  onUploadFont,
  isAuthenticated,
  isUploading,
  isApplying,
  isLoadingFonts,
  rotationDegrees,
  textColor,
  mutedTextColor,
  borderColor,
  inputBackground,
  onApply,
}) => (
  <div
    style={{
      padding: 14,
      paddingRight: 18,
      boxSizing: 'border-box',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      color: textColor,
      display: 'grid',
      gap: 10,
    }}
  >
    <div style={{ fontSize: 14, fontWeight: 600 }}>文字属性</div>
    {!hasValidSelection && (
      <div style={{ fontSize: 12, color: mutedTextColor }}>请选择单个 TEXT/MTEXT 实体后编辑。</div>
    )}
    {hasValidSelection && (
      <>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, color: mutedTextColor }}>内容</span>
          <textarea
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            rows={5}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: 96,
              borderRadius: 6,
              border: borderColor,
              background: inputBackground,
              color: textColor,
              padding: '6px 8px',
            }}
          />
        </label>

        <TextPropertiesFontSection
          theme={theme}
          textColor={textColor}
          mutedTextColor={mutedTextColor}
          borderColor={borderColor}
          inputBackground={inputBackground}
          form={form}
          setForm={setForm}
          fonts={fonts}
          isAuthenticated={isAuthenticated}
          isUploading={isUploading}
          selectedFont={selectedFont}
          canDeleteSelectedFont={canDeleteSelectedFont}
          onUploadFont={onUploadFont}
          onDeleteSelectedFont={onDeleteSelectedFont}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: mutedTextColor }}>字号</span>
            <input
              type="number"
              min={1}
              max={300}
              value={form.fontSize}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fontSize: toFiniteNumber(event.target.value, prev.fontSize) }))
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: 6,
                border: borderColor,
                background: inputBackground,
                color: textColor,
                padding: '6px 8px',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: mutedTextColor }}>行高</span>
            <input
              type="number"
              min={0.8}
              max={5}
              step={0.1}
              value={form.lineHeight}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  lineHeight: toFiniteNumber(event.target.value, prev.lineHeight),
                }))
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: 6,
                border: borderColor,
                background: inputBackground,
                color: textColor,
                padding: '6px 8px',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: mutedTextColor }}>旋转(°)</span>
            <input
              type="number"
              step={90}
              value={rotationDegrees}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  rotation: degreesToRadians(toFiniteNumber(event.target.value, rotationDegrees)),
                }))
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: 6,
                border: borderColor,
                background: inputBackground,
                color: textColor,
                padding: '6px 8px',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: mutedTextColor }}>单双线</span>
            <select
              value={form.lineMode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lineMode: event.target.value === 'single' ? 'single' : 'double' }))
              }
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
              <option value="single">单线</option>
              <option value="double">双线</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: mutedTextColor }}>水平对齐</span>
            <select
              value={form.alignH}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, alignH: event.target.value as TextUpdatePayload['alignH'] }))
              }
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
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: mutedTextColor }}>垂直对齐</span>
            <select
              value={form.alignV}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, alignV: event.target.value as TextUpdatePayload['alignV'] }))
              }
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
              <option value="top">顶部</option>
              <option value="middle">居中</option>
              <option value="baseline">基线</option>
              <option value="bottom">底部</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onApply}
          disabled={isApplying || isLoadingFonts}
          style={{
            marginTop: 4,
            padding: '8px 12px',
            borderRadius: 7,
            border: '1px solid rgba(37,99,235,0.7)',
            background: '#2563eb',
            color: '#fff',
            cursor: isApplying ? 'wait' : 'pointer',
            opacity: isApplying ? 0.7 : 1,
          }}
        >
          {isApplying ? '应用中...' : '应用到当前文字'}
        </button>
      </>
    )}
  </div>
);
