'use client';

import { MainLayout } from '@/components/main-layout';
import { KanbanBoard } from '@/components/kanban/kanban-board';

export default function KanbanPage() {
  return (
    <MainLayout>
      <KanbanBoard />
    </MainLayout>
  );
}