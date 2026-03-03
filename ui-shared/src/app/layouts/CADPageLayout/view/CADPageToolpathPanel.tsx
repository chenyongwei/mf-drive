import React, { useCallback, useEffect, useRef, useState } from "react";

interface ToolpathOption {
  contourId: string;
  partId: string;
}

interface CADPageToolpathPanelProps {
  isNestingMode: boolean;
  toolpathPlan: any;
  isToolpathBusy: boolean;
  theme: "dark" | "light";
  toolpathMode: string;
  toolpathSortMode: string | null;
  toolpathContourOptions: ToolpathOption[];
  toolpathSelectedContourId: string;
  onToolpathSelectedContourIdChange: (value: string) => void;
  toolpathStartPointParamInput: string;
  onToolpathStartPointParamInputChange: (value: string) => void;
  toolpathSequenceOrderInput: string;
  onToolpathSequenceOrderInputChange: (value: string) => void;
  toolpathLeadInLengthInput: string;
  onToolpathLeadInLengthInputChange: (value: string) => void;
  toolpathLeadOutLengthInput: string;
  onToolpathLeadOutLengthInputChange: (value: string) => void;
  requestToolpathPlan: (mode: "AUTO" | "MANUAL") => Promise<void>;
  requestToolpathCheck: () => Promise<void>;
  showToolpathOverlay: boolean;
  onToggleToolpathOverlay: () => void;
  applyStartPointOverride: () => void;
  applyLeadOverride: () => void;
  applySequenceOverride: () => void;
  buttonStyle: React.CSSProperties;
}

const PANEL_RIGHT = 12;
const PANEL_TOP = 42;

interface PanelOffset {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startOffset: PanelOffset;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const inputStyle = (theme: "dark" | "light"): React.CSSProperties => ({
  borderRadius: 6,
  border:
    theme === "dark"
      ? "1px solid rgba(148,163,184,0.35)"
      : "1px solid rgba(15,23,42,0.22)",
  background:
    theme === "dark" ? "rgba(30,41,59,0.7)" : "rgba(248,250,252,0.95)",
  color: theme === "dark" ? "#e2e8f0" : "#0f172a",
  padding: "4px 6px",
});

const actionButtonStyle = (theme: "dark" | "light"): React.CSSProperties => ({
  padding: "2px 8px",
  borderRadius: 4,
  border:
    theme === "dark"
      ? "1px solid rgba(148,163,184,0.4)"
      : "1px solid rgba(15,23,42,0.2)",
  background:
    theme === "dark" ? "rgba(30,41,59,0.8)" : "rgba(241,245,249,0.95)",
  color: theme === "dark" ? "#e2e8f0" : "#0f172a",
  fontSize: 12,
  lineHeight: 1.35,
  cursor: "pointer",
});

const sortLabel = (sortMode: string | null): string => {
  if (sortMode == null) return "未选择(默认从下到上蛇形)";
  if (sortMode === "sort-inner-outer") return "先内后外";
  if (sortMode === "sort-left-right") return "从左到右";
  if (sortMode === "sort-bottom-top") return "从下到上(蛇形)";
  return "从上到下";
};

export const CADPageToolpathPanel: React.FC<CADPageToolpathPanelProps> = ({
  isNestingMode,
  toolpathPlan,
  isToolpathBusy,
  theme,
  toolpathMode,
  toolpathSortMode,
  toolpathContourOptions,
  toolpathSelectedContourId,
  onToolpathSelectedContourIdChange,
  toolpathStartPointParamInput,
  onToolpathStartPointParamInputChange,
  toolpathSequenceOrderInput,
  onToolpathSequenceOrderInputChange,
  toolpathLeadInLengthInput,
  onToolpathLeadInLengthInputChange,
  toolpathLeadOutLengthInput,
  onToolpathLeadOutLengthInputChange,
  requestToolpathPlan,
  requestToolpathCheck,
  showToolpathOverlay,
  onToggleToolpathOverlay,
  applyStartPointOverride,
  applyLeadOverride,
  applySequenceOverride,
  buttonStyle,
}) => {
  const shouldRenderPanel = isNestingMode && Boolean(toolpathPlan || isToolpathBusy);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [panelOffset, setPanelOffset] = useState<PanelOffset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const clampPanelOffset = useCallback((nextX: number, nextY: number): PanelOffset => {
    const panelEl = panelRef.current;
    if (!panelEl) return { x: nextX, y: nextY };
    const parentEl = panelEl.offsetParent;
    if (!(parentEl instanceof HTMLElement)) return { x: nextX, y: nextY };

    const panelWidth = panelEl.offsetWidth;
    const panelHeight = panelEl.offsetHeight;
    const parentWidth = parentEl.clientWidth;
    const parentHeight = parentEl.clientHeight;

    const baseLeft = parentWidth - PANEL_RIGHT - panelWidth;
    const minX = -baseLeft;
    const maxX = parentWidth - panelWidth - baseLeft;
    const minY = -PANEL_TOP;
    const maxY = parentHeight - panelHeight - PANEL_TOP;

    return {
      x: clamp(nextX, Math.min(minX, maxX), Math.max(minX, maxX)),
      y: clamp(nextY, Math.min(minY, maxY), Math.max(minY, maxY)),
    };
  }, []);

  const keepPanelInBounds = useCallback(() => {
    setPanelOffset((prev) => {
      const bounded = clampPanelOffset(prev.x, prev.y);
      if (bounded.x === prev.x && bounded.y === prev.y) return prev;
      return bounded;
    });
  }, [clampPanelOffset]);

  useEffect(() => {
    keepPanelInBounds();
  }, [isMinimized, toolpathContourOptions.length, keepPanelInBounds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      keepPanelInBounds();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [keepPanelInBounds]);

  useEffect(() => {
    const panelEl = panelRef.current;
    if (!panelEl || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      keepPanelInBounds();
    });
    observer.observe(panelEl);
    return () => observer.disconnect();
  }, [keepPanelInBounds]);

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setIsDragging(false);
  }, []);

  const handleHeaderPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("[data-panel-action='true']")) {
        return;
      }
      event.preventDefault();
      dragStateRef.current = {
        pointerId: event.pointerId,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startOffset: panelOffset,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    },
    [panelOffset],
  );

  const handleHeaderPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      const nextX =
        dragState.startOffset.x + (event.clientX - dragState.startPointerX);
      const nextY =
        dragState.startOffset.y + (event.clientY - dragState.startPointerY);

      setPanelOffset((prev) => {
        const bounded = clampPanelOffset(nextX, nextY);
        if (bounded.x === prev.x && bounded.y === prev.y) return prev;
        return bounded;
      });
    },
    [clampPanelOffset],
  );

  const handleHeaderPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      endDrag(event);
    },
    [endDrag],
  );

  const handleHeaderPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      endDrag(event);
    },
    [endDrag],
  );

  if (!shouldRenderPanel) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        right: PANEL_RIGHT,
        top: PANEL_TOP,
        transform: `translate(${panelOffset.x}px, ${panelOffset.y}px)`,
        zIndex: 1700,
        minWidth: isMinimized ? 200 : 300,
        maxWidth: "min(460px, calc(100% - 12px))",
        borderRadius: 8,
        padding: isMinimized ? "8px 10px" : "10px 12px",
        background:
          theme === "dark" ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.92)",
        border:
          theme === "dark"
            ? "1px solid rgba(148,163,184,0.35)"
            : "1px solid rgba(15,23,42,0.18)",
        color: theme === "dark" ? "#e2e8f0" : "#0f172a",
        backdropFilter: "blur(4px)",
        boxShadow:
          theme === "dark"
            ? "0 8px 16px rgba(2,6,23,0.45)"
            : "0 8px 16px rgba(15,23,42,0.18)",
      }}
    >
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerCancel}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          userSelect: "none",
          touchAction: "none",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          刀路计划 {isToolpathBusy ? "（处理中）" : ""}
        </div>
        <button
          type="button"
          data-panel-action="true"
          style={actionButtonStyle(theme)}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={() => {
            setIsMinimized((prev) => !prev);
          }}
        >
          {isMinimized ? "展开" : "最小化"}
        </button>
      </div>
      {!isMinimized && (
        <>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>
            mode={toolpathMode}
            {" | "}
            sort={sortLabel(toolpathSortMode)}
            {toolpathPlan ? ` | status=${toolpathPlan.status}` : ""}
          </div>
          {toolpathPlan && (
            <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>
              <div>
                cut={toolpathPlan.metrics.cutLength.toFixed(1)}mm rapid=
                {toolpathPlan.metrics.rapidLength.toFixed(1)}mm
              </div>
              <div>
                pierce={toolpathPlan.metrics.pierceCount} time=
                {toolpathPlan.metrics.estimatedTimeSec.toFixed(1)}s
              </div>
              <div>
                thermal={toolpathPlan.metrics.thermalPenalty.toFixed(2)} warnings=
                {toolpathPlan.warnings.length}
              </div>
            </div>
          )}
          {toolpathContourOptions.length > 0 && (
            <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <span>轮廓</span>
                <select
                  value={toolpathSelectedContourId}
                  onChange={(event) =>
                    onToolpathSelectedContourIdChange(event.target.value)
                  }
                  style={inputStyle(theme)}
                >
                  {toolpathContourOptions.map((option) => (
                    <option key={option.contourId} value={option.contourId}>
                      {option.partId} / {option.contourId}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 6,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>起点(0~1)</span>
                  <input
                    value={toolpathStartPointParamInput}
                    onChange={(event) =>
                      onToolpathStartPointParamInputChange(event.target.value)
                    }
                    style={inputStyle(theme)}
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>{"顺序(>=0)"}</span>
                  <input
                    value={toolpathSequenceOrderInput}
                    onChange={(event) =>
                      onToolpathSequenceOrderInputChange(event.target.value)
                    }
                    style={inputStyle(theme)}
                  />
                </label>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 6,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>LeadIn(mm)</span>
                  <input
                    value={toolpathLeadInLengthInput}
                    onChange={(event) =>
                      onToolpathLeadInLengthInputChange(event.target.value)
                    }
                    style={inputStyle(theme)}
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>LeadOut(mm)</span>
                  <input
                    value={toolpathLeadOutLengthInput}
                    onChange={(event) =>
                      onToolpathLeadOutLengthInputChange(event.target.value)
                    }
                    style={inputStyle(theme)}
                  />
                </label>
              </div>
            </div>
          )}
          <div
            style={{
              marginTop: 8,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 6,
            }}
          >
            <button
              style={buttonStyle}
              onClick={() => void requestToolpathPlan("AUTO")}
            >
              自动
            </button>
            <button style={buttonStyle} onClick={() => void requestToolpathCheck()}>
              检查
            </button>
            <button style={buttonStyle} onClick={onToggleToolpathOverlay}>
              {showToolpathOverlay ? "隐藏路径" : "显示路径"}
            </button>
            <button style={buttonStyle} onClick={applyStartPointOverride}>
              起点修正
            </button>
            <button style={buttonStyle} onClick={applyLeadOverride}>
              引线修正
            </button>
            <button style={buttonStyle} onClick={applySequenceOverride}>
              顺序修正
            </button>
          </div>
        </>
      )}
    </div>
  );
};
