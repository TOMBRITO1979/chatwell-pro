import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { User } from 'lucide-react';

export default function PerfilPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Perfil do Usuário"
          description="Configure seu perfil, conexões WhatsApp, email e Google Calendar"
          icon={User}
          color="text-chatwell-green"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600">Dados pessoais serão implementados aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Conexões e integrações...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}