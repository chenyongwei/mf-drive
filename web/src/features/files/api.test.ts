import { describe, expect, it } from 'vitest';
import { RequestError } from '../auth/oauth';
import { toDriveApiError } from './api';

describe('toDriveApiError', () => {
  it('returns PDP specific message when DRIVE_PDP_DENY', () => {
    const error = new RequestError(403, 'forbidden', {
      error: 'DRIVE_PDP_DENY',
      reason: 'POLICY_NOT_FOUND',
    });
    expect(toDriveApiError(error)).toContain('Foundation 授权策略');
  });

  it('returns scope message when DRIVE_SCOPE_REQUIRED', () => {
    const error = new RequestError(403, 'forbidden', {
      error: 'DRIVE_SCOPE_REQUIRED',
      requiredScope: 'drive.appdata.read',
    });
    expect(toDriveApiError(error)).toContain('scope 不足');
  });
});
