import React from 'react';
import { Button } from '../common';

interface VerificationCodeSectionProps {
  inputField: React.ReactNode;
  errorMessage?: string;
  countdown: number;
  isSendingCode: boolean;
  onResend: () => void;
  resendTestId?: string;
}

export function VerificationCodeSection({
  inputField,
  errorMessage,
  countdown,
  isSendingCode,
  onResend,
  resendTestId,
}: VerificationCodeSectionProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        验证码 <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        {inputField}
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onResend}
          disabled={countdown > 0 || isSendingCode}
          className="whitespace-nowrap"
          data-testid={resendTestId}
        >
          {countdown > 0 ? `${countdown}秒` : '重新发送'}
        </Button>
      </div>
      {errorMessage ? <p className="mt-1 text-xs text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
