import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { FormInput, Button } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common';
import { useTwoStepEmailFlow } from './useTwoStepEmailFlow';
import { VerificationCodeSection } from './VerificationCodeSection';
import { EmailFormData, useEmailStepForm } from './useEmailStepForm';
import { useZodStepForm } from './useZodStepForm';

// Step 2: Code and password only (email is passed from step 1, no need to re-validate)
const step2Schema = z.object({
  verificationCode: z.string().min(6, '请输入6位验证码').max(6, '验证码为6位数字'),
  password: z.string().min(6, '密码至少需要6个字符'),
  confirmPassword: z.string().min(6, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type Step2FormData = z.infer<typeof step2Schema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUser, sendVerificationCode } = useAuth();
  const { success, error } = useToast();
  const flow = useTwoStepEmailFlow();

  // Step 1 form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useEmailStepForm();
  const step2DefaultValues: Step2FormData = {
    verificationCode: '',
    password: '',
    confirmPassword: '',
  };

  // Step 2 form
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: step2Errors },
  } = useZodStepForm<Step2FormData>({
    schema: step2Schema,
    defaultValues: step2DefaultValues,
    mode: 'onSubmit',
  });

  const handleSendCode = async (data: EmailFormData) => {
    flow.setIsSendingCode(true);
    try {
      await sendVerificationCode(data.email);
      flow.setEmail(data.email);
      flow.setStep(2);
      flow.setCountdown(60);
      success('验证码已发送到您的邮箱');
    } catch (err: any) {
      console.error('[RegisterForm] Send code error:', err);
      error(err.response?.data?.error || '发送验证码失败');
    } finally {
      flow.setIsSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (flow.countdown > 0) return;

    flow.setIsSendingCode(true);
    try {
      await sendVerificationCode(flow.email);
      flow.setCountdown(60);
      success('验证码已重新发送');
    } catch (err: any) {
      error(err.response?.data?.error || '发送验证码失败');
    } finally {
      flow.setIsSendingCode(false);
    }
  };

  const onSubmit = async (data: Step2FormData) => {
    flow.setIsLoading(true);
    try {
      await registerUser({
        email: flow.email, // Use email from state (validated in step 1)
        verificationCode: data.verificationCode,
        password: data.password,
      });
      success('注册成功');
      navigate('/');
    } catch (err: any) {
      console.error('[RegisterForm] Registration error:', err);
      error(err.response?.data?.error || '注册失败');
    } finally {
      flow.setIsLoading(false);
    }
  };

  const handleSubmitStep2WithLogging = async (e?: React.BaseSyntheticEvent) => {
    return handleSubmitStep2(onSubmit)(e);
  };

  return (
    <div className="space-y-4">
      {flow.step === 1 ? (
        // Step 1: Email input
        <form onSubmit={handleSubmitEmail(handleSendCode)} className="space-y-4" data-testid="register-step1-form">
          <FormInput
            label="邮箱"
            type="email"
            placeholder="your@email.com"
            error={emailErrors.email?.message}
            required
            {...registerEmail('email')}
            data-testid="register-email-input"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={flow.isSendingCode}
            disabled={flow.isSendingCode}
            className="w-full"
            data-testid="send-code-button"
          >
            发送验证码
          </Button>

          <p className="text-center text-sm text-gray-600">
            已有账号？{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium" data-testid="login-link-step1">
              立即登录
            </Link>
          </p>
        </form>
      ) : (
        // Step 2: Code, password
        <form onSubmit={handleSubmitStep2WithLogging} className="space-y-4" data-testid="register-step2-form">
          {/* Email (readonly display) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600" data-testid="email-display">
              {flow.email}
            </div>
          </div>

          <VerificationCodeSection
            countdown={flow.countdown}
            isSendingCode={flow.isSendingCode}
            onResend={handleResendCode}
            errorMessage={step2Errors.verificationCode?.message}
            resendTestId="resend-code-button"
            inputField={(
              <FormInput
                type="text"
                placeholder="6位验证码"
                error={step2Errors.verificationCode?.message}
                className="flex-1"
                maxLength={6}
                {...registerStep2('verificationCode')}
                data-testid="verification-code-input"
              />
            )}
          />

          {/* Password */}
          <FormInput
            label="密码"
            type="password"
            placeholder="至少6个字符"
            error={step2Errors.password?.message}
            required
            {...registerStep2('password')}
            data-testid="register-password-input"
          />

          {/* Confirm Password */}
          <FormInput
            label="确认密码"
            type="password"
            placeholder="再次输入密码"
            error={step2Errors.confirmPassword?.message}
            required
            {...registerStep2('confirmPassword')}
            data-testid="confirm-password-input"
          />

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={flow.isLoading}
            disabled={flow.isLoading}
            className="w-full"
            data-testid="register-submit-button"
          >
            注册
          </Button>

          {/* Back to Login */}
          <div className="text-center text-sm text-gray-600 space-y-2">
            <button
              type="button"
              onClick={() => flow.setStep(1)}
              className="block w-full text-indigo-600 hover:text-indigo-700"
              data-testid="back-to-modify-email-button"
            >
              返回修改邮箱
            </button>
            <Link to="/login" className="block text-indigo-600 hover:text-indigo-700 font-medium" data-testid="login-link-step2">
              已有账号？立即登录
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
