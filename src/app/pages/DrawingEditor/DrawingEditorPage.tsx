
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

const drawingFlags = deepMerge(defaultFeatureFlags, {
    [FeaturePackage.NESTING]: {
        [NestingFeature.PART_ROTATION]: { enabled: false },
        [NestingFeature.COLLISION_DETECTION]: { enabled: false },
        [NestingFeature.PLATE_BORDER]: { enabled: false },
        [NestingFeature.MARGIN]: { enabled: false },
    }
});

const DrawingEditorPage: React.FC = () => {
    return (
        <FeatureFlagProvider customFlags={drawingFlags}>
            <EditProvider>
                <CollaborationProvider>
                    <HistoryProvider>
                        <ViewportProvider initialZoom={1} minZoom={0.1} maxZoom={10}>
                            <AnnotationSettingsProvider>
                                <CADPageLayout
                                    initialMode="drawing"
                                    disableNesting={true}
                                    allowedFileTypes={['DXF', 'PDF']}
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

export default DrawingEditorPage;
