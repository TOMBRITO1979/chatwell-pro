import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { Kanban } from 'lucide-react';

export default function KanbanPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Kanban"
          description="Visualize e gerencie projetos e clientes em formato de quadro"
          icon={Kanban}
          color="text-chatwell-purple"
        />
        
        <div className="w-full">
          <p className="text-gray-600">Quadro Kanban será implementado aqui...</p>
        </div>
      </div>
    </MainLayout>
  );
}