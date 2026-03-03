import { useCallback, useState } from 'react';
import { NestResult, MaterialGroup } from '../types';

/**
 * Custom hook for handling nest result operations
 */
export const useNestResults = (
  activeMaterialGroupId: string | undefined,
  setMaterialGroups: React.Dispatch<React.SetStateAction<MaterialGroup[]>>
) => {
  const [nestResults, setNestResults] = useState<NestResult[]>([]);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  const handleDeleteResults = useCallback(
    (resultIds: string[]) => {
      setNestResults((prev) => prev.filter((r) => !resultIds.includes(r.id)));
      setSelectedResultIds(new Set());

      // Update material group stats
      if (activeMaterialGroupId) {
        setMaterialGroups((prev) =>
          prev.map((g) => {
            if (g.id === activeMaterialGroupId) {
              return { ...g, nestResultCount: g.nestResultCount - resultIds.length };
            }
            return g;
          })
        );
      }
    },
    [activeMaterialGroupId, setMaterialGroups]
  );

  const handleDuplicateResult = useCallback(
    (resultId: string) => {
      const result = nestResults.find((r) => r.id === resultId);
      if (result) {
        setNestResults((prev) => [
          {
            ...result,
            id: `nest-${Date.now()}`,
            name: `${result.name} (副本)`,
            timestamp: new Date().toISOString(),
            status: 'draft',
          },
          ...prev,
        ]);

        // Update material group stats
        if (activeMaterialGroupId) {
          setMaterialGroups((prev) =>
            prev.map((g) => {
              if (g.id === activeMaterialGroupId) {
                return { ...g, nestResultCount: g.nestResultCount + 1 };
              }
              return g;
            })
          );
        }
      }
    },
    [nestResults, activeMaterialGroupId, setMaterialGroups]
  );

  const handleLockResult = useCallback((resultId: string) => {
    setNestResults((prev) =>
      prev.map((r) => {
        if (r.id === resultId) {
          return { ...r, isLocked: !r.isLocked };
        }
        return r;
      })
    );
  }, []);

  const handleUpdateResultStatus = useCallback(
    (resultId: string, status: NestResult['status']) => {
      setNestResults((prev) =>
        prev.map((r) => {
          if (r.id === resultId) {
            return { ...r, status };
          }
          return r;
        })
      );
    },
    []
  );

  return {
    nestResults,
    setNestResults,
    selectedResultIds,
    setSelectedResultIds,
    handleDeleteResults,
    handleDuplicateResult,
    handleLockResult,
    handleUpdateResultStatus,
  };
};
