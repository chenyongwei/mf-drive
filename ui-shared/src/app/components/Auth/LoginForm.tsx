import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, Button } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common';

const loginSchema = z.object({
  email: z.string().min(1, '请输入邮箱').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码').min(6, '密码至少需要6个字符'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      success('登录成功');
      navigate('/');
    } catch (err: any) {
      error(err.response?.data?.error || '登录失败，请检查邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
      {/* Email */}
      <FormInput
        label="邮箱"
        type="email"
        placeholder="your@email.com"
        error={errors.email?.message}
        required
        {...register('email')}
        data-testid="email-input"
      />

      {/* Password */}
      <FormInput
        label="密码"
        type="password"
        placeholder="请输入密码"
        error={errors.password?.message}
        required
        {...register('password')}
        data-testid="password-input"
      />

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            {...register('rememberMe')}
            data-testid="remember-me-checkbox"
          />
          记住我
        </label>

        <Link
          to="/forgot-password"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          data-testid="forgot-password-link"
        >
          忘记密码？
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isLoading}
        disabled={isLoading}
        className="w-full"
        data-testid="login-submit-button"
      >
        登录
      </Button>

      {/* Register Link */}
      <p className="text-center text-sm text-gray-600">
        还没有账号？{' '}
        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium" data-testid="register-link">
          立即注册
        </Link>
      </p>
    </form>
  );
}
