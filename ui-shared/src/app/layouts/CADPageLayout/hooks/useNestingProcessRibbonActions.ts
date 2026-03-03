import { useCallback, useMemo } from "react";
import {
  buildNestingProcessMenus,
  MAX_PINNED_PROCESS_FAVORITES,
  type NestingProcessActionDef,
  type NestingProcessCapabilityMap,
} from "../../../components/CAD/components/RibbonDropdowns";
import type {
  NestingProcessOperation,
  NestingProcessToolbarPrefs,
} from "../../../components/CAD/types/NestingTypes";
import {
  dispatchRibbonAction,
  type DispatchRibbonActionContext,
} from "../CADPageLayout.ribbon";

interface UseNestingProcessRibbonActionsOptions {
  isNestingMode: boolean;
  nestingProcessToolbarPrefs: NestingProcessToolbarPrefs;
  dispatchContext: DispatchRibbonActionContext;
}

export const useNestingProcessRibbonActions = ({
  isNestingMode,
  nestingProcessToolbarPrefs,
  dispatchContext,
}: UseNestingProcessRibbonActionsOptions) => {
  const { setNestingProcessToolbarPrefs, showPartActionToast } = dispatchContext;

  const nestingProcessCapabilityMap = useMemo<NestingProcessCapabilityMap>(
    () => ({ "check-leads-current": true, "micro-edit": true }),
    [],
  );

  const nestingProcessMenus = useMemo(
    () =>
      buildNestingProcessMenus(
        nestingProcessCapabilityMap,
        nestingProcessToolbarPrefs,
      ),
    [nestingProcessCapabilityMap, nestingProcessToolbarPrefs],
  );

  const nestingProcessPrimaryActionDefByOperation = useMemo<
    Partial<Record<NestingProcessOperation, NestingProcessActionDef>>
  >(() => {
    const result: Partial<Record<NestingProcessOperation, NestingProcessActionDef>> = {};
    (["add", "delete"] as NestingProcessOperation[]).forEach((operation) => {
      const actionId = nestingProcessMenus.primaryActionByOperation[operation];
      if (!actionId) return;
      const actionDef = nestingProcessMenus.defsById[actionId];
      if (actionDef) result[operation] = actionDef;
    });
    return result;
  }, [
    nestingProcessMenus.primaryActionByOperation,
    nestingProcessMenus.defsById,
  ]);

  const handleNestingProcessPinToggle = useCallback(
    (actionId: string) => {
      if (!nestingProcessMenus.defsById[actionId]) return;
      setNestingProcessToolbarPrefs((prev) => {
        if (prev.favorites.includes(actionId)) {
          return {
            ...prev,
            favorites: prev.favorites.filter((id) => id !== actionId),
          };
        }
        if (prev.favorites.length >= MAX_PINNED_PROCESS_FAVORITES) {
          showPartActionToast("最多固定 6 个常用，请先取消一个", "warning");
          return prev;
        }
        return { ...prev, favorites: [...prev.favorites, actionId] };
      });
    },
    [nestingProcessMenus.defsById, setNestingProcessToolbarPrefs, showPartActionToast],
  );

  const handleRibbonAction = useCallback(
    (action: string) => {
      dispatchRibbonAction({
        action,
        isNestingMode,
        defsById: nestingProcessMenus.defsById,
        nestingProcessCapabilityMap,
        ...dispatchContext,
      });
    },
    [
      dispatchContext,
      isNestingMode,
      nestingProcessCapabilityMap,
      nestingProcessMenus.defsById,
    ],
  );

  const handleNestingProcessPrimaryClick = useCallback(
    (operation: NestingProcessOperation) => {
      const actionId = nestingProcessMenus.primaryActionByOperation[operation];
      if (actionId) handleRibbonAction(actionId);
    },
    [nestingProcessMenus.primaryActionByOperation, handleRibbonAction],
  );

  return {
    nestingProcessCapabilityMap,
    nestingProcessMenus,
    nestingProcessPrimaryActionDefByOperation,
    handleNestingProcessPinToggle,
    handleRibbonAction,
    handleNestingProcessPrimaryClick,
  };
};
