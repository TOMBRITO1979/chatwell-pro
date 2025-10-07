import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { Users } from 'lucide-react';

export default function ClientesPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Clientes"
          description="Gerencie seus clientes, serviços contratados e histórico de relacionamento"
          icon={Users}
          color="text-chatwell-blue"
          action={{
            label: "Novo Cliente",
            onClick: () => console.log('Novo cliente')
          }}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-gray-600">Lista de clientes será implementada aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Filtros e estatísticas...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}