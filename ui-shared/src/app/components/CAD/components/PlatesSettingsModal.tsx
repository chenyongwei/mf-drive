import React, { useEffect, useMemo, useState } from "react";
import { Plate } from "../types/NestingTypes";
import { useEditableNumberInput } from "./useEditableNumberInput";

interface PlatesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plates: Plate[];
  onSave: (newPlates: Plate[]) => void;
  theme: "dark" | "light";
}

interface ModalNumberInputProps {
  id: string;
  value: number;
  min: number;
  max?: number;
  step?: number;
  theme: "dark" | "light";
  onChange: (value: number) => void;
}

function clampNumber(value: number, min: number, max?: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  if (typeof max === "number") {
    return Math.min(max, Math.max(min, value));
  }
  return Math.max(min, value);
}

const ModalNumberInput: React.FC<ModalNumberInputProps> = ({
  id,
  value,
  min,
  max,
  step = 1,
  theme,
  onChange,
}) => {
  const emitChange = (raw: number) => {
    onChange(clampNumber(raw, min, max));
  };

  const { isFocused, isStale, displayValue, handleChange, handleFocus, handleBlur } =
    useEditableNumberInput({
      value,
      onValidChange: emitChange,
      onValidBlur: emitChange,
    });

  return (
    <div
      style={{
        width: "160px",
        height: "66px",
        borderRadius: "10px",
        border:
          theme === "dark"
            ? `1px solid ${isFocused ? "#5b8cff" : "#4b5563"}`
            : `1px solid ${isFocused ? "#3b82f6" : "#cbd5e1"}`,
        background: theme === "dark" ? "#111315" : "#ffffff",
        boxShadow: isFocused
          ? theme === "dark"
            ? "0 0 0 1px rgba(91,140,255,0.28)"
            : "0 0 0 1px rgba(59,130,246,0.22)"
          : "none",
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "transparent",
          outline: "none",
          fontSize: "16px",
          lineHeight: 1,
          fontWeight: 400,
          color: isStale
            ? theme === "dark"
              ? "rgba(238,238,238,0.52)"
              : "rgba(51,65,85,0.55)"
            : theme === "dark"
              ? "#eeeeee"
              : "#1f2937",
        }}
      />
    </div>
  );
};

export const PlatesSettingsModal: React.FC<PlatesSettingsModalProps> = ({
  isOpen,
  onClose,
  plates,
  onSave,
  theme,
}) => {
  const [width, setWidth] = useState(plates[0]?.width || 2000);
  const [height, setHeight] = useState(plates[0]?.height || 1000);
  const [count, setCount] = useState(plates.length || 1);
  const [margin, setMargin] = useState(plates[0]?.margin || 10);

  useEffect(() => {
    if (!isOpen) return;
    setWidth(plates[0]?.width || 2000);
    setHeight(plates[0]?.height || 1000);
    setCount(plates.length || 1);
    setMargin(plates[0]?.margin || 10);
  }, [isOpen, plates]);

  const normalizedCount = useMemo(() => Math.max(1, Math.round(count)), [count]);
  const normalizedWidth = useMemo(() => clampNumber(width, 1), [width]);
  const normalizedHeight = useMemo(() => clampNumber(height, 1), [height]);
  const normalizedMargin = useMemo(() => clampNumber(margin, 0), [margin]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newPlates: Plate[] = [];
    for (let i = 0; i < normalizedCount; i++) {
      newPlates.push({
        id: `plate-${Date.now()}-${i}`,
        name: `Plate ${i + 1}`,
        width: normalizedWidth,
        height: normalizedHeight,
        margin: normalizedMargin,
        position: { x: 0, y: i * (normalizedHeight + 50) },
      });
    }
    onSave(newPlates);
    onClose();
  };

  const bgColor = theme === "dark" ? "#2a2a2a" : "#ffffff";
  const textColor = theme === "dark" ? "#eeeeee" : "#333333";
  const borderColor = theme === "dark" ? "#444444" : "#dddddd";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          backgroundColor: bgColor,
          color: textColor,
          padding: "24px",
          borderRadius: "8px",
          width: "320px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          border: `1px solid ${borderColor}`,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>
          板材设置
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label>数量</label>
            <ModalNumberInput
              id="plates-count-input"
              value={normalizedCount}
              min={1}
              step={1}
              theme={theme}
              onChange={(next) => setCount(Math.max(1, Math.round(next)))}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label>宽度 (mm)</label>
            <ModalNumberInput
              id="plates-width-input"
              value={normalizedWidth}
              min={1}
              step={1}
              theme={theme}
              onChange={setWidth}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label>高度 (mm)</label>
            <ModalNumberInput
              id="plates-height-input"
              value={normalizedHeight}
              min={1}
              step={1}
              theme={theme}
              onChange={setHeight}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label>边距 (mm)</label>
            <ModalNumberInput
              id="plates-margin-input"
              value={normalizedMargin}
              min={0}
              step={1}
              theme={theme}
              onChange={setMargin}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: "4px", border: `1px solid ${borderColor}`, backgroundColor: "transparent", color: textColor, cursor: "pointer" }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{ padding: "8px 16px", borderRadius: "4px", border: "none", backgroundColor: "#3b82f6", color: "white", cursor: "pointer" }}
          >
            应用
          </button>
        </div>
      </div>
    </div>
  );
};
