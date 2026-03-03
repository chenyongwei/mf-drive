import React from "react";
import { GCodeCommand } from "../services/gcodeParser";

interface SimulatorControlsProps {
  isPlaying: boolean;
  onReset: () => void;
  onStepBack: () => void;
  onPlayToggle: () => void;
  onStepForward: () => void;
  onEnd: () => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  isPlaying,
  onReset,
  onStepBack,
  onPlayToggle,
  onStepForward,
  onEnd,
}) => {
  return (
    <div className="simulator-controls" style={{ marginBottom: "12px" }}>
      <button className="btn-control" onClick={onReset} title="重置">
        ⏮
      </button>
      <button className="btn-control" onClick={onStepBack} title="后退">
        ◀◀
      </button>
      <button
        className={`btn-control btn-play ${isPlaying ? "active" : ""}`}
        onClick={onPlayToggle}
      >
        {isPlaying ? "⏸ 暂停" : "▶ 播放"}
      </button>
      <button className="btn-control" onClick={onStepForward} title="前进">
        ▶▶
      </button>
      <button className="btn-control" onClick={onEnd} title="完成">
        ⏭
      </button>
    </div>
  );
};

interface SimulatorProgressBarProps {
  progress: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SimulatorProgressBar: React.FC<SimulatorProgressBarProps> = ({
  progress,
  onChange,
}) => {
  return (
    <div className="simulator-progress-bar">
      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={onChange}
        className="progress-track"
        style={{ width: "100%", cursor: "pointer" }}
      />
      <span className="progress-text">{Math.round(progress)}%</span>
    </div>
  );
};

interface SimulatorSpeedControlProps {
  speed: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SimulatorSpeedControl: React.FC<SimulatorSpeedControlProps> = ({
  speed,
  onChange,
}) => {
  return (
    <div className="speed-control">
      <span className="speed-label">速度:</span>
      <input
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        value={speed}
        onChange={onChange}
        className="speed-slider"
      />
      <span className="speed-value">{speed.toFixed(1)}x</span>
    </div>
  );
};

interface CurrentCommandPanelProps {
  command?: string;
}

export const CurrentCommandPanel: React.FC<CurrentCommandPanelProps> = ({
  command,
}) => {
  if (!command) {
    return null;
  }
  return <div className="current-command">{command}</div>;
};

export const SimulatorLegend: React.FC = () => {
  return (
    <div className="simulator-legend">
      <div className="legend-item">
        <div className="legend-line rapid"></div>
        <span className="legend-text">G0 快速移动</span>
      </div>
      <div className="legend-item">
        <div className="legend-line linear"></div>
        <span className="legend-text">G1 直线切割</span>
      </div>
      <div className="legend-item">
        <div className="legend-line arc"></div>
        <span className="legend-text">G2/G3 圆弧切割</span>
      </div>
    </div>
  );
};

interface SimulatorInfoPanelProps {
  bbox: { minX: number; minY: number; maxX: number; maxY: number } | null;
  commands: GCodeCommand[];
}

export const SimulatorInfoPanel: React.FC<SimulatorInfoPanelProps> = ({
  bbox,
  commands,
}) => {
  if (!bbox) {
    return null;
  }

  return (
    <div className="simulator-info">
      <div className="simulator-info-row">
        <span>指令总数:</span>
        <span>{commands.length}</span>
      </div>
      <div className="simulator-info-row">
        <span>快速移动:</span>
        <span>{commands.filter((c) => c.type === "RAPID").length}</span>
      </div>
      <div className="simulator-info-row">
        <span>直线切割:</span>
        <span>{commands.filter((c) => c.type === "LINEAR").length}</span>
      </div>
      <div className="simulator-info-row">
        <span>圆弧切割:</span>
        <span>
          {commands.filter((c) => c.type === "ARC_CW" || c.type === "ARC_CCW").length}
        </span>
      </div>
      <div className="simulator-info-row">
        <span>尺寸范围:</span>
        <span>
          X: {bbox.minX.toFixed(1)} ~ {bbox.maxX.toFixed(1)} mm
        </span>
      </div>
      <div className="simulator-info-row">
        <span></span>
        <span>
          Y: {bbox.minY.toFixed(1)} ~ {bbox.maxY.toFixed(1)} mm
        </span>
      </div>
    </div>
  );
};
