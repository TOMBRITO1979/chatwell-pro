'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, Palette, Globe, Database, Shield, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SMTPConfigForm } from '@/components/smtp/smtp-config-form';
import { WAHAConfigForm } from '@/components/waha/waha-config-form';

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    tasks: true,
    events: true,
    accounts: false
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL'
  });

  const handleIntegrationClick = (integration: string) => {
    alert(`A integração com ${integration} será implementada em breve! Esta funcionalidade está em desenvolvimento.`);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        return;
      }

      const data = await response.json();

      if (data.success && data.settings) {
        setNotifications({
          email: data.settings.notifications_email ?? true,
          push: data.settings.notifications_push ?? false,
          tasks: data.settings.notifications_tasks ?? true,
          events: data.settings.notifications_events ?? true,
          accounts: data.settings.notifications_accounts ?? false
        });
        setPreferences({
          theme: data.settings.theme ?? 'light',
          language: data.settings.language ?? 'pt-BR',
          dateFormat: data.settings.date_format ?? 'DD/MM/YYYY',
          currency: data.settings.currency ?? 'BRL'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notifications_email: notifications.email,
          notifications_push: notifications.push,
          notifications_tasks: notifications.tasks,
          notifications_events: notifications.events,
          notifications_accounts: notifications.accounts,
          theme: preferences.theme,
          language: preferences.language,
          date_format: preferences.dateFormat,
          currency: preferences.currency
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Configurações salvas com sucesso!\n\nNota: Para aplicar as mudanças visuais (tema, moeda, idioma), recarregue a página (F5).');
        // Automatically reload the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert(data.message || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-chatwell-blue" />
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajuste as configurações do sistema e preferências
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notif">Notificações por Email</Label>
                <p className="text-xs text-gray-500">Receba atualizações por email</p>
              </div>
              <input
                id="email-notif"
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notif">Notificações Push</Label>
                <p className="text-xs text-gray-500">Notificações no navegador</p>
              </div>
              <input
                id="push-notif"
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3">Notificar sobre:</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tasks-notif">Tarefas e Prazos</Label>
                  <input
                    id="tasks-notif"
                    type="checkbox"
                    checked={notifications.tasks}
                    onChange={(e) => setNotifications({ ...notifications, tasks: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="events-notif">Eventos da Agenda</Label>
                  <input
                    id="events-notif"
                    type="checkbox"
                    checked={notifications.events}
                    onChange={(e) => setNotifications({ ...notifications, events: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="accounts-notif">Contas a Pagar/Receber</Label>
                  <input
                    id="accounts-notif"
                    type="checkbox"
                    checked={notifications.accounts}
                    onChange={(e) => setNotifications({ ...notifications, accounts: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Aparência e Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Tema</Label>
              <select
                id="theme"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
              >
                <option value="light">☀️ Claro</option>
                <option value="dark">🌙 Escuro</option>
                <option value="auto">🔄 Automático</option>
              </select>
            </div>

            <div>
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              >
                <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="es-ES">🇪🇸 Español</option>
              </select>
            </div>

            <div>
              <Label htmlFor="dateFormat">Formato de Data</Label>
              <select
                id="dateFormat"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Moeda</Label>
              <select
                id="currency"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
              >
                <option value="BRL">R$ Real (BRL)</option>
                <option value="USD">$ Dólar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-yellow-800">
                <strong>ℹ️ Importante:</strong> Após salvar as configurações de aparência, a página será recarregada automaticamente para aplicar as mudanças visuais.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Integrações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    W
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp (WAHA)</p>
                    <p className="text-xs text-gray-500">Não conectado</p>
                  </div>
                </div>
                <button
                  onClick={() => handleIntegrationClick('WhatsApp (WAHA)')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Conectar
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    G
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-xs text-gray-500">Não conectado</p>
                  </div>
                </div>
                <button
                  onClick={() => handleIntegrationClick('Google Calendar')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Conectar
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> As integrações permitem sincronizar dados e automatizar tarefas com outros serviços.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuração SMTP */}
        <div className="lg:col-span-2">
          <SMTPConfigForm />
        </div>

        {/* Configuração WAHA (WhatsApp) */}
        <div className="lg:col-span-2">
          <WAHAConfigForm />
        </div>

        {/* Dados e Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Dados e Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <p className="font-medium">Backup de Dados</p>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Faça backup dos seus dados regularmente
              </p>
              <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Fazer Backup Agora
              </button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <p className="font-medium">Exportar Dados</p>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Baixe uma cópia de todos os seus dados
              </p>
              <button className="text-sm border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md">
                Exportar em JSON
              </button>
            </div>

            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-red-600" />
                <p className="font-medium text-red-800">Zona de Perigo</p>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Ações irreversíveis na sua conta
              </p>
              <button className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                Deletar Conta
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Salvar Flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="chatwell-gradient text-white shadow-lg hover:shadow-xl transition-all"
          size="lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
