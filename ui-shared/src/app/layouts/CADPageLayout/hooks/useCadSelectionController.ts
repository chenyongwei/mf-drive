import { useCallback, useState } from "react";

export function useCadSelectionController() {
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);

  const clearSelectedEntityIds = useCallback(() => {
    setSelectedEntityIds([]);
  }, []);

  return {
    selectedEntityIds,
    setSelectedEntityIds,
    clearSelectedEntityIds,
    hoveredEntityId,
    setHoveredEntityId,
  };
}
