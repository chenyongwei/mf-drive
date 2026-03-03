const LAST_USED_TEXT_FONT_ID_KEY = "cad-text-last-used-font-id";
const LAST_USED_TEXT_FONT_FAMILY_KEY = "cad-text-last-used-font-family";

export interface LastUsedTextFontPreference {
  fontId: string | null;
  fontFamily: string | null;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getLastUsedTextFontPreference(): LastUsedTextFontPreference {
  if (!canUseStorage()) {
    return { fontId: null, fontFamily: null };
  }

  try {
    const fontIdRaw = window.localStorage.getItem(LAST_USED_TEXT_FONT_ID_KEY);
    const fontFamilyRaw = window.localStorage.getItem(LAST_USED_TEXT_FONT_FAMILY_KEY);
    const fontId = fontIdRaw && fontIdRaw.trim().length > 0 ? fontIdRaw.trim() : null;
    const fontFamily =
      fontFamilyRaw && fontFamilyRaw.trim().length > 0 ? fontFamilyRaw.trim() : null;
    return { fontId, fontFamily };
  } catch {
    return { fontId: null, fontFamily: null };
  }
}

export function setLastUsedTextFontPreference(
  fontId: string,
  fontFamily?: string | null,
): void {
  if (!canUseStorage()) {
    return;
  }

  const normalizedFontId = String(fontId ?? "").trim();
  if (!normalizedFontId) {
    return;
  }

  try {
    window.localStorage.setItem(LAST_USED_TEXT_FONT_ID_KEY, normalizedFontId);
    const normalizedFamily = String(fontFamily ?? "").trim();
    if (normalizedFamily.length > 0) {
      window.localStorage.setItem(
        LAST_USED_TEXT_FONT_FAMILY_KEY,
        normalizedFamily,
      );
    } else {
      window.localStorage.removeItem(LAST_USED_TEXT_FONT_FAMILY_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

