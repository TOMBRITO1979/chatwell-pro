'use client';

import { MainLayout } from '@/components/main-layout';
import { ClientesList } from '@/components/clientes/clients-list';

export default function ClientesPage() {
  return (
    <MainLayout>
      <ClientesList />
    </MainLayout>
  );
}