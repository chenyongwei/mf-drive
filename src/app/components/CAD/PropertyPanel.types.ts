import { Entity } from '../../lib/webgpu/EntityToVertices';
import { InspectionIssue, InspectionResult } from '@dxf-fix/shared/types/inspection';

export interface PropertyPanelProps {
  selectedEntityIds: string[];
  entities: Entity[];
  isNestingMode: boolean;
  selectedFileId?: string | null;
  onUndo?: () => void;
  onRedo?: () => void;
  onIssueSelect?: (issue: InspectionIssue) => void;
  onHighlightEntities?: (entityIds: string[]) => void;
  onInspectionComplete?: (result: InspectionResult) => void;
  onReloadEntities?: (fileIds: string[]) => void;
  onRunInspection?: () => void;
  inspectionResult?: InspectionResult | null;
  theme?: 'dark' | 'light';
}
