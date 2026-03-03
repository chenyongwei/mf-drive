import { useCallback, useState } from "react";
import { Entity } from "../../../lib/webgpu/EntityToVertices";
import {
  OWNERSHIP_TARGET_NEW_FILE,
  type OwnershipCandidate,
} from "../../../components/CAD/utils/fileOwnershipResolver";

export interface OwnershipDialogState {
  isOpen: boolean;
  selectedTargetId: string;
  candidates: OwnershipCandidate[];
  pendingEntity: Entity | null;
}

function closedOwnershipDialogState(): OwnershipDialogState {
  return {
    isOpen: false,
    selectedTargetId: OWNERSHIP_TARGET_NEW_FILE,
    candidates: [],
    pendingEntity: null,
  };
}

export function useCadOwnershipController(selectedFileId: string | null) {
  const [ownershipDialog, setOwnershipDialog] = useState<OwnershipDialogState>(
    closedOwnershipDialogState,
  );

  const closeOwnershipDialog = useCallback(() => {
    setOwnershipDialog(closedOwnershipDialogState());
  }, []);

  const openOwnershipDialog = useCallback(
    (pendingEntity: Entity, candidates: OwnershipCandidate[]) => {
      const defaultTargetId =
        (selectedFileId &&
        candidates.some((candidate) => candidate.fileId === selectedFileId)
          ? selectedFileId
          : candidates[0]?.fileId) ?? OWNERSHIP_TARGET_NEW_FILE;

      setOwnershipDialog({
        isOpen: true,
        selectedTargetId: defaultTargetId,
        candidates,
        pendingEntity,
      });
    },
    [selectedFileId],
  );

  const onOwnershipDialogSelectionChange = useCallback((nextTargetId: string) => {
    setOwnershipDialog((prev) => ({ ...prev, selectedTargetId: nextTargetId }));
  }, []);

  return {
    ownershipDialog,
    setOwnershipDialog,
    closeOwnershipDialog,
    openOwnershipDialog,
    onOwnershipDialogSelectionChange,
  };
}
