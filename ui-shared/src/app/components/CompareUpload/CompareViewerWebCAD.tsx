/**
 * CompareViewerWebCAD - Mixed DXF and PRTS viewer with comparison layout.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BoundingBox, Viewport } from '../common/WebGPUCADView';
import { DefaultWebGPUViewer } from '../common/DefaultWebGPUViewer';
import { ViewerErrorState, ViewerLoadingState } from '../common/ViewerStates';
import { useContainerSize } from '../common/useContainerSize';
import { fetchGroupedParts } from './CompareViewerWebCAD.helpers';
import { buildRenderData } from './CompareViewerWebCAD.render';
import { CompareViewerWebCADProps, LoadedPart } from './CompareViewerWebCAD.types';

const CompareViewerWebCAD: React.FC<CompareViewerWebCADProps> = ({ files }) => {
  const [loadedParts, setLoadedParts] = useState<LoadedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalContentBox, setGlobalContentBox] = useState<BoundingBox | null>(null);
  const { containerRef, containerSize } = useContainerSize<HTMLDivElement>();
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, pan: { x: 0, y: 0 } });

  const handleViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport);
  }, []);

  useEffect(() => {
    let canceled = false;

    const loadAllPartsWithGrouping = async () => {
      if (files.length === 0) {
        if (!canceled) {
          setLoadedParts([]);
          setGlobalContentBox(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const layoutResult = await fetchGroupedParts(files);
        if (!canceled) {
          setLoadedParts(layoutResult.parts);
          setGlobalContentBox(layoutResult.globalBox);
        }
      } catch (err: any) {
        console.error('Error loading parts:', err);
        if (!canceled) {
          setError(err.message);
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    loadAllPartsWithGrouping();

    return () => {
      canceled = true;
    };
  }, [files]);

  const { allEntities, partsForFilling, textLabels } = useMemo(
    () => buildRenderData(loadedParts),
    [loadedParts],
  );

  if (loading) {
    return <ViewerLoadingState />;
  }

  if (error) {
    return <ViewerErrorState error={error} />;
  }

  if (!globalContentBox || loadedParts.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="h-full w-full relative" data-viewport-zoom={viewport.zoom}>
      <DefaultWebGPUViewer
        width={containerSize.width}
        height={containerSize.height}
        entities={allEntities}
        partsForFilling={partsForFilling}
        contentBox={globalContentBox || undefined}
        onViewportChange={handleViewportChange}
        textLabels={textLabels}
      />
    </div>
  );
};

export default CompareViewerWebCAD;
