import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { Briefcase } from 'lucide-react';

export default function ProjetosPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Projetos"
          description="Gerencie projetos, orçamentos, despesas e status de desenvolvimento"
          icon={Briefcase}
          color="text-chatwell-blue"
          action={{
            label: "Novo Projeto",
            onClick: () => console.log('Novo projeto')
          }}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <p className="text-gray-600">Lista de projetos será implementada aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Resumo de orçamentos...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}