import { useCallback, useEffect, useState, type ChangeEvent, type FocusEvent } from "react";

interface UseEditableNumberInputOptions {
  value: number;
  onValidChange: (value: number) => void;
  onValidBlur?: (value: number) => void;
}

function normalizeInput(value: string): string {
  if (value === "0" || value === "0.") {
    return value;
  }
  const stripped = value.replace(/^0+/, "");
  if (stripped.startsWith(".")) {
    return `0${stripped}`;
  }
  if (stripped === "" && value.startsWith("0")) {
    return "0";
  }
  return stripped;
}

export function useEditableNumberInput({
  value,
  onValidChange,
  onValidBlur,
}: UseEditableNumberInputOptions) {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const normalized = normalizeInput(event.target.value);
      setIsStale(false);
      setLocalValue(normalized);
      const parsed = Number.parseFloat(normalized);
      if (!Number.isNaN(parsed)) {
        onValidChange(parsed);
      }
    },
    [onValidChange],
  );

  const handleFocus = useCallback((event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setIsStale(true);
    event.target.select();
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsStale(false);
    const parsed = Number.parseFloat(localValue);
    if (localValue === "" || Number.isNaN(parsed)) {
      setLocalValue(value.toString());
      return;
    }
    onValidBlur?.(parsed);
  }, [localValue, onValidBlur, value]);

  return {
    isFocused,
    isStale,
    displayValue: isFocused ? localValue : value,
    handleChange,
    handleFocus,
    handleBlur,
  };
}
