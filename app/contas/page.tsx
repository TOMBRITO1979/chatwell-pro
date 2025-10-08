'use client';

import { MainLayout } from '@/components/main-layout';
import { AccountsList } from '@/components/contas/accounts-list';

export default function ContasPage() {
  return (
    <MainLayout>
      <AccountsList />
    </MainLayout>
  );
}