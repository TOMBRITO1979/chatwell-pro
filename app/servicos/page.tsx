'use client';

import { MainLayout } from '@/components/main-layout';
import { ServicesList } from '@/components/servicos/services-list';

export default function ServicosPage() {
  return (
    <MainLayout>
      <ServicesList />
    </MainLayout>
  );
}
