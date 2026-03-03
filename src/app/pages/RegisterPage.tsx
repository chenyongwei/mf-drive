import { AuthLayout, RegisterForm } from '../components/Auth';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="注册"
      subtitle="创建您的账号，开始使用CloudNest"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
