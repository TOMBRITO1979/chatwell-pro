'use client';

import { Settings } from 'lucide-react';
import { SMTPConfigForm } from '@/components/smtp/smtp-config-form';
import { WAHAConfigForm } from '@/components/waha/waha-config-form';

export function SettingsForm() {
  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-chatwell-blue" />
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as integrações do sistema
        </p>
      </div>

      <div className="space-y-6">
        {/* Configuração SMTP */}
        <SMTPConfigForm />

        {/* Configuração WAHA (WhatsApp) */}
        <WAHAConfigForm />
      </div>
    </div>
  );
}
