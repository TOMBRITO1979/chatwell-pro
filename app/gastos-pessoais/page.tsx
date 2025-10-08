'use client';

import { MainLayout } from '@/components/main-layout';
import { PersonalExpensesList } from '@/components/gastos-pessoais/personal-expenses-list';

export default function GastosPessoaisPage() {
  return (
    <MainLayout>
      <PersonalExpensesList />
    </MainLayout>
  );
}