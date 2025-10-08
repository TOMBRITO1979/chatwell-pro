'use client';

import { MainLayout } from '@/components/main-layout';
import { BusinessExpensesList } from '@/components/gastos-empresariais/business-expenses-list';

export default function GastosEmpresariaisPage() {
  return (
    <MainLayout>
      <BusinessExpensesList />
    </MainLayout>
  );
}