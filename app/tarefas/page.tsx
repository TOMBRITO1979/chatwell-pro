'use client';

import { MainLayout } from '@/components/main-layout';
import { TasksList } from '@/components/tarefas/tasks-list';

export default function TarefasPage() {
  return (
    <MainLayout>
      <TasksList />
    </MainLayout>
  );
}