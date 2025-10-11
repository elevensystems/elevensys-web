'use client';

import { LoginForm } from '@/components/features/auth/login-form';
import { AuthLayout } from '@/components/layouts';

export default function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
