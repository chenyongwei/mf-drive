import type { ComponentProps, ReactNode } from 'react';
import { WebGPUCADView } from './WebGPUCADView';

type ViewerProps = ComponentProps<typeof WebGPUCADView>;

interface DefaultWebGPUViewerProps {
  width: ViewerProps['width'];
  height: ViewerProps['height'];
  entities: ViewerProps['entities'];
  partsForFilling: ViewerProps['partsForFilling'];
  contentBox: ViewerProps['contentBox'];
  onViewportChange: ViewerProps['onViewportChange'];
  textLabels?: ViewerProps['textLabels'];
  children?: ReactNode;
}

export function DefaultWebGPUViewer({
  width,
  height,
  entities,
  partsForFilling,
  contentBox,
  onViewportChange,
  textLabels,
  children,
}: DefaultWebGPUViewerProps) {
  return (
    <WebGPUCADView
      width={width}
      height={height}
      entities={entities}
      partsForFilling={partsForFilling}
      enableFillRendering={partsForFilling.length > 0}
      showRuler={true}
      showZoomControls={true}
      showFPS={true}
      backgroundColor="black"
      autoFitOnMount={true}
      contentBox={contentBox}
      onViewportChange={onViewportChange}
      textLabels={textLabels}
    >
      {children}
    </WebGPUCADView>
  );
}
