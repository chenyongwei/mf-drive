import { useEffect, useRef, useState, type RefObject } from "react";

interface Size {
  width: number;
  height: number;
}

interface UseContainerSizeResult<T extends HTMLElement> {
  containerRef: RefObject<T | null>;
  containerSize: Size;
}

export function useContainerSize<T extends HTMLElement>(
  initialSize: Size = { width: 800, height: 600 },
): UseContainerSizeResult<T> {
  const containerRef = useRef<T | null>(null);
  const [containerSize, setContainerSize] = useState<Size>(initialSize);

  useEffect(() => {
    const updateSize = () => {
      const element = containerRef.current;
      if (!element) {
        return;
      }
      setContainerSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return { containerRef, containerSize };
}
