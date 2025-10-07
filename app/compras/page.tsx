import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { ShoppingCart } from 'lucide-react';

export default function ComprasPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Lista de Compras"
          description="Organize suas compras, quantidades e prioridades"
          icon={ShoppingCart}
          color="text-chatwell-green"
          action={{
            label: "Novo Item",
            onClick: () => console.log('Novo item')
          }}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-gray-600">Lista de compras será implementada aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Resumo de gastos...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}