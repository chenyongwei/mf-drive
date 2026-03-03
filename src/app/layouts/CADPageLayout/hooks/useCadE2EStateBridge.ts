import { useEffect } from "react";

interface UseCadE2EStateBridgeOptions {
  entities: unknown[];
  files: unknown[];
  selectedEntityIds: string[];
  selectedPartIds: string[];
  selectedListFileIds: string[];
  hoveredEntityId: string | null;
  activeTool: string;
  selectedFileId: string | null;
  viewport: unknown;
  isNestingMode: boolean;
}

declare global {
  interface Window {
    __CAD_STATE__?: Record<string, unknown>;
  }
}

export function useCadE2EStateBridge({
  entities,
  files,
  selectedEntityIds,
  selectedPartIds,
  selectedListFileIds,
  hoveredEntityId,
  activeTool,
  selectedFileId,
  viewport,
  isNestingMode,
}: UseCadE2EStateBridgeOptions): void {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.__CAD_STATE__ = {
      entities,
      entityCount: entities.length,
      files,
      selectedEntityIds,
      selectedPartIds,
      selectedListFileIds,
      hoveredEntityId,
      activeTool,
      selectedFileId,
      viewport,
      isNestingMode,
    };
  }, [
    entities,
    files,
    selectedEntityIds,
    selectedPartIds,
    selectedListFileIds,
    hoveredEntityId,
    activeTool,
    selectedFileId,
    viewport,
    isNestingMode,
  ]);
}
