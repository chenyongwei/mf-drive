import React from "react";

interface CADViewTextDraftEditorProps {
  theme: "dark" | "light";
  screenPoint: { x: number; y: number };
  value: string;
  textEditorRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  onCommit: (value?: string) => void;
  onCancel: () => void;
  onSelectTool: (tool: "select") => void;
}

export function CADViewTextDraftEditor({
  theme,
  screenPoint,
  value,
  textEditorRef,
  onChange,
  onCommit,
  onCancel,
  onSelectTool,
}: CADViewTextDraftEditorProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: screenPoint.x,
        top: screenPoint.y,
        transform: "translate(6px, 6px)",
        zIndex: 40,
        minWidth: 220,
        pointerEvents: "auto",
        background: theme === "dark" ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.96)",
        border: theme === "dark" ? "1px solid rgba(148,163,184,0.5)" : "1px solid rgba(15,23,42,0.2)",
        borderRadius: 8,
        boxShadow: theme === "dark" ? "0 10px 28px rgba(2,6,23,0.55)" : "0 10px 24px rgba(15,23,42,0.2)",
        padding: 8,
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div style={{ fontSize: 11, marginBottom: 6, color: theme === "dark" ? "#94a3b8" : "#475569" }}>
        Enter 提交，Shift+Enter 换行
      </div>
      <textarea
        ref={textEditorRef}
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onCommit(event.currentTarget.value);
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
            onSelectTool("select");
          }
        }}
        rows={4}
        style={{
          width: "100%",
          resize: "vertical",
          minHeight: 88,
          maxHeight: 220,
          background: theme === "dark" ? "rgba(2,6,23,0.7)" : "rgba(248,250,252,0.92)",
          border: theme === "dark" ? "1px solid rgba(100,116,139,0.6)" : "1px solid rgba(148,163,184,0.55)",
          borderRadius: 6,
          color: theme === "dark" ? "#f8fafc" : "#0f172a",
          padding: "6px 8px",
          fontSize: 13,
          lineHeight: 1.45,
          outline: "none",
          fontFamily: '"Noto Sans", "Noto Sans CJK SC", "Noto Sans Arabic", "Noto Sans Devanagari", sans-serif',
        }}
        placeholder="输入文字..."
      />
      <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: theme === "dark" ? "1px solid rgba(148,163,184,0.4)" : "1px solid rgba(100,116,139,0.4)",
            background: theme === "dark" ? "rgba(30,41,59,0.7)" : "rgba(241,245,249,0.95)",
            color: theme === "dark" ? "#e2e8f0" : "#334155",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          取消
        </button>
        <button
          type="button"
          onClick={() => onCommit()}
          style={{
            border: "1px solid rgba(37,99,235,0.7)",
            background: "#2563eb",
            color: "#fff",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          创建
        </button>
      </div>
    </div>
  );
}
