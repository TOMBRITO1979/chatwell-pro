import { Suspense } from 'react';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}