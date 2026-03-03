import React, { useEffect, useRef, useCallback } from "react";
import { useNestingStore } from "../../store/nestingStore";
import { NestingControls } from "./NestingControls";
import { PrtsPartsList } from "./PrtsPartsList";
import { NestingCanvas } from "./NestingCanvas";
import { NestingProgress } from "./NestingProgress";
import {
  getAllPrtsParts,
  startNesting,
  getNestingProgress,
  generateRandomMaterial,
  selectRandomPartsWithQuantity,
} from "../../services/nestingApi";
import { PrtsPartSummary, NestingAlgorithm } from "@dxf-fix/shared";

export const NestingPage: React.FC = () => {
  const {
    allParts,
    selectedParts,
    nestingId,
    status,
    progress,
    result,
    material,
    setAllParts,
    setSelectedParts,
    setNestingId,
    setStatus,
    setProgress,
    setResult,
    setError,
  } = useNestingStore();

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 加载所有prts零件
  const loadAllParts = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await getAllPrtsParts();
      setAllParts(response.parts);

      // 随机选择最多100个零件
      const randomParts = selectRandomPartsWithQuantity(response.parts, 100);
      setSelectedParts(randomParts.map((item) => item.part));

      console.log(
        `[NestingPage] Loaded ${response.parts.length} parts, selected ${randomParts.length}`,
      );
      setStatus("idle");
    } catch (error: any) {
      console.error("[NestingPage] Failed to load parts:", error);
      setError(error.message || "Failed to load parts");
      setStatus("error");
    }
  }, [setAllParts, setSelectedParts, setStatus, setError]);

  // 页面加载时获取零件列表
  useEffect(() => {
    loadAllParts();
  }, [loadAllParts]);

  // 轮询排样进度
  useEffect(() => {
    if (!nestingId || status !== "running") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const currentProgress = await getNestingProgress(nestingId);
        setProgress(currentProgress);

        // 如果排样完成或停止
        if (
          currentProgress.status === "completed" ||
          currentProgress.status === "stopped"
        ) {
          setStatus(currentProgress.status);
          setResult(currentProgress.currentLayout || null);

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (error: any) {
        console.error("[NestingPage] Polling error:", error);
        setError(error.message || "Polling error");
      }
    }, 500); // 每500ms轮询一次

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [nestingId, status, setProgress, setStatus, setResult, setError]);

  // 开始排样
  const handleStartNesting = async () => {
    if (selectedParts.length === 0) {
      setError("请先选择零件");
      return;
    }

    try {
      setStatus("loading");
      setError(null);

      // 生成随机板材尺寸
      const randomMaterial = material.autoGenerate
        ? generateRandomMaterial()
        : material;

      console.log("[NestingPage] Starting nesting with:", {
        partCount: selectedParts.length,
        material: randomMaterial,
      });

      // 构建排样请求
      const request = {
        partIds: selectedParts.map((p) => p.partId),
        material: randomMaterial,
        options: {
          rotationStep: 15,
          spacing: 2,
          nestingTime: 60, // 60秒
          algorithms: ["bottom-left"] as NestingAlgorithm[],
          enableNesting: true,
          maxNestingDepth: 3,
        },
      };

      const response = await startNesting(request);
      setNestingId(response.id);
      setStatus("running");
      setProgress({
        nestingId: response.id,
        status: "running",
        progress: 0,
        currentUtilization: 0,
      });
    } catch (error: any) {
      console.error("[NestingPage] Start nesting error:", error);
      setError(error.message || "Failed to start nesting");
      setStatus("error");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* 顶部控制栏 */}
      <NestingControls
        onStartNesting={handleStartNesting}
        isRunning={status === "running"}
        selectedCount={selectedParts.length}
        totalCount={allParts.length}
      />

      {/* 进度显示 */}
      {(status === "running" ||
        status === "completed" ||
        status === "stopped") && (
        <NestingProgress status={status} progress={progress} result={result} />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧零件列表 */}
        <PrtsPartsList />

        {/* 右侧排样画布 */}
        <NestingCanvas />
      </div>
    </div>
  );
};
