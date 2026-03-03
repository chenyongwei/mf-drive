import React, { useState, useEffect } from "react";
import { useAppStore } from "../store";
import {
  getGCodePresets,
  getGCodeConfigs,
  previewGCode,
  exportGCode,
} from "../services/api";
import { GCodeConfig, Part } from "@dxf-fix/shared";
import {
  ConfigSection,
  PartsSection,
  PreviewSection,
} from "./GCodeExportDialog.sections";
import "./GCodeExportDialog.css";

interface GCodeExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GCodeExportDialog: React.FC<GCodeExportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { getActiveFile } = useAppStore();
  const currentFile = getActiveFile();

  const [configs, setConfigs] = useState<GCodeConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [gcodePreview, setGcodePreview] = useState<string>("");
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfigs();
      loadParts();
    }
  }, [isOpen]);

  // 调试：监听状态变化
  useEffect(() => {}, [gcodePreview]);

  useEffect(() => {}, [showSimulator]);

  useEffect(() => {
    // 当零件列表加载后，默认全选
    if (availableParts.length > 0 && selectedParts.length === 0) {
      setSelectedParts(availableParts.map((p) => p.id));
    }
  }, [availableParts]);

  const loadConfigs = async () => {
    try {
      const [presets, userConfigs] = await Promise.all([
        getGCodePresets(),
        getGCodeConfigs(),
      ]);
      setConfigs([...presets, ...userConfigs]);

      // 默认选择第一个配置
      if (presets.length > 0) {
        setSelectedConfigId(presets[0].id);
      }
    } catch (error) {
      console.error("Failed to load configs:", error);
    }
  };

  const loadParts = async () => {
    if (!currentFile || !currentFile.id) {
      return;
    }

    setLoadingParts(true);
    try {
      const response = await fetch(`/api/drawing/files/${currentFile.id}/parts`);
      const data = await response.json();
      // 只显示 CUT 和 MARK 类型的零件
      const filteredParts = (data.parts || []).filter(
        (part: Part) =>
          part.processType === "CUT" || part.processType === "MARK",
      );
      setAvailableParts(filteredParts);
    } catch (error) {
      console.error("Failed to load parts:", error);
      setAvailableParts([]);
    } finally {
      setLoadingParts(false);
    }
  };

  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
    setGcodePreview(""); // 清除预览
    setShowSimulator(false); // 关闭模拟器
  };

  const handleToggleAllParts = (checked: boolean) => {
    if (checked) {
      setSelectedParts(availableParts.map((part) => part.id));
      return;
    }
    setSelectedParts([]);
  };

  const handleTogglePart = (partId: string, checked: boolean) => {
    if (checked) {
      setSelectedParts((previous) => [...previous, partId]);
      return;
    }
    setSelectedParts((previous) => previous.filter((id) => id !== partId));
  };

  const handlePreview = async () => {
    if (!currentFile || !selectedConfigId || selectedParts.length === 0) {
      return;
    }

    setPreviewing(true);
    try {
      // 后端会从缓存获取最新的零件和实体数据
      const gcode = await previewGCode(currentFile.id, selectedParts);
      setGcodePreview(gcode);
      setShowSimulator(true); // 自动显示模拟器
    } catch (error) {
      console.error("[GCodeExportDialog] Failed to preview G-code:", error);
      alert("预览失败：" + (error as Error).message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleExport = async () => {
    if (!currentFile || !selectedConfigId || selectedParts.length === 0) {
      return;
    }

    const config = configs.find((c) => c.id === selectedConfigId);
    if (!config) {
      return;
    }

    setIsExporting(true);
    try {
      // 生成安全的文件名
      const configName = config.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `${currentFile.name || "export"}_${configName}.nc`;

      const gcode = await exportGCode(
        currentFile.id,
        config.id,
        selectedParts,
        fileName,
      );

      // 创建Blob并下载
      const blob = new Blob([gcode], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Failed to export G-code:", error);
      alert("导出失败：" + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const getSelectedConfig = () => {
    return configs.find((c) => c.id === selectedConfigId);
  };

  const selectedConfig = getSelectedConfig();

  if (!isOpen) return null;

  return (
    <div className="gcode-export-dialog-overlay">
      <div className="gcode-export-dialog">
        <div className="dialog-header">
          <h2>导出G代码</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dialog-body">
          <ConfigSection
            configs={configs}
            selectedConfigId={selectedConfigId}
            selectedConfig={selectedConfig}
            onConfigChange={handleConfigChange}
          />

          <PartsSection
            loadingParts={loadingParts}
            availableParts={availableParts}
            selectedParts={selectedParts}
            onToggleAll={handleToggleAllParts}
            onTogglePart={handleTogglePart}
          />

          <PreviewSection
            gcodePreview={gcodePreview}
            showSimulator={showSimulator}
            onToggleSimulator={() => setShowSimulator((value) => !value)}
            onClear={() => {
              setGcodePreview("");
              setShowSimulator(false);
            }}
            onCloseSimulator={() => setShowSimulator(false)}
          />
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-secondary"
            onClick={handlePreview}
            disabled={
              !selectedConfigId || selectedParts.length === 0 || previewing
            }
          >
            {previewing ? "预览中..." : "预览"}
          </button>
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={
              !selectedConfigId || selectedParts.length === 0 || isExporting
            }
          >
            {isExporting ? "导出中..." : "导出G代码"}
          </button>
        </div>
      </div>
    </div>
  );
};
