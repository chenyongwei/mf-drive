import { createContext } from 'react';

import type { FeatureFlagContextValue } from './types';

export const FeatureFlagContext = createContext<
  FeatureFlagContextValue | undefined
>(undefined);
