'use client';

import { MainLayout } from '@/components/main-layout';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';

export default function HomePage() {
  return (
    <MainLayout>
      <DashboardStats />
    </MainLayout>
  );
}