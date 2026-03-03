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

// Step 2: Email, code, and new password
const resetSchema = z.object({
  email: z.string().min(1, '请输入邮箱').email('请输入有效的邮箱地址'),
  resetCode: z.string().min(6, '请输入6位验证码').max(6, '验证码为6位数字'),
  newPassword: z.string().min(6, '密码至少需要6个字符'),
  confirmPassword: z.string().min(6, '请确认密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const { sendResetCode, resetPassword } = useAuth();
  const { success, error } = useToast();
  const {
    step,
    setStep,
    isLoading,
    setIsLoading,
    isSendingCode,
    setIsSendingCode,
    email,
    setEmail,
    countdown,
    setCountdown,
  } = useTwoStepEmailFlow();

  // Step 1 form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useEmailStepForm();

  // Step 2 form
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: step2Errors },
  } = useZodStepForm<ResetFormData>({
    schema: resetSchema,
    defaultValues: {
      email,
      resetCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSendCode = async (data: EmailFormData) => {
    setIsSendingCode(true);
    try {
      await sendResetCode(data.email);
      setEmail(data.email);
      setStep(2);
      setCountdown(60);
      success('验证码已发送到您的邮箱');
    } catch (err: any) {
      error(err.response?.data?.error || '发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsSendingCode(true);
    try {
      await sendResetCode(email);
      setCountdown(60);
      success('验证码已重新发送');
    } catch (err: any) {
      error(err.response?.data?.error || '发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      await resetPassword({
        email: data.email,
        resetCode: data.resetCode,
        newPassword: data.newPassword,
      });
      success('密码重置成功，请使用新密码登录');
      navigate('/login');
    } catch (err: any) {
      error(err.response?.data?.error || '密码重置失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 1 ? (
        // Step 1: Email input
        <form onSubmit={handleSubmitEmail(handleSendCode)} className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              请输入您的邮箱地址，我们将向您发送验证码以重置密码。
            </p>
          </div>

          <FormInput
            label="邮箱"
            type="email"
            placeholder="your@email.com"
            error={emailErrors.email?.message}
            required
            {...registerEmail('email')}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSendingCode}
            disabled={isSendingCode}
            className="w-full"
          >
            发送验证码
          </Button>

          <div className="text-center text-sm text-gray-600">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              返回登录
            </Link>
          </div>
        </form>
      ) : (
        // Step 2: Code, new password
        <form onSubmit={handleSubmitStep2(onSubmit)} className="space-y-4">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600">
              {email}
            </div>
          </div>

          <VerificationCodeSection
            countdown={countdown}
            isSendingCode={isSendingCode}
            onResend={handleResendCode}
            errorMessage={step2Errors.resetCode?.message}
            inputField={(
              <FormInput
                type="text"
                placeholder="6位验证码"
                error={step2Errors.resetCode?.message}
                className="flex-1"
                maxLength={6}
                {...registerStep2('resetCode')}
              />
            )}
          />

          {/* New Password */}
          <FormInput
            label="新密码"
            type="password"
            placeholder="至少6个字符"
            error={step2Errors.newPassword?.message}
            required
            {...registerStep2('newPassword')}
          />

          {/* Confirm Password */}
          <FormInput
            label="确认新密码"
            type="password"
            placeholder="再次输入密码"
            error={step2Errors.confirmPassword?.message}
            required
            {...registerStep2('confirmPassword')}
          />

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            重置密码
          </Button>

          {/* Back to Login */}
          <div className="text-center text-sm text-gray-600 space-y-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="block w-full text-indigo-600 hover:text-indigo-700"
            >
              返回修改邮箱
            </button>
            <Link to="/login" className="block text-indigo-600 hover:text-indigo-700 font-medium">
              返回登录
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
