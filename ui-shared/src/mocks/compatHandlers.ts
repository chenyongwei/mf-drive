import { authWorkspaceHandlers } from './compatHandlers/authWorkspaceHandlers';
import { teamManagementHandlers } from './compatHandlers/teamManagementHandlers';
import { adminUserHandlers } from './compatHandlers/adminUserHandlers';
import { adminTeamAndStatsHandlers } from './compatHandlers/adminTeamAndStatsHandlers';
import { fileAndPartHandlers } from './compatHandlers/fileAndPartHandlers';
import { ruleHandlers } from './compatHandlers/ruleHandlers';
import { editCommandHandlers } from './compatHandlers/editCommandHandlers';
import { fontHandlers } from './compatHandlers/fontHandlers';
import { partRecognitionHandlers } from './compatHandlers/partRecognitionHandlers';
import { toolpathHandlers } from './compatHandlers/toolpathHandlers';
import { nestingGcodeHandlers } from './compatHandlers/nestingGcodeHandlers';
import { orderingIdentityHandlers } from './compatHandlers/orderingIdentityHandlers';
import { fallbackHandlers } from './compatHandlers/fallbackHandlers';

export const compatHandlers = [
  ...authWorkspaceHandlers,
  ...teamManagementHandlers,
  ...adminUserHandlers,
  ...adminTeamAndStatsHandlers,
  ...fileAndPartHandlers,
  ...ruleHandlers,
  ...editCommandHandlers,
  ...fontHandlers,
  ...partRecognitionHandlers,
  ...toolpathHandlers,
  ...nestingGcodeHandlers,
  ...orderingIdentityHandlers,
  ...fallbackHandlers,
];
