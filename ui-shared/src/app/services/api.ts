export { apiClient } from './api/client';

export {
  uploadFile,
  getFileStatus,
  getLayers,
  getParts,
  getPart,
  getTiles,
  getEntities,
  applyRules,
  previewRules,
  getRuleTemplates,
  exportFile,
} from './api/files';

export {
  getGCodePresets,
  getGCodePresetsByDevice,
  getGCodeConfigs,
  getGCodeConfig,
  createGCodeConfig,
  updateGCodeConfig,
  deleteGCodeConfig,
  duplicateGCodeConfig,
  previewGCode,
  exportGCode,
} from './api/gcode';

export {
  startNesting,
  getNestingProgress,
  stopNesting,
  getNestingResult,
  getNestingLayout,
  exportNestingGCode,
} from './api/nesting';

export type {
  EditCommandRequest,
  EditCommandErrorCode,
  EditCommandResponse,
} from './api/edit';
export { executeEditCommand } from './api/edit';

export {
  inspectDrawing,
  getInspectionStatus,
  inspectBatch,
} from './api/inspection';

export { default } from './api/client';
