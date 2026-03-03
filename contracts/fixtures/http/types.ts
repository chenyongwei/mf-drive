import type {
  DrawingPdfExtractResponse,
  DrawingFileStatusResponse,
  DrawingFilesResponse,
  GcodeConfigsResponse,
  IdentityLoginResponse,
  NestStartResponse,
  NestingJobsResponse,
  OrderingAdminSummaryResponse,
  OrderingOrdersResponse,
  TeamMemberPermissionsResponse,
  WorkspaceCurrentResponse,
} from '../../generated/types/index';

export type MockScenario = 'base' | 'demo' | 'edge' | 'failure';

export interface HttpFixtureSet {
  drawingFilesResponse: DrawingFilesResponse;
  drawingFileStatusResponse: DrawingFileStatusResponse;
  drawingPdfExtractResponse: DrawingPdfExtractResponse;
  nestingJobsResponse: NestingJobsResponse;
  nestStartResponse: NestStartResponse;
  gcodeConfigsResponse: GcodeConfigsResponse;
  orderingOrdersResponse: OrderingOrdersResponse;
  orderingAdminSummaryResponse: OrderingAdminSummaryResponse;
  identityLoginResponse: IdentityLoginResponse;
  workspaceCurrentResponse: WorkspaceCurrentResponse;
  teamMemberPermissionsResponse: TeamMemberPermissionsResponse;
}
