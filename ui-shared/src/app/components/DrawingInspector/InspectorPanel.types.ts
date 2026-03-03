import type {
  InspectionIssue,
  InspectionResult,
} from '@dxf-fix/shared/types/inspection';

export interface InspectorPanelProps {
  inspectionResult: InspectionResult | null;
  loading: boolean;
  onIssueClick?: (issue: InspectionIssue) => void;
  onIssueHover?: (issue: InspectionIssue | null) => void;
  onReinspect?: (tolerance: number) => void;
  selectedIssueIds?: Set<string>;
  hoveredIssueId?: string;
}
