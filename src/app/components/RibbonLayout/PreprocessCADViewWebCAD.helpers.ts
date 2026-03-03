import { InspectionLevel } from '@dxf-fix/shared/types/inspection';
import { ImportedFile, TiledLayout } from '../../hooks/cad/usePartConversion';
import { computeIssueViewportFromPositions } from '../utils/issueViewport';

interface IssueLike {
  id: string;
  location: { position: { x: number; y: number } };
  level: InspectionLevel;
}

interface RulerSize {
  width: number;
  height: number;
}

interface StageSize {
  width: number;
  height: number;
}

export const computeIssueViewport = (
  issues: Array<{ location: { position: { x: number; y: number } } }>,
  stageSize: StageSize,
  rulerSize: RulerSize,
) => {
  return computeIssueViewportFromPositions(issues, stageSize, rulerSize, {
    padding: 50,
    maxZoom: 5,
  });
};

export const computeLayoutViewport = (
  tiledLayout: TiledLayout[],
  stageSize: StageSize,
  rulerSize: RulerSize,
) => {
  if (tiledLayout.length === 0) {
    return null;
  }

  const minX = Math.min(...tiledLayout.map(l => l.bbox.minX));
  const minY = Math.min(...tiledLayout.map(l => l.bbox.minY));
  const maxX = Math.max(...tiledLayout.map(l => l.bbox.maxX));
  const maxY = Math.max(...tiledLayout.map(l => l.bbox.maxY));

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const padding = 100;
  const availableWidth = stageSize.width - rulerSize.width - padding * 2;
  const availableHeight = stageSize.height - rulerSize.height - padding * 2;

  const zoomX = availableWidth / contentWidth;
  const zoomY = availableHeight / contentHeight;
  const zoom = Math.min(zoomX, zoomY, 1);

  return {
    zoom,
    pan: {
      x: rulerSize.width + (availableWidth - contentWidth * zoom) / 2 - minX * zoom,
      y: rulerSize.height + (availableHeight - contentHeight * zoom) / 2 - minY * zoom,
    },
  };
};

export const buildInspectionMarkers = ({
  inspectionIssues,
  files,
  tiledLayout,
  selectedIssueIds,
  hoveredIssueId,
}: {
  inspectionIssues: IssueLike[];
  files: ImportedFile[];
  tiledLayout: TiledLayout[];
  selectedIssueIds: Set<string>;
  hoveredIssueId?: string;
}) => {
  if (!inspectionIssues || inspectionIssues.length === 0) return [];

  return inspectionIssues.map(issue => {
    const file = files.find(f =>
      f.inspectionResult?.issues.some(i => i.id === issue.id),
    );

    if (!file) return null;
    const layout = tiledLayout.find(l => l.fileId === file.id);
    if (!layout) return null;

    const bbox = file.bbox || { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const x = (issue.location.position.x - bbox.minX) * layout.scale + layout.position.x;
    const y = -(issue.location.position.y - bbox.minY) * layout.scale + layout.position.y;

    return {
      id: issue.id,
      x,
      y,
      level: issue.level,
      selected: selectedIssueIds.has(issue.id),
      hovered: hoveredIssueId === issue.id,
    };
  }).filter((m): m is NonNullable<typeof m> => m !== null);
};

export const buildFileNameLabels = ({
  files,
  tiledLayout,
  zoom,
  pan,
}: {
  files: ImportedFile[];
  tiledLayout: TiledLayout[];
  zoom: number;
  pan: { x: number; y: number };
}) => {
  return tiledLayout.flatMap((layout) => {
    const file = files.find(f => f.id === layout.fileId);
    if (!file) return [];

    const framePaddingMM = 100;
    const namePaddingMM = 50;
    const bbox = file.bbox || { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const scaledWidth = (bbox.maxX - bbox.minX) * layout.scale;
    const scaledHeight = (bbox.maxY - bbox.minY) * layout.scale;

    const labelWorldX = layout.position.x - (framePaddingMM + namePaddingMM) * layout.scale;
    const labelWorldY = layout.position.y - scaledHeight - (framePaddingMM + namePaddingMM) * layout.scale;

    return [{
      id: file.id,
      name: file.name,
      left: labelWorldX * zoom + pan.x,
      top: labelWorldY * zoom + pan.y,
      scaledWidth,
      scaledHeight,
    }];
  });
};
