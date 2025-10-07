import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { TrendingUp } from 'lucide-react';

export default function GastosEmpresariaisPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Gastos Empresariais"
          description="Controle despesas da empresa com categorização e relatórios"
          icon={TrendingUp}
          color="text-chatwell-blue"
          action={{
            label: "Nova Despesa",
            onClick: () => console.log('Nova despesa')
          }}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-gray-600">Lista de gastos empresariais será implementada aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Gráficos e relatórios...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}