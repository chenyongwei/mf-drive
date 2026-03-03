import { useCallback, useState } from 'react';
import { NestResult, MaterialGroup, Part } from '../types';

/**
 * Custom hook for handling nesting operations
 */
export const useNestingOperations = (
  parts: Part[],
  selectedPartIds: Set<string>,
  activeMaterialGroupId: string | undefined,
  nestingSettings: any,
  setMaterialGroups: React.Dispatch<React.SetStateAction<MaterialGroup[]>>,
  setNestResults: React.Dispatch<React.SetStateAction<NestResult[]>>
) => {
  const [isNestingRunning, setIsNestingRunning] = useState(false);
  const [nestingProgress, setNestingProgress] = useState(0);
  const [nestingUtilization, setNestingUtilization] = useState(0);
  const [nestingAlgorithm, setNestingAlgorithm] = useState('bottom-left');

  const handleStartNesting = useCallback(() => {
    setIsNestingRunning(true);
    setNestingProgress(0);
    setNestingUtilization(0);

    // Update material group nesting status
    if (activeMaterialGroupId) {
      setMaterialGroups((prev) =>
        prev.map((g) => {
          if (g.id === activeMaterialGroupId) {
            return {
              ...g,
              isNesting: true,
              nestingProgress: 0,
              nestingUtilization: 0,
            };
          }
          return g;
        })
      );
    }

    // Simulate nesting progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setNestingProgress(progress);
      setNestingUtilization((progress * 0.72) / 100);

      // Update material group progress
      setMaterialGroups((prev) =>
        prev.map((g) => {
          if (g.id === activeMaterialGroupId) {
            return {
              ...g,
              nestingProgress: progress,
              nestingUtilization: (progress * 0.72) / 100,
            };
          }
          return g;
        })
      );

      if (progress >= 100) {
        clearInterval(interval);
        setIsNestingRunning(false);
      }
    }, 200);
  }, [parts, selectedPartIds, activeMaterialGroupId, nestingSettings, setMaterialGroups]);

  const handleStopNesting = useCallback(() => {
    setIsNestingRunning(false);

    if (activeMaterialGroupId) {
      setMaterialGroups((prev) =>
        prev.map((g) => {
          if (g.id === activeMaterialGroupId) {
            return {
              ...g,
              isNesting: false,
              nestingProgress: undefined,
              nestingUtilization: undefined,
            };
          }
          return g;
        })
      );
    }
  }, [activeMaterialGroupId, setMaterialGroups]);

  const handleOpenNestingSettings = useCallback(() => {
  }, []);

  const handleManualNesting = useCallback(() => {
  }, []);

  return {
    isNestingRunning,
    nestingProgress,
    nestingUtilization,
    nestingAlgorithm,
    setNestingAlgorithm,
    handleStartNesting,
    handleStopNesting,
    handleOpenNestingSettings,
    handleManualNesting,
  };
};
