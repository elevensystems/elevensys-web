'use client';

import { SignupForm } from '@/components/features/auth/signup-form';
import { AuthLayout } from '@/components/layouts';

export default function Login() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
