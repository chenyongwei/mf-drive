import React, { useEffect, useState } from "react";
import { useAppStore } from "../store";
import { getParts } from "../services/api";
import type { Part } from "@dxf-fix/shared";

const PartList: React.FC = () => {
  const { getActiveFile, selection, setSelection } = useAppStore();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);

  const currentFile = getActiveFile();

  useEffect(() => {
    if (currentFile && currentFile.status === "ready") {
      loadParts();
    }
  }, [currentFile]);

  const loadParts = async () => {
    if (!currentFile) return;

    setLoading(true);
    try {
      const data = await getParts(currentFile.id);
      setParts(data.parts);
    } catch (error) {
      console.error("Load parts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartClick = (part: Part) => {
    const isSelected = selection.parts.some((p) => p.id === part.id);
    if (isSelected) {
      setSelection({ parts: selection.parts.filter((p) => p.id !== part.id) });
    } else {
      setSelection({
        parts: [...selection.parts, { id: part.id, fileId: part.fileId }],
      });
    }
  };

  const getProcessTypeColor = (type: string) => {
    switch (type) {
      case "CUT":
        return "bg-green-100 text-green-700";
      case "MARK":
        return "bg-cyan-100 text-cyan-700";
      case "NONE":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg
          className="w-8 h-8 animate-spin mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <p className="text-sm">加载中...</p>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg
          className="w-12 h-12 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-sm">暂无零件数据</p>
        <p className="text-xs mt-1">解析完成后将显示零件列表</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {parts.map((part) => {
        const isSelected = selection.parts.some((p) => p.id === part.id);
        return (
          <div
            key={part.id}
            className={`p-3 rounded-lg cursor-pointer transition-colors border ${
              isSelected
                ? "bg-indigo-50 border-indigo-500"
                : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
            }`}
            onClick={() => handlePartClick(part)}
          >
            <div className="flex items-start gap-3">
              {/* 缩略图 */}
              <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                <img
                  src={`/api/drawing/files/${part.fileId}/parts/${part.id}/thumbnail`}
                  alt={part.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                {/* 文件名 */}
                <div
                  className="text-sm font-medium text-slate-900 mb-1 truncate"
                  title={part.fileName || part.name}
                >
                  {part.fileName || part.name}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  {/* 零件名 */}
                  <h3
                    className="text-xs text-slate-600 truncate"
                    title={part.name}
                  >
                    {part.name}
                  </h3>
                  {/* 工艺类型 */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getProcessTypeColor(part.processType)}`}
                  >
                    {part.processType}
                  </span>
                </div>

                {/* 尺寸信息 */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400">面积:</span>{" "}
                    {typeof part.area === "number"
                      ? part.area.toFixed(2)
                      : "N/A"}
                  </div>
                  <div>
                    <span className="text-slate-400">周长:</span>{" "}
                    {typeof part.perimeter === "number"
                      ? part.perimeter.toFixed(2)
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PartList;
