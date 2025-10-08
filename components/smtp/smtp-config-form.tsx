'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
}

export function SMTPConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState<SMTPSettings>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    is_active: false
  });

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

      const response = await fetch('/api/smtp/config', {
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
          host: data.settings.host || '',
          port: data.settings.port || 587,
          secure: data.settings.secure ?? false,
          username: data.settings.username || '',
          password: '', // Não retornamos a senha por segurança
          from_email: data.settings.from_email || '',
          from_name: data.settings.from_name || '',
          is_active: data.settings.is_active ?? false
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações SMTP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!formData.host || !formData.port || !formData.username || !formData.password || !formData.from_email) {
      setTestResult({
        success: false,
        message: 'Preencha todos os campos obrigatórios antes de testar'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          send_test_email: testEmail ? true : false,
          test_email: testEmail || undefined
        })
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erro ao testar conexão'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.host || !formData.port || !formData.username || !formData.password || !formData.from_email) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/smtp/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Configurações SMTP salvas com sucesso!');
        loadSettings();
      } else {
        alert(data.message || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações SMTP');
    } finally {
      setSaving(false);
    }
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
          <Mail className="w-5 h-5 text-blue-600" />
          Configuração SMTP
        </CardTitle>
        <CardDescription>
          Configure seu servidor SMTP para envio de emails automáticos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Host */}
        <div>
          <Label htmlFor="host">Servidor SMTP (Host) *</Label>
          <Input
            id="host"
            type="text"
            placeholder="smtp.gmail.com"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Ex: smtp.gmail.com, smtp.office365.com, smtp.mailgun.org
          </p>
        </div>

        {/* Porta e Segurança */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="port">Porta *</Label>
            <Input
              id="port"
              type="number"
              placeholder="587"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 587 })}
            />
            <p className="text-xs text-gray-500 mt-1">
              587 (TLS) ou 465 (SSL)
            </p>
          </div>

          <div>
            <Label htmlFor="secure">Conexão Segura</Label>
            <select
              id="secure"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.secure ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, secure: e.target.value === 'true' })}
            >
              <option value="false">TLS (porta 587)</option>
              <option value="true">SSL (porta 465)</option>
            </select>
          </div>
        </div>

        {/* Usuário */}
        <div>
          <Label htmlFor="username">Usuário (Email) *</Label>
          <Input
            id="username"
            type="email"
            placeholder="seu-email@exemplo.com"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        {/* Senha */}
        <div>
          <Label htmlFor="password">Senha *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha ou senha de app"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Para Gmail, use "Senhas de app" em vez da senha principal
          </p>
        </div>

        {/* Email de Origem */}
        <div>
          <Label htmlFor="from_email">Email de Origem *</Label>
          <Input
            id="from_email"
            type="email"
            placeholder="noreply@exemplo.com"
            value={formData.from_email}
            onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Email que aparecerá como remetente
          </p>
        </div>

        {/* Nome de Origem */}
        <div>
          <Label htmlFor="from_name">Nome de Origem</Label>
          <Input
            id="from_name"
            type="text"
            placeholder="Chatwell Pro"
            value={formData.from_name}
            onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Nome que aparecerá como remetente (opcional)
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="is_active">Ativar envio de emails</Label>
            <p className="text-xs text-gray-500">
              Habilitar envio automático de notificações
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

        {/* Teste de Conexão */}
        <div className="border-t pt-4 mt-4">
          <Label htmlFor="test_email">Testar Configuração</Label>
          <p className="text-xs text-gray-500 mb-2">
            Digite um email para receber um email de teste (opcional)
          </p>
          <div className="flex gap-2">
            <Input
              id="test_email"
              type="email"
              placeholder="seu-email@exemplo.com (opcional)"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleTest}
              disabled={testing}
              variant="outline"
              className="whitespace-nowrap"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Testar
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
              testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {testResult.success ? (
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4">
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
        </div>

        {/* Informações Adicionais */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-blue-900 mb-2">📧 Configurações Comuns</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>Gmail:</strong> smtp.gmail.com:587 (TLS) - Requer senha de app</p>
            <p><strong>Outlook/Office365:</strong> smtp.office365.com:587 (TLS)</p>
            <p><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS)</p>
            <p><strong>SendGrid:</strong> smtp.sendgrid.net:587 (TLS)</p>
            <p><strong>Mailgun:</strong> smtp.mailgun.org:587 (TLS)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
