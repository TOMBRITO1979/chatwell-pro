'use client';

import { MainLayout } from '@/components/main-layout';
import { SettingsForm } from '@/components/configuracoes/settings-form';

export default function ConfiguracoesPage() {
  return (
    <MainLayout>
      <SettingsForm />
    </MainLayout>
  );
}