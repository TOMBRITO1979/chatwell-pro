'use client';

import { MainLayout } from '@/components/main-layout';
import { PurchasesList } from '@/components/compras/purchases-list';

export default function ComprasPage() {
  return (
    <MainLayout>
      <PurchasesList />
    </MainLayout>
  );
}