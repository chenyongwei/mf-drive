import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FontApiError,
  FontInfo,
  deleteFont,
  listFonts,
  uploadFont,
} from '../../../services/fontsApi';
import {
  getLastUsedTextFontPreference,
  setLastUsedTextFontPreference,
} from '../../../services/textFontPreferences';
import { TextPropertiesForm } from './TextPropertiesForm';
import {
  DEFAULT_PAYLOAD,
  type TextPropertiesPanelProps,
  type TextUpdatePayload,
} from './TextPropertiesPanel.types';
import {
  derivePayload,
  radiansToDegrees,
} from './TextPropertiesPanel.utils';

export type { TextUpdatePayload } from './TextPropertiesPanel.types';

export const TextPropertiesPanel: React.FC<TextPropertiesPanelProps> = ({
  theme = 'dark',
  selectedEntity,
  currentUserId,
  isAuthenticated = false,
  onApply,
  onToast,
}) => {
  const [fonts, setFonts] = useState<FontInfo[]>([]);
  const [isLoadingFonts, setIsLoadingFonts] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUsedFontPreference, setLastUsedFontPreferenceState] = useState(() =>
    getLastUsedTextFontPreference(),
  );
  const [form, setForm] = useState<TextUpdatePayload>(DEFAULT_PAYLOAD);

  const selectedEntityId = selectedEntity?.id ?? '';
  const selectedEntityType = String(selectedEntity?.type ?? '').toUpperCase();
  const hasValidSelection = selectedEntityType === 'TEXT' || selectedEntityType === 'MTEXT';
  const selectedPayload = useMemo(
    () => (hasValidSelection ? derivePayload(selectedEntity) : null),
    [hasValidSelection, selectedEntity],
  );

  const textColor = theme === 'dark' ? '#e2e8f0' : '#0f172a';
  const mutedTextColor = theme === 'dark' ? '#94a3b8' : '#475569';
  const borderColor = theme === 'dark' ? '1px solid rgba(148,163,184,0.35)' : '1px solid rgba(15,23,42,0.15)';
  const inputBackground = theme === 'dark' ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.95)';

  const refreshFonts = useCallback(async () => {
    setIsLoadingFonts(true);
    try {
      const nextFonts = await listFonts();
      setFonts(nextFonts);
    } catch (error) {
      if (error instanceof FontApiError) {
        onToast?.(`字体列表加载失败：${error.message}`, 'error');
      } else {
        onToast?.('字体列表加载失败', 'error');
      }
    } finally {
      setIsLoadingFonts(false);
    }
  }, [onToast]);

  useEffect(() => {
    void refreshFonts();
  }, [refreshFonts]);

  useEffect(() => {
    if (!selectedPayload) {
      setForm({
        ...DEFAULT_PAYLOAD,
        fontId: lastUsedFontPreference.fontId ?? DEFAULT_PAYLOAD.fontId,
        fontFamily: lastUsedFontPreference.fontFamily ?? DEFAULT_PAYLOAD.fontFamily,
      });
      return;
    }
    setForm(selectedPayload);
  }, [selectedPayload, lastUsedFontPreference.fontId, lastUsedFontPreference.fontFamily]);

  useEffect(() => {
    if (fonts.length === 0) {
      return;
    }
    setForm((prev) => {
      const current = fonts.find((font) => font.id === prev.fontId);
      if (current) {
        return { ...prev, fontFamily: current.family };
      }
      const preferredFontId = selectedPayload?.fontId ?? lastUsedFontPreference.fontId ?? null;
      const preferredFont = preferredFontId ? fonts.find((font) => font.id === preferredFontId) ?? null : null;
      const fallbackFont = preferredFont ?? fonts[0];
      return {
        ...prev,
        fontId: fallbackFont.id,
        fontFamily: fallbackFont.family,
      };
    });
  }, [fonts, lastUsedFontPreference.fontId, selectedPayload?.fontId]);

  const canDeleteFont = useCallback(
    (font: FontInfo) => {
      if (font.source !== 'user' || !font.ownerUserId) {
        return false;
      }
      return String(font.ownerUserId) === String(currentUserId ?? '');
    },
    [currentUserId],
  );

  const handleApply = useCallback(async () => {
    if (!hasValidSelection || !selectedEntityId) {
      onToast?.('请选择单个文字实体', 'warning');
      return;
    }
    const content = form.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (content.trim().length === 0) {
      onToast?.('文字内容不能为空', 'warning');
      return;
    }

    const payload: TextUpdatePayload = {
      ...form,
      content,
      fontSize: Math.max(1, Number(form.fontSize)),
      lineHeight: Math.max(0.8, Number(form.lineHeight)),
      tolerance: Math.max(0.01, Number(form.tolerance)),
    };

    setIsApplying(true);
    try {
      await onApply(payload);
      setLastUsedTextFontPreference(payload.fontId, payload.fontFamily ?? form.fontFamily);
      setLastUsedFontPreferenceState({
        fontId: payload.fontId,
        fontFamily: payload.fontFamily ?? form.fontFamily,
      });
      onToast?.('文字属性已更新', 'success');
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        onToast?.(`文字更新失败：${error.message}`, 'error');
      } else {
        onToast?.('文字更新失败', 'error');
      }
    } finally {
      setIsApplying(false);
    }
  }, [form, hasValidSelection, onApply, onToast, selectedEntityId]);

  const handleUploadFont = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) {
        return;
      }
      if (!isAuthenticated) {
        onToast?.('请先登录后上传字体', 'warning');
        return;
      }

      setIsUploading(true);
      try {
        const nextFont = await uploadFont(file);
        onToast?.(`字体上传成功：${nextFont.family}`, 'success');
        await refreshFonts();
        setForm((prev) => ({ ...prev, fontId: nextFont.id, fontFamily: nextFont.family }));
        setLastUsedTextFontPreference(nextFont.id, nextFont.family);
        setLastUsedFontPreferenceState({ fontId: nextFont.id, fontFamily: nextFont.family });
      } catch (error) {
        if (error instanceof FontApiError) {
          const reason =
            error.errorCode === 'AUTH_REQUIRED'
              ? '请先登录'
              : error.errorCode === 'FONT_FORMAT_UNSUPPORTED'
                ? '字体格式不支持，仅支持 TTF/OTF/WOFF2'
                : error.errorCode === 'FONT_FILE_TOO_LARGE'
                  ? '字体文件超过 20MB 限制'
                  : error.errorCode === 'FONT_API_NOT_AVAILABLE'
                    ? '字体服务暂不可用，请稍后重试'
                    : error.errorCode === 'FONT_PARSE_FAILED'
                      ? '字体解析失败'
                      : error.errorCode === 'CENTERLINE_BUILD_FAILED'
                        ? '中心线生成失败'
                        : error.message;
          onToast?.(`字体上传失败：${reason}`, 'error');
        } else {
          onToast?.('字体上传失败', 'error');
        }
      } finally {
        setIsUploading(false);
      }
    },
    [isAuthenticated, onToast, refreshFonts],
  );

  const selectedFont = useMemo(() => fonts.find((font) => font.id === form.fontId) ?? null, [fonts, form.fontId]);
  const rotationDegrees = useMemo(() => Number(radiansToDegrees(form.rotation).toFixed(4)), [form.rotation]);
  const canDeleteSelectedFont = selectedFont ? canDeleteFont(selectedFont) : false;

  const handleDeleteSelectedFont = useCallback(async () => {
    if (!selectedFont || !canDeleteSelectedFont) {
      return;
    }
    try {
      await deleteFont(selectedFont.id);
      onToast?.('字体已删除', 'success');
      await refreshFonts();
    } catch {
      onToast?.('字体删除失败', 'error');
    }
  }, [canDeleteSelectedFont, onToast, refreshFonts, selectedFont]);

  return (
    <TextPropertiesForm
      theme={theme}
      hasValidSelection={hasValidSelection}
      form={form}
      setForm={setForm}
      fonts={fonts}
      selectedFont={selectedFont}
      canDeleteSelectedFont={canDeleteSelectedFont}
      onDeleteSelectedFont={handleDeleteSelectedFont}
      onUploadFont={handleUploadFont}
      isAuthenticated={isAuthenticated}
      isUploading={isUploading}
      isApplying={isApplying}
      isLoadingFonts={isLoadingFonts}
      rotationDegrees={rotationDegrees}
      textColor={textColor}
      mutedTextColor={mutedTextColor}
      borderColor={borderColor}
      inputBackground={inputBackground}
      onApply={() => void handleApply()}
    />
  );
};

export default TextPropertiesPanel;
