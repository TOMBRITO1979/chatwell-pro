import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/common/page-header';
import { Calendar } from 'lucide-react';

export default function AgendaPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 xl:p-8">
        <PageHeader
          title="Agenda"
          description="Gerencie compromissos, eventos e integração com Google Calendar"
          icon={Calendar}
          color="text-chatwell-purple"
          action={{
            label: "Novo Agendamento",
            onClick: () => console.log('Novo agendamento')
          }}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <p className="text-gray-600">Calendário será implementado aqui...</p>
          </div>
          <div>
            <p className="text-gray-600">Próximos eventos...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}