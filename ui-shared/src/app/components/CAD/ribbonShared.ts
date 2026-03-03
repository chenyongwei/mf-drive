import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

export type RibbonLanguage = "en" | "ja" | "zh-TW" | "zh-CN";

type RibbonWidthValue = { expanded: number; collapsed: number } | number;

export type RibbonWidthConfig<TKey extends string> = Record<TKey, RibbonWidthValue> &
  Record<string, RibbonWidthValue>;

const RIBBON_LANGUAGES: readonly RibbonLanguage[] = ["en", "ja", "zh-TW", "zh-CN"];

function createVisibleMap<TKey extends string>(keys: readonly TKey[]): Record<TKey, boolean> {
  return keys.reduce((map, key) => {
    map[key] = true;
    return map;
  }, {} as Record<TKey, boolean>);
}

export function calculateRibbonVisibility<TKey extends string>(
  width: number,
  widthConfig: RibbonWidthConfig<TKey>,
  hideOrder: readonly TKey[],
): Record<TKey, boolean> {
  const visibility = createVisibleMap(hideOrder);
  if (width <= 0) {
    return visibility;
  }

  let currentWidth = Object.values(widthConfig).reduce((sum, value) => {
    if (typeof value === "number") {
      return sum + value;
    }
    return sum + value.expanded;
  }, 0);

  if (currentWidth <= width) {
    return visibility;
  }

  for (const key of hideOrder) {
    visibility[key] = false;
    const widthValue = widthConfig[key];
    if (typeof widthValue !== "number") {
      currentWidth -= widthValue.expanded - widthValue.collapsed;
    }
    if (currentWidth <= width) {
      break;
    }
  }

  return visibility;
}

interface UseResponsiveRibbonVisibilityOptions<TKey extends string> {
  containerRef: RefObject<HTMLDivElement | null>;
  widthConfig: RibbonWidthConfig<TKey>;
  hideOrder: readonly TKey[];
  language: string;
}

export function useResponsiveRibbonVisibility<TKey extends string>({
  containerRef,
  widthConfig,
  hideOrder,
  language,
}: UseResponsiveRibbonVisibilityOptions<TKey>): Record<TKey, boolean> {
  const initialMeasureTimeoutRef = useRef<number | null>(null);
  const [visibility, setVisibility] = useState<Record<TKey, boolean>>(() =>
    createVisibleMap(hideOrder),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const syncVisibility = (nextWidth: number) => {
      if (nextWidth <= 0) {
        return;
      }
      setVisibility(calculateRibbonVisibility(nextWidth, widthConfig, hideOrder));
    };

    const updateFromContainer = () => {
      syncVisibility(container.clientWidth);
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        syncVisibility(entry.contentRect.width);
      }
    });

    observer.observe(container);
    updateFromContainer();
    const rafId = window.requestAnimationFrame(updateFromContainer);
    initialMeasureTimeoutRef.current = window.setTimeout(updateFromContainer, 160);
    window.addEventListener("resize", updateFromContainer);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(rafId);
      if (initialMeasureTimeoutRef.current !== null) {
        window.clearTimeout(initialMeasureTimeoutRef.current);
        initialMeasureTimeoutRef.current = null;
      }
      window.removeEventListener("resize", updateFromContainer);
    };
  }, [containerRef, widthConfig, hideOrder]);

  useEffect(() => {
    const width = containerRef.current?.clientWidth ?? 0;
    if (width <= 0) {
      return;
    }
    setVisibility(calculateRibbonVisibility(width, widthConfig, hideOrder));
  }, [containerRef, hideOrder, language, widthConfig]);

  return visibility;
}

export function getNextRibbonLanguage(currentLanguage: string): RibbonLanguage {
  const normalized: RibbonLanguage = RIBBON_LANGUAGES.includes(currentLanguage as RibbonLanguage)
    ? (currentLanguage as RibbonLanguage)
    : "en";
  const index = RIBBON_LANGUAGES.indexOf(normalized);
  return RIBBON_LANGUAGES[(index + 1) % RIBBON_LANGUAGES.length];
}

export function getRibbonContainerStyle(theme: "dark" | "light"): CSSProperties {
  return {
    display: "flex",
    height: "78px",
    padding: "2px 4px",
    gap: "0",
    alignItems: "stretch",
    background:
      theme === "dark"
        ? "linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%)"
        : "linear-gradient(to bottom, #ffffff 0%, #f5f5f7 100%)",
    borderBottom: theme === "dark" ? "1px solid #3a3a3a" : "1px solid #d1d1d1",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: "auto",
    boxSizing: "border-box",
  };
}

interface UseRibbonFrameOptions<TKey extends string> {
  containerRef: RefObject<HTMLDivElement | null>;
  widthConfig: RibbonWidthConfig<TKey>;
  hideOrder: readonly TKey[];
  language: string;
  theme: "dark" | "light";
  onAction?: (action: string) => void;
  onLanguageChange?: (lang: RibbonLanguage) => void;
}

interface RibbonFrameResult<TKey extends string> {
  visibility: Record<TKey, boolean>;
  containerStyle: CSSProperties;
  handleLanguageChange: () => void;
  baseProps: { theme: "dark" | "light"; onAction?: (action: string) => void };
}

export function useRibbonFrame<TKey extends string>({
  containerRef,
  widthConfig,
  hideOrder,
  language,
  theme,
  onAction,
  onLanguageChange,
}: UseRibbonFrameOptions<TKey>): RibbonFrameResult<TKey> {
  const visibility = useResponsiveRibbonVisibility({
    containerRef,
    widthConfig,
    hideOrder,
    language,
  });
  const containerStyle = useMemo(() => getRibbonContainerStyle(theme), [theme]);
  const handleLanguageChange = useCallback(() => {
    onLanguageChange?.(getNextRibbonLanguage(language));
  }, [language, onLanguageChange]);
  const baseProps = useMemo(
    () => ({ theme, onAction }),
    [theme, onAction],
  );

  return {
    visibility,
    containerStyle,
    handleLanguageChange,
    baseProps,
  };
}
