import { AuthLayout, LoginForm } from '../components/Auth';

export default function LoginPage() {
  return (
    <AuthLayout
      title="登录"
      subtitle="欢迎回来！请登录您的账号"
    >
      <LoginForm />
    </AuthLayout>
  );
}
