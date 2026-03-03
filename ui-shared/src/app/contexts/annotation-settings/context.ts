import { createContext } from 'react';

import type { AnnotationSettingsContextValue } from './types';

const AnnotationSettingsContext =
  createContext<AnnotationSettingsContextValue | null>(null);

export default AnnotationSettingsContext;
