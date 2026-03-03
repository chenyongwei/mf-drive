import { AuthLayout, ForgotPasswordForm } from '../components/Auth';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="重置密码"
      subtitle="输入您的邮箱以重置密码"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
