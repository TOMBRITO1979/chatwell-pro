import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { TrendingDown } from 'lucide-react';

export default function GastosPessoaisPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Gastos Pessoais"
          description="Controle suas despesas pessoais com categorização e análises"
          icon={TrendingDown}
          color="text-chatwell-red"
          action={{
            label: "Nova Despesa",
            onClick: () => console.log('Nova despesa pessoal')
          }}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-gray-600">Lista de gastos pessoais será implementada aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Gráficos e análises...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}