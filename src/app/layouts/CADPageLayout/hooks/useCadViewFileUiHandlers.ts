import { useCallback, useEffect, useRef } from "react";
import type { FileData } from "../CADPageLayout.file-utils";

interface UseCadViewFileUiHandlersOptions {
  setHoveredEntityId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedFileId: React.Dispatch<React.SetStateAction<string | null>>;
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  checkedFileIds: Set<string>;
  fileLayouts: Array<{
    fileId: string;
    offsetX: number;
    offsetY: number;
    boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  }>;
  viewport: any;
  shouldFitToView: boolean;
  setShouldFitToView: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: React.Dispatch<React.SetStateAction<"DXF" | "PRTS" | "PDF">>;
  setSelectedEntityIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleFileUpload: (files: FileList) => void;
}

export const useCadViewFileUiHandlers = ({
  setHoveredEntityId,
  setSelectedFileId,
  setFiles,
  checkedFileIds,
  fileLayouts,
  viewport,
  shouldFitToView,
  setShouldFitToView,
  setActiveTab,
  setSelectedEntityIds,
  handleFileUpload,
}: UseCadViewFileUiHandlersOptions) => {
  const fitRequestViewportRef = useRef<{
    zoom: number;
    panX: number;
    panY: number;
  } | null>(null);
  const initialViewportRef = useRef<{
    zoom: number;
    panX: number;
    panY: number;
  } | null>(null);
  const hasUserInteractedBeforeFirstAutoFitRef = useRef(false);
  const hasHandledFirstAutoFitRequestRef = useRef(false);

  const handleEntityHover = useCallback((entityId: string | null) => {
    setHoveredEntityId(entityId);
  }, [setHoveredEntityId]);

  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
  }, [setSelectedFileId]);

  const handleFileRename = useCallback((fileId: string, nextName: string) => {
    const normalized = nextName.trim();
    if (!normalized) return;
    setFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, name: normalized } : file)),
    );
  }, [setFiles]);

  const handleZoomToSelection = useCallback(() => {
    const checkedLayouts = fileLayouts.filter((layout) => checkedFileIds.has(layout.fileId));
    if (checkedLayouts.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    checkedLayouts.forEach((layout) => {
      const bbox = layout.boundingBox;
      minX = Math.min(minX, bbox.minX + layout.offsetX);
      minY = Math.min(minY, bbox.minY + layout.offsetY);
      maxX = Math.max(maxX, bbox.maxX + layout.offsetX);
      maxY = Math.max(maxY, bbox.maxY + layout.offsetY);
    });
    if (!isFinite(minX)) return;
    const padding = 50;
    const contentBox = { minX: minX - padding, minY: minY - padding, maxX: maxX + padding, maxY: maxY + padding };
    const containerSize = { width: window.innerWidth - 280, height: window.innerHeight - 100 };
    try {
      viewport.fitToView(contentBox, containerSize);
    } catch (error) {
      console.error("[CADPageLayout] viewport.fitToView error:", error);
    }
  }, [fileLayouts, checkedFileIds, viewport]);

  useEffect(() => {
    const currentViewport = viewport?.viewport;
    const normalized = {
      zoom: Number(currentViewport?.zoom ?? 1),
      panX: Number(currentViewport?.pan?.x ?? 0),
      panY: Number(currentViewport?.pan?.y ?? 0),
    };

    if (!initialViewportRef.current) {
      initialViewportRef.current = normalized;
      return;
    }

    if (hasHandledFirstAutoFitRequestRef.current) {
      return;
    }

    const initial = initialViewportRef.current;
    const changed =
      Math.abs(normalized.zoom - initial.zoom) > 1e-6 ||
      Math.abs(normalized.panX - initial.panX) > 1e-3 ||
      Math.abs(normalized.panY - initial.panY) > 1e-3;

    if (changed) {
      hasUserInteractedBeforeFirstAutoFitRef.current = true;
    }
  }, [viewport]);

  useEffect(() => {
    if (!shouldFitToView) {
      fitRequestViewportRef.current = null;
      return;
    }

    if (fitRequestViewportRef.current) {
      return;
    }

    const currentViewport = viewport?.viewport;
    fitRequestViewportRef.current = {
      zoom: Number(currentViewport?.zoom ?? 1),
      panX: Number(currentViewport?.pan?.x ?? 0),
      panY: Number(currentViewport?.pan?.y ?? 0),
    };
  }, [shouldFitToView, viewport]);

  useEffect(() => {
    if (shouldFitToView && fileLayouts.length > 0) {
      if (
        !hasHandledFirstAutoFitRequestRef.current &&
        hasUserInteractedBeforeFirstAutoFitRef.current
      ) {
        hasHandledFirstAutoFitRequestRef.current = true;
        fitRequestViewportRef.current = null;
        setShouldFitToView(false);
        return;
      }

      const currentViewport = viewport?.viewport;
      const fitRequestedAt = fitRequestViewportRef.current;
      const viewportChangedSinceRequest = fitRequestedAt
        ? (
          Math.abs(Number(currentViewport?.zoom ?? 1) - fitRequestedAt.zoom) > 1e-6 ||
          Math.abs(Number(currentViewport?.pan?.x ?? 0) - fitRequestedAt.panX) > 1e-3 ||
          Math.abs(Number(currentViewport?.pan?.y ?? 0) - fitRequestedAt.panY) > 1e-3
        )
        : false;

      if (!viewportChangedSinceRequest) {
        handleZoomToSelection();
      }

      if (!hasHandledFirstAutoFitRequestRef.current) {
        hasHandledFirstAutoFitRequestRef.current = true;
      }
      fitRequestViewportRef.current = null;
      setShouldFitToView(false);
    }
  }, [shouldFitToView, fileLayouts, viewport, handleZoomToSelection, setShouldFitToView]);

  const handleTabChange = useCallback((tab: "DXF" | "PRTS" | "PDF") => {
    setActiveTab(tab);
    setSelectedFileId(null);
    setSelectedEntityIds([]);
  }, [setActiveTab, setSelectedFileId, setSelectedEntityIds]);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) handleFileUpload(event.target.files);
  }, [handleFileUpload]);

  return {
    handleEntityHover,
    handleFileSelect,
    handleFileRename,
    handleZoomToSelection,
    handleTabChange,
    handleFileInput,
  };
};
