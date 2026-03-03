import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { WebGPUCADView } from '../common/WebGPUCADView';
import { useEdit } from '../../contexts/EditContext';
import FloatingEditPanel from './FloatingEditPanel';
import { InspectionLevel } from '@dxf-fix/shared/types/inspection';
import { usePartConversion, ImportedFile, TiledLayout } from '../../hooks/cad/usePartConversion';
import {
  buildFileNameLabels,
  buildInspectionMarkers,
  computeIssueViewport,
  computeLayoutViewport,
} from './PreprocessCADViewWebCAD.helpers';

interface PreprocessCADViewWebCADProps {
  files: ImportedFile[];
  selectedFileIds: Set<string>;
  tiledLayout: TiledLayout[];
  inspectionIssues?: Array<{
    id: string;
    location: { position: { x: number; y: number } };
    level: InspectionLevel;
  }>;
  selectedIssueIds?: Set<string>;
  hoveredIssueId?: string;
  onIssueClick?: (issueId: string) => void;
  onIssueHover?: (issueId: string | null) => void;
}

export interface PreprocessCADViewWebCADRef {
  worldToScreen: (x: number, y: number) => { x: number; y: number } | null;
  fitToIssues: (issues: Array<{ location: { position: { x: number; y: number } } }>) => void;
}

const PreprocessCADViewWebCAD = forwardRef<PreprocessCADViewWebCADRef, PreprocessCADViewWebCADProps>(({
  files,
  selectedFileIds,
  tiledLayout,
  inspectionIssues = [],
  selectedIssueIds = new Set(),
  hoveredIssueId,
  onIssueClick,
  onIssueHover,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const rulerSize = { width: 15, height: 15 };

  const {
    editState,
    selectEntity,
    hoverEntity,
    executeTrim,
    executeExtend,
    executeDelete,
    editOperation,
    setEditOperation,
  } = useEdit();

  const { entities, partsForFilling } = usePartConversion(files, selectedFileIds, tiledLayout);

  useImperativeHandle(ref, () => ({
    worldToScreen: (x: number, y: number) => {
      if (!containerRef.current) return null;
      return {
        x: x * zoom + pan.x + rulerSize.width,
        y: y * zoom + pan.y + rulerSize.height,
      };
    },
    fitToIssues: (issues) => {
      const viewport = computeIssueViewport(issues, stageSize, rulerSize);
      if (!viewport) return;
      setZoom(viewport.zoom);
      setPan(viewport.pan);
    },
  }), [zoom, pan, stageSize]);

  const handleEntityClick = useCallback(async (entityId: string, fileId: string) => {
    if (editState.tool === 'delete') {
      await executeDelete(fileId, [entityId]);
      return;
    }

    if (editState.tool === 'trim') {
      if (editOperation.step === null || editOperation.step === 'select_boundary') {
        setEditOperation({ step: 'select_target', boundaryEntityId: entityId });
        return;
      }

      if (editOperation.step === 'select_target' && editOperation.boundaryEntityId) {
        await executeTrim(fileId, entityId, editOperation.boundaryEntityId, { x: 0, y: 0 });
      }
      return;
    }

    if (editState.tool === 'extend') {
      if (editOperation.step === null || editOperation.step === 'select_boundary') {
        setEditOperation({ step: 'select_target', boundaryEntityId: entityId });
        return;
      }

      if (editOperation.step === 'select_target' && editOperation.boundaryEntityId) {
        await executeExtend(fileId, entityId, editOperation.boundaryEntityId, { x: 0, y: 0 });
      }
      return;
    }

    selectEntity(entityId);
  }, [editState.tool, editOperation, selectEntity, executeTrim, executeExtend, executeDelete, setEditOperation]);

  useEffect(() => {
    if (zoom !== 1 || pan.x !== 100 || pan.y !== 100) {
      return;
    }

    const viewport = computeLayoutViewport(tiledLayout, stageSize, rulerSize);
    if (!viewport) {
      return;
    }

    setZoom(viewport.zoom);
    setPan(viewport.pan);
  }, [tiledLayout, stageSize, zoom, pan.x, pan.y]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      setStageSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    return () => resizeObserver.disconnect();
  }, []);

  const inspectionMarkers = useMemo(() => buildInspectionMarkers({
    inspectionIssues,
    files,
    tiledLayout,
    selectedIssueIds,
    hoveredIssueId,
  }), [inspectionIssues, files, tiledLayout, selectedIssueIds, hoveredIssueId]);

  const fileNameLabels = useMemo(() => buildFileNameLabels({
    files,
    tiledLayout,
    zoom,
    pan,
  }), [files, tiledLayout, zoom, pan]);

  return (
    <div ref={containerRef} className="h-full w-full bg-black relative">
      <WebGPUCADView
        width={stageSize.width}
        height={stageSize.height}
        entities={entities}
        partsForFilling={partsForFilling}
        enableFillRendering={partsForFilling.length > 0}
        selectedEntityIds={editState.selectedEntityIds}
        hoveredEntityId={editState.hoverEntityId}
        inspectionMarkers={inspectionMarkers}
        onMarkerClick={onIssueClick}
        onMarkerHover={onIssueHover}
        onEntityClick={(entityId) => {
          const entity = entities.find(e => e.id === entityId);
          if (entity && (entity as any).fileId) {
            handleEntityClick(entityId, (entity as any).fileId);
          } else {
            selectEntity(entityId);
          }
        }}
        onEntityHover={hoverEntity}
        showRuler={true}
        showZoomControls={true}
        showFPS={true}
        zoomControlsPosition="bottom-right"
        fpsPosition="top-right"
        backgroundColor="black"
      >
        {tiledLayout.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-2xl text-gray-400 mb-2">请从左侧选择图纸</p>
          </div>
        )}

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-lg px-4 py-2 text-sm text-slate-600">
          已选择 {selectedFileIds.size} 个图纸
        </div>

        {fileNameLabels.map((label) => (
          <div
            key={label.id}
            className="absolute text-sm font-bold text-blue-600 pointer-events-none whitespace-nowrap"
            style={{
              left: label.left,
              top: label.top,
              textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            {label.name}
          </div>
        ))}

        <FloatingEditPanel />
      </WebGPUCADView>
    </div>
  );
});

PreprocessCADViewWebCAD.displayName = 'PreprocessCADViewWebCAD';

export default PreprocessCADViewWebCAD;
