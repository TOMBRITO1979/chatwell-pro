'use client';

import { MainLayout } from '@/components/main-layout';
import { ProjectsList } from '@/components/projetos/projects-list';

export default function ProjetosPage() {
  return (
    <MainLayout>
      <ProjectsList />
    </MainLayout>
  );
}