'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Loader2, Check, AlertCircle, QrCode, Power, RefreshCw, LogOut, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface WAHASettings {
  api_url: string;
  api_key: string;
  session_name: string;
  webhook_url: string;
  is_active: boolean;
  status?: string;
  qr_code?: string;
}

export function WAHAConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<WAHASettings>({
    api_url: '',
    api_key: '',
    session_name: 'default',
    webhook_url: '',
    is_active: false,
    status: 'disconnected'
  });

  useEffect(() => {
    loadSettings();
    loadSessionStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const response = await fetch('/api/waha/config', {
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
        setFormData({
          api_url: data.settings.api_url || '',
          api_key: data.settings.api_key || '',
          session_name: data.settings.session_name || 'default',
          webhook_url: data.settings.webhook_url || '',
          is_active: data.settings.is_active ?? false,
          status: data.settings.status || 'disconnected',
          qr_code: data.settings.qr_code
        });
        if (data.settings.qr_code) {
          setQrCode(data.settings.qr_code);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações WAHA:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/waha/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.session) {
        setSessionStatus(data.session);
        setFormData(prev => ({ ...prev, status: data.session.status }));
      }
    } catch (error) {
      console.error('Erro ao carregar status da sessão:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.api_url || !formData.session_name) {
      setStatusMessage({ type: 'error', text: 'URL da API e nome da sessão são obrigatórios' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/waha/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        loadSettings();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Erro ao salvar configurações' });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setStatusMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  const handleSessionAction = async (action: 'start' | 'stop' | 'restart' | 'logout') => {
    setSessionLoading(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/waha/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          loadSessionStatus();
          if (action === 'start') {
            loadQRCode();
          } else if (action === 'logout' || action === 'stop') {
            setQrCode(null);
          }
        }, 1000);
      } else {
        setStatusMessage({ type: 'error', text: data.message });
      }
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'Erro ao gerenciar sessão' });
    } finally {
      setSessionLoading(false);
    }
  };

  const loadQRCode = async () => {
    setQrLoading(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/waha/qr', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.qr_code);
        setStatusMessage({ type: 'success', text: 'QR Code carregado! Escaneie com WhatsApp.' });
      } else {
        setStatusMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Erro ao carregar QR Code' });
    } finally {
      setQrLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WORKING':
      case 'CONNECTED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'SCAN_QR_CODE':
      case 'STARTING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'FAILED':
      case 'STOPPED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: any = {
      'WORKING': '✅ Conectado',
      'CONNECTED': '✅ Conectado',
      'SCAN_QR_CODE': '📱 Aguardando QR Code',
      'STARTING': '🔄 Iniciando...',
      'FAILED': '❌ Falhou',
      'STOPPED': '⏸️ Parado',
      'disconnected': '⏸️ Desconectado',
      'stopped': '⏸️ Parado'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" />
          Integração WhatsApp (WAHA)
        </CardTitle>
        <CardDescription>
          Configure a conexão com WhatsApp HTTP API (WAHA)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Sessão */}
        {formData.status && (
          <div className={`p-4 rounded-lg border-2 ${getStatusColor(formData.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status da Sessão</p>
                <p className="text-sm">{getStatusText(formData.status)}</p>
              </div>
              {sessionStatus?.me && (
                <div className="text-right text-sm">
                  <p className="font-medium">{sessionStatus.me.pushName}</p>
                  <p className="text-xs opacity-75">{sessionStatus.me.id}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensagens de Status */}
        {statusMessage && (
          <div className={`p-3 rounded-lg flex items-start gap-2 ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{statusMessage.text}</p>
          </div>
        )}

        {/* URL da API */}
        <div>
          <Label htmlFor="api_url">URL da API WAHA *</Label>
          <Input
            id="api_url"
            type="url"
            placeholder="http://localhost:3000 ou https://waha.exemplo.com"
            value={formData.api_url}
            onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            URL completa do servidor WAHA (incluindo protocolo e porta)
          </p>
        </div>

        {/* API Key */}
        <div>
          <Label htmlFor="api_key">API Key (Opcional)</Label>
          <Input
            id="api_key"
            type="password"
            placeholder="Deixe vazio se não usar autenticação"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Se configurou autenticação no WAHA, insira a chave aqui
          </p>
        </div>

        {/* Nome da Sessão */}
        <div>
          <Label htmlFor="session_name">Nome da Sessão *</Label>
          <Input
            id="session_name"
            type="text"
            placeholder="default"
            value={formData.session_name}
            onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Identificador único da sessão WhatsApp
          </p>
        </div>

        {/* Webhook URL */}
        <div>
          <Label htmlFor="webhook_url">Webhook URL</Label>
          <Input
            id="webhook_url"
            type="url"
            placeholder="https://app.chatwell.pro/api/webhooks/waha"
            value={formData.webhook_url}
            onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            URL para receber mensagens do WhatsApp (opcional)
          </p>
        </div>

        {/* Ativar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="is_active">Ativar Integração</Label>
            <p className="text-xs text-gray-500">
              Habilitar envio/recebimento de mensagens
            </p>
          </div>
          <input
            id="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="chatwell-gradient text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>

          <Button
            onClick={() => handleSessionAction('start')}
            disabled={sessionLoading || formData.status === 'WORKING'}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Power className="w-4 h-4 mr-2" />
            Iniciar Sessão
          </Button>

          <Button
            onClick={loadQRCode}
            disabled={qrLoading}
            variant="outline"
          >
            {qrLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <QrCode className="w-4 h-4 mr-2" />
            )}
            Obter QR Code
          </Button>

          <Button
            onClick={() => handleSessionAction('restart')}
            disabled={sessionLoading}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>

          <Button
            onClick={() => handleSessionAction('logout')}
            disabled={sessionLoading}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Desconectar
          </Button>

          <Button
            onClick={() => handleSessionAction('stop')}
            disabled={sessionLoading}
            variant="outline"
            className="border-gray-600 text-gray-600"
          >
            <Power className="w-4 h-4 mr-2" />
            Parar Sessão
          </Button>
        </div>

        {/* QR Code */}
        {qrCode && (
          <div className="p-4 bg-white border-2 border-green-500 rounded-lg">
            <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Escaneie o QR Code com WhatsApp
            </h4>
            <div className="flex justify-center bg-white p-4 rounded">
              <img src={qrCode} alt="QR Code WhatsApp" className="max-w-xs" />
            </div>
            <p className="text-xs text-center text-gray-600 mt-3">
              Abra o WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        )}

        {/* Documentação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Sobre WAHA
          </h4>
          <div className="text-xs text-blue-800 space-y-2">
            <p><strong>WAHA (WhatsApp HTTP API)</strong> é uma API HTTP para WhatsApp que não requer Selenium ou Chrome.</p>
            <p><strong>Instalação:</strong> docker run -it -p 3000:3000 devlikeapro/waha</p>
            <p><strong>Documentação:</strong> <a href="https://waha.devlike.pro" target="_blank" rel="noopener noreferrer" className="underline">waha.devlike.pro</a></p>
            <p><strong>GitHub:</strong> <a href="https://github.com/devlikeapro/waha" target="_blank" rel="noopener noreferrer" className="underline">github.com/devlikeapro/waha</a></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
