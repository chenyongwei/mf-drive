import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNestingStore } from '../../store/nestingStore';
import { getPrtsPart } from '../../services/nestingApi';
import { WebGPUCADView } from '../common/WebGPUCADView';
import type { Entity } from '../../lib/webgpu/EntityToVertices';
import type { NestingPartsData, LoadedPart } from './NestingCanvas.types';
import { calculateTileLayout, convertNestingResultParts } from './NestingCanvas.nestingResult';
import {
  convertToFillData,
  convertToWebGPUEntities,
  generateMaterialEntities,
  generateTextLabels,
  getRandomPantoneColor,
} from './NestingCanvas.transform';

export const NestingCanvas: React.FC = () => {
  const { selectedParts, result } = useNestingStore();
  const [loadedParts, setLoadedParts] = useState<LoadedPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [nestingPartsData, setNestingPartsData] = useState<NestingPartsData>({ entities: [], fillData: [], textLabels: [] });
  const [loadingNestingResult, setLoadingNestingResult] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const loadParts = async () => {
      if (selectedParts.length === 0) {
        setLoadedParts([]);
        return;
      }

      setLoading(true);
      try {
        const partPromises = selectedParts.map(async (part) => {
          const data = await getPrtsPart(part.partId);
          return {
            ...data,
            offsetX: 0,
            offsetY: 0,
            color: getRandomPantoneColor(data.partId),
          };
        });

        const parts = await Promise.all(partPromises);
        const layoutResult = calculateTileLayout(parts);
        setLoadedParts(layoutResult.parts);
      } catch (error) {
        console.error('[NestingCanvas] Failed to load parts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!result && selectedParts.length > 0) {
      void loadParts();
    }
  }, [selectedParts, result]);

  useEffect(() => {
    const loadNestingResultParts = async () => {
      if (!result || !result.parts || result.parts.length === 0) {
        setNestingPartsData({ entities: [], fillData: [], textLabels: [] });
        return;
      }

      setLoadingNestingResult(true);
      try {
        const partsData = await convertNestingResultParts(result);
        setNestingPartsData(partsData);
      } catch (error) {
        console.error('[NestingCanvas] Failed to load nesting result parts:', error);
        setNestingPartsData({ entities: [], fillData: [], textLabels: [] });
      } finally {
        setLoadingNestingResult(false);
      }
    };

    void loadNestingResultParts();
  }, [result]);

  const getGlobalBBox = () => {
    if (result && result.material) {
      return { minX: 0, minY: 0, maxX: result.material.width, maxY: result.material.height };
    }
    if (loadedParts.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      loadedParts.forEach((part) => {
        const bx = part.geometry.boundingBox;
        minX = Math.min(minX, bx.minX + part.offsetX);
        minY = Math.min(minY, bx.minY + part.offsetY);
        maxX = Math.max(maxX, bx.maxX + part.offsetX);
        maxY = Math.max(maxY, bx.maxY + part.offsetY);
      });
      return { minX, minY, maxX, maxY };
    }
    return { minX: 0, minY: 0, maxX: 6000, maxY: 2000 };
  };

  const { entities, partsForFilling, textLabels } = useMemo(() => {
    if (result) {
      const materialEntities = result.material ? generateMaterialEntities(result.material) : [];
      return {
        entities: [...materialEntities, ...nestingPartsData.entities],
        partsForFilling: nestingPartsData.fillData,
        textLabels: nestingPartsData.textLabels,
      };
    }

    const allEntities: Entity[] = loadedParts.flatMap(convertToWebGPUEntities);
    const fillData = loadedParts.map(convertToFillData);
    const labels = generateTextLabels(loadedParts);

    return {
      entities: allEntities,
      partsForFilling: fillData,
      textLabels: labels,
    };
  }, [loadedParts, result, nestingPartsData]);

  const contentBox = useMemo(() => getGlobalBBox(), [loadedParts, result]);

  if (loading || loadingNestingResult) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 mt-4">
            {loadingNestingResult ? '加载排样结果中...' : '加载零件中...'}
          </p>
        </div>
      </div>
    );
  }

  if (selectedParts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">请先选择要排样的零件</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full relative overflow-hidden bg-black">
      <WebGPUCADView
        width={containerSize.width}
        height={containerSize.height}
        entities={entities}
        partsForFilling={partsForFilling}
        enableFillRendering={partsForFilling.length > 0}
        textLabels={textLabels}
        showRuler={true}
        showZoomControls={true}
        showFPS={false}
        backgroundColor="black"
        autoFitOnMount={true}
        contentBox={contentBox}
      />

      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
        {result && <div>利用率: {(result.utilization * 100).toFixed(1)}%</div>}
        <div>零件: {result ? result.parts?.length || 0 : loadedParts.length}</div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/70 text-slate-400 px-3 py-2 rounded-lg text-xs">
        <div>滚轮缩放 | 拖拽平移</div>
      </div>
    </div>
  );
};
