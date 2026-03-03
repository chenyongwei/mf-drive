
import React from 'react';
import { FeatureFlagProvider } from '../../contexts/FeatureFlagContext';
import { EditProvider } from '../../contexts/EditContext';
import { CollaborationProvider } from '../../contexts/CollaborationContext';
import { HistoryProvider } from '../../contexts/HistoryContext';
import { ViewportProvider } from '../../contexts/ViewportContext';
import { AnnotationSettingsProvider } from '../../contexts/AnnotationSettingsContext';
import CADPageLayout from '../../layouts/CADPageLayout/CADPageLayout';

import {
  FeaturePackage,
  NestingFeature
} from '@dxf-fix/shared';
import { defaultFeatureFlags, deepMerge } from '../../config/featureFlags.config';

const testPageFlags = deepMerge(defaultFeatureFlags, {
  [FeaturePackage.NESTING]: {
    [NestingFeature.NESTING_MODE]: { enabled: true }
  }
});

const UniversalCADViewTestPage: React.FC = () => {
  return (
    <FeatureFlagProvider customFlags={testPageFlags}>
      <EditProvider>
        <CollaborationProvider>
          <HistoryProvider>
            <ViewportProvider initialZoom={1} minZoom={0.1} maxZoom={10}>
              <AnnotationSettingsProvider>
                <CADPageLayout />
              </AnnotationSettingsProvider>
            </ViewportProvider>
          </HistoryProvider>
        </CollaborationProvider>
      </EditProvider>
    </FeatureFlagProvider>
  );
};

export default UniversalCADViewTestPage;
