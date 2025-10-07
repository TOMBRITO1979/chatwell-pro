import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { Settings } from 'lucide-react';

export default function ConfiguracoesPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Configurações"
          description="Ajuste as configurações do sistema, notificações e preferências"
          icon={Settings}
          color="text-chatwell-purple"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600">Configurações gerais serão implementadas aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Preferências de notificação...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}