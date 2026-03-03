import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { LanguageIconBase, ThemeIconBase } from '../app/components/CAD/components/AppearanceIcons';
import i18nInstance from '../app/i18n/i18n';
import { getMfThemeMode, setMfThemeMode, subscribeMfTheme, type MfThemeMode } from '../mf-theme';

const LANGUAGE_ORDER = ['en', 'ja', 'zh-TW', 'zh-CN'] as const;
const LANGUAGE_LABEL: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
};

type AppearanceControlsProps = {
  appId: string;
};

function normalizeLanguage(raw: string): (typeof LANGUAGE_ORDER)[number] {
  const value = (raw || '').trim();
  if (value === 'zh-Hant') {
    return 'zh-TW';
  }
  if (value === 'zh-Hans' || value === 'zh') {
    return 'zh-CN';
  }
  for (const candidate of LANGUAGE_ORDER) {
    if (value === candidate || value.startsWith(`${candidate}-`)) {
      return candidate;
    }
  }
  return 'en';
}

function nextLanguage(current: string): (typeof LANGUAGE_ORDER)[number] {
  const normalized = normalizeLanguage(current);
  const index = LANGUAGE_ORDER.indexOf(normalized);
  return LANGUAGE_ORDER[(index + 1) % LANGUAGE_ORDER.length];
}

function isMiniPage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  if (new URLSearchParams(window.location.search).get('mfDockMini') === '1') {
    return true;
  }
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function shellStyle(miniPage: boolean): CSSProperties {
  return {
    position: 'fixed',
    top: 12,
    right: miniPage ? 12 : 'calc(var(--mf-dock-fixed-width, 72px) + 12px)',
    zIndex: 1400,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    pointerEvents: 'auto',
  };
}

function buttonStyle(themeMode: MfThemeMode, hovered: boolean): CSSProperties {
  const isDark = themeMode === 'dark';
  return {
    width: 30,
    height: 30,
    borderRadius: 3,
    border: 'none',
    background: hovered ? (isDark ? '#333' : '#f0f0f0') : 'transparent',
    color: isDark ? '#eee' : '#333',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  };
}

export function AppAppearanceControls({ appId }: AppearanceControlsProps) {
  const [themeMode, setThemeModeState] = useState<MfThemeMode>(() => getMfThemeMode());
  const [language, setLanguage] = useState<string>(() => i18nInstance.language);
  const [hoveredItem, setHoveredItem] = useState<'language' | 'theme' | null>(null);
  const miniPage = useMemo(() => isMiniPage(), []);
  const lang = normalizeLanguage(language);
  const isDark = themeMode === 'dark';
  const iconStroke = isDark ? '#eee' : '#333';
  const langLabel = LANGUAGE_LABEL[lang] ?? LANGUAGE_LABEL.en;

  useEffect(() => {
    return subscribeMfTheme((nextMode) => {
      setThemeModeState(nextMode);
    });
  }, []);

  useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      setLanguage(nextLanguage);
    };
    i18nInstance.on('languageChanged', handleLanguageChanged);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  function handleLanguageToggle(): void {
    const next = nextLanguage(i18nInstance.language);
    void i18nInstance.changeLanguage(next);
  }

  function handleThemeToggle(): void {
    setMfThemeMode(themeMode === 'dark' ? 'light' : 'dark', { appId });
  }

  return (
    <div style={shellStyle(miniPage)} data-testid="app-appearance-controls">
      <button
        type="button"
        style={buttonStyle(themeMode, hoveredItem === 'language')}
        onClick={handleLanguageToggle}
        onMouseEnter={() => setHoveredItem('language')}
        onMouseLeave={() => setHoveredItem(null)}
        title={`语言: ${langLabel}（点击切换）`}
        aria-label="切换语言"
        data-testid="app-language-toggle"
      >
        <LanguageIconBase stroke={iconStroke} />
      </button>
      <button
        type="button"
        style={buttonStyle(themeMode, hoveredItem === 'theme')}
        onClick={handleThemeToggle}
        onMouseEnter={() => setHoveredItem('theme')}
        onMouseLeave={() => setHoveredItem(null)}
        title={isDark ? '深色模式（点击切换）' : '浅色模式（点击切换）'}
        aria-label="切换主题"
        data-testid="app-theme-toggle"
      >
        <ThemeIconBase stroke={iconStroke} isDark={isDark} />
      </button>
    </div>
  );
}
