
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
    DrawingFeature,
    CommonFeature
} from '@dxf-fix/shared';
import { defaultFeatureFlags, deepMerge } from '../../config/featureFlags.config';

const nestingFlags = deepMerge(defaultFeatureFlags, {
    [FeaturePackage.DRAWING]: {
        [DrawingFeature.EDIT]: { enabled: false },
        [DrawingFeature.INSPECTION]: { enabled: false },
        [DrawingFeature.OPTIMIZATION]: { enabled: false },
        [DrawingFeature.PART_RECOGNITION]: { enabled: false },
    },
    [FeaturePackage.COMMON]: {
        [CommonFeature.BOUNDING_BOX]: { enabled: false },
        [CommonFeature.NAME_LABEL]: { enabled: false },
        [CommonFeature.OPERATION_HISTORY]: { enabled: true },
    }
});

const NestingPage: React.FC = () => {
    return (
        <FeatureFlagProvider customFlags={nestingFlags}>
            <EditProvider>
                <CollaborationProvider>
                    <HistoryProvider>
                        <ViewportProvider initialZoom={1} minZoom={0.1} maxZoom={10}>
                            <AnnotationSettingsProvider>
                                <CADPageLayout
                                    initialMode="nesting"
                                    disableDrawing={true}
                                    allowedFileTypes={['PRTS']}
                                    showFeatureToggle={false}
                                />
                            </AnnotationSettingsProvider>
                        </ViewportProvider>
                    </HistoryProvider>
                </CollaborationProvider>
            </EditProvider>
        </FeatureFlagProvider>
    );
};

export default NestingPage;
