import React from "react";
import {
  NestingProgress as NestingProgressType,
  Layout,
} from "@dxf-fix/shared";

interface NestingProgressProps {
  status: "idle" | "loading" | "running" | "completed" | "stopped" | "error";
  progress: NestingProgressType | null;
  result: Layout | null;
}

export const NestingProgress: React.FC<NestingProgressProps> = ({
  status,
  progress,
  result,
}) => {
  if (status === "idle" || status === "loading") {
    return null;
  }

  const currentProgress = progress || result;
  const isLayoutType = (obj: any): obj is NestingProgressType =>
    obj && "currentLayout" in obj;
  const actualProgress = isLayoutType(currentProgress) ? currentProgress : null;
  const utilization = actualProgress?.currentLayout?.utilization
    ? actualProgress.currentLayout.utilization * 100
    : progress?.currentUtilization
      ? progress.currentUtilization * 100
      : 0;

  const placedCount = actualProgress?.currentLayout?.parts?.length || 0;
  const percent = progress?.progress || 0;

  const getStatusText = () => {
    switch (status) {
      case "running":
        return "排样中...";
      case "completed":
        return "排样完成";
      case "stopped":
        return "排样已停止";
      case "error":
        return "排样出错";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "stopped":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="bg-slate-800/80 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor()} ${
              status === "running" ? "animate-pulse" : ""
            }`}
          />
          <span className="text-white text-sm font-medium">
            {getStatusText()}
          </span>
          {status === "running" && (
            <span className="text-slate-400 text-xs">
              {percent.toFixed(0)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-slate-300">
            利用率:{" "}
            <span className="text-white font-medium">
              {utilization.toFixed(1)}%
            </span>
          </div>
          {isLayoutType(currentProgress) && (
            <div className="text-slate-300">
              已放置:{" "}
              <span className="text-white font-medium">{placedCount}</span> 个
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {status === "running" && (
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
};
