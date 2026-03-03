import type {
  DrawingEditCommandRequest as ContractDrawingEditCommandRequest,
  DrawingEditCommandResponse as ContractDrawingEditCommandResponse,
} from '@platform/contracts';
import type {
  CadKernelCommand,
  CadKernelCommandErrorCode,
} from '@platform/cad-kernel/core';

import api from './client';
import { resolveUserContextHeaders } from '../userContext';

export type EditCommandRequest = ContractDrawingEditCommandRequest & {
  command: CadKernelCommand;
};

export type EditCommandErrorCode = CadKernelCommandErrorCode;

export type EditCommandResponse = ContractDrawingEditCommandResponse & {
  errorCode?: EditCommandErrorCode;
};

export const executeEditCommand = async (
  request: EditCommandRequest
): Promise<EditCommandResponse> => {
  const userContext = resolveUserContextHeaders();
  const cadKernelModeHint =
    import.meta.env.VITE_CAD_KERNEL_MODE === 'legacy' ? 'legacy' : 'kernel';

  const response = await api.post(
    `/drawing/files/${request.fileId}/edit`,
    {
      ...request,
      ...(userContext.userId ? { userId: userContext.userId } : {}),
      ...(userContext.username ? { username: userContext.username } : {}),
    },
    {
      headers: {
        ...userContext.headers,
        'x-cad-kernel-mode-hint': cadKernelModeHint,
      },
    }
  );
  return response.data;
};
