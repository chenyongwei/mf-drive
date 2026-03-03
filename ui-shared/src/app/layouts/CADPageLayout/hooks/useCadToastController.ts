import { useCallback, useEffect, useRef, useState } from "react";

export type PartActionToastType = "success" | "error" | "warning" | "info";

export interface PartActionToast {
  id: number;
  message: string;
  type: PartActionToastType;
}

export function useCadToastController() {
  const [partActionToast, setPartActionToast] = useState<PartActionToast | null>(
    null,
  );
  const partActionToastTimerRef = useRef<number | null>(null);

  const clearPartActionToast = useCallback(() => {
    if (partActionToastTimerRef.current !== null) {
      window.clearTimeout(partActionToastTimerRef.current);
      partActionToastTimerRef.current = null;
    }
    setPartActionToast(null);
  }, []);

  const showPartActionToast = useCallback(
    (
      message: string,
      type: PartActionToastType = "info",
      durationMs = 2600,
    ) => {
      if (partActionToastTimerRef.current !== null) {
        window.clearTimeout(partActionToastTimerRef.current);
        partActionToastTimerRef.current = null;
      }

      setPartActionToast({
        id: Date.now(),
        message,
        type,
      });

      partActionToastTimerRef.current = window.setTimeout(() => {
        setPartActionToast(null);
        partActionToastTimerRef.current = null;
      }, durationMs);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (partActionToastTimerRef.current !== null) {
        window.clearTimeout(partActionToastTimerRef.current);
        partActionToastTimerRef.current = null;
      }
    };
  }, []);

  return {
    partActionToast,
    showPartActionToast,
    clearPartActionToast,
  };
}
