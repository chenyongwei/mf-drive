import { useContext } from 'react';

import AnnotationSettingsContext from './context';
import type { AnnotationSettingsContextValue } from './types';

export function useAnnotationSettings(): AnnotationSettingsContextValue {
  const context = useContext(AnnotationSettingsContext);

  if (!context) {
    throw new Error('useAnnotationSettings must be used within AnnotationSettingsProvider');
  }

  return context;
}

export function useDimensionDisplay(mode: 'drawing' | 'nesting') {
  const {
    showDimensionsDrawing,
    showDimensionsNesting,
    setShowDimensionsDrawing,
    setShowDimensionsNesting,
    toggleDimensionsDrawing,
    toggleDimensionsNesting,
    ...rest
  } = useAnnotationSettings();

  const showDimensions =
    mode === 'drawing' ? showDimensionsDrawing : showDimensionsNesting;
  const setShowDimensions =
    mode === 'drawing' ? setShowDimensionsDrawing : setShowDimensionsNesting;
  const toggleDimensions =
    mode === 'drawing' ? toggleDimensionsDrawing : toggleDimensionsNesting;

  return {
    showDimensions,
    setShowDimensions,
    toggleDimensions,
    ...rest,
  };
}
