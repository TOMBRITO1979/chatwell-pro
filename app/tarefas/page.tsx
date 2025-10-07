import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { CheckSquare } from 'lucide-react';

export default function TarefasPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Tarefas"
          description="Organize suas tarefas, defina prazos e acompanhe o progresso"
          icon={CheckSquare}
          color="text-chatwell-green"
          action={{
            label: "Nova Tarefa",
            onClick: () => console.log('Nova tarefa')
          }}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-gray-600">Lista de tarefas será implementada aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Estatisticas de produtividade...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}