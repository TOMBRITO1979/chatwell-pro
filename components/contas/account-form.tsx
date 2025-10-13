'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface AccountFormProps {
  account: any | null;
  onClose: () => void;
}

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

export function AccountForm({ account, onClose }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    due_date: '',
    paid_date: '',
    type: 'payable',
    status: 'pending',
    category: '',
    payment_method: '',
    recurring: false,
    recurring_interval: '',
    client_id: '',
    project_id: ''
  });

  useEffect(() => {
    loadClients();
    loadProjects();

    if (account) {
      // Format dates for date input
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setFormData({
        title: account.title || '',
        description: account.description || '',
        amount: account.amount || '',
        due_date: formatDateForInput(account.due_date),
        paid_date: account.paid_date ? formatDateForInput(account.paid_date) : '',
        type: account.type || 'payable',
        status: account.status || 'pending',
        category: account.category || '',
        payment_method: account.payment_method || '',
        recurring: account.recurring || false,
        recurring_interval: account.recurring_interval || '',
        client_id: account.client_id || '',
        project_id: account.project_id || ''
      });
    }
  }, [account]);

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setClients(data.clients.filter((c: any) => c.status === 'active'));
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setProjects(data.projects.filter((p: any) => p.status === 'active'));
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = account ? `/api/accounts/${account.id}` : '/api/accounts';
      const method = account ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        paid_date: formData.paid_date || null,
        recurring_interval: formData.recurring ? (parseInt(formData.recurring_interval) || null) : null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        alert(account ? 'Conta atualizada!' : 'Conta criada!');
        onClose();
      } else {
        alert(data.message || 'Erro ao salvar conta');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar conta');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    'Aluguel',
    'Fornecedores',
    'Serviços',
    'Salários',
    'Impostos',
    'Energia',
    'Internet',
    'Telefone',
    'Marketing',
    'Consultoria',
    'Software/SaaS',
    'Manutenção',
    'Outro'
  ];

  const paymentMethodOptions = [
    'Dinheiro',
    'Cartão de Crédito',
    'Cartão de Débito',
    'PIX',
    'Boleto',
    'Transferência Bancária',
    'Cheque',
    'Outro'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {account ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Ex: Pagamento de fornecedor"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais sobre a conta..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="payable">A Pagar</option>
                  <option value="receivable">A Receber</option>
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>
            </div>

            {/* Recorrência Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurring: e.target.checked,
                    recurring_interval: e.target.checked ? formData.recurring_interval : ''
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Label htmlFor="recurring" className="cursor-pointer font-semibold">
                  Conta Recorrente
                </Label>
              </div>

              {formData.recurring && (
                <div>
                  <Label htmlFor="recurring_interval">
                    Repetir a cada quantos dias? *
                  </Label>
                  <Input
                    id="recurring_interval"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.recurring_interval}
                    onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value })}
                    required={formData.recurring}
                    placeholder="Ex: 30 (para mensal), 7 (para semanal)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Exemplos: 7 dias (semanal), 15 dias (quinzenal), 30 dias (mensal), 90 dias (trimestral)
                  </p>
                </div>
              )}
            </div>

            {formData.status === 'paid' && (
              <div>
                <Label htmlFor="paid_date">Data de Pagamento</Label>
                <Input
                  id="paid_date"
                  type="date"
                  value={formData.paid_date}
                  onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Selecione uma categoria</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="payment_method">Método de Pagamento</Label>
                <select
                  id="payment_method"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="">Selecione um método</option>
                  {paymentMethodOptions.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Cliente (opcional)</Label>
                <select
                  id="client_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                >
                  <option value="">Nenhum cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="project_id">Projeto (opcional)</Label>
                <select
                  id="project_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">Nenhum projeto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="chatwell-gradient text-white">
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
