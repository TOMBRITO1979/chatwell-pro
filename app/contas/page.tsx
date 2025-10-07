import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { CreditCard } from 'lucide-react';

export default function ContasPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Contas a Pagar"
          description="Controle suas contas, vencimentos e notificações automáticas"
          icon={CreditCard}
          color="text-chatwell-red"
          action={{
            label: "Nova Conta",
            onClick: () => console.log('Nova conta')
          }}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-gray-600">Lista de contas será implementada aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Resumo financeiro...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}