'use client';

import { MainLayout } from '@/components/main-layout';
import { CalendarView } from '@/components/agenda/calendar-view';

export default function AgendaPage() {
  return (
    <MainLayout>
      <CalendarView />
    </MainLayout>
  );
}