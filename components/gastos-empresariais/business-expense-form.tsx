'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface BusinessExpenseFormProps {
  expense: any | null;
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

export function BusinessExpenseForm({ expense, onClose }: BusinessExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: '',
    category: 'outros',
    payment_method: 'dinheiro',
    vendor: '',
    receipt_number: '',
    status: 'pending',
    client_id: '',
    project_id: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
    loadProjects();

    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : '',
        category: expense.category || 'outros',
        payment_method: expense.payment_method || 'dinheiro',
        vendor: expense.vendor || '',
        receipt_number: expense.receipt_number || '',
        status: expense.status || 'pending',
        client_id: expense.client_id || '',
        project_id: expense.project_id || '',
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
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
      const url = expense ? `/api/business-expenses/${expense.id}` : '/api/business-expenses';
      const method = expense ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        vendor: formData.vendor || null,
        receipt_number: formData.receipt_number || null,
        notes: formData.notes || null
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
        alert(expense ? 'Gasto atualizado!' : 'Gasto adicionado!');
        onClose();
      } else {
        alert(data.message || 'Erro ao salvar gasto');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar gasto');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'salarios', label: '👥 Salários' },
    { value: 'aluguel', label: '🏢 Aluguel' },
    { value: 'utilities', label: '💡 Utilidades' },
    { value: 'marketing', label: '📢 Marketing' },
    { value: 'equipamentos', label: '🖥️ Equipamentos' },
    { value: 'viagens', label: '✈️ Viagens' },
    { value: 'fornecedores', label: '📦 Fornecedores' },
    { value: 'impostos', label: '🧾 Impostos' },
    { value: 'servicos', label: '🔧 Serviços' },
    { value: 'outros', label: '📋 Outros' }
  ];

  const paymentMethods = [
    { value: 'dinheiro', label: '💵 Dinheiro' },
    { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
    { value: 'cartao_debito', label: '💳 Cartão de Débito' },
    { value: 'transferencia', label: '🏦 Transferência' },
    { value: 'pix', label: '📱 PIX' },
    { value: 'boleto', label: '📄 Boleto' },
    { value: 'cheque', label: '📝 Cheque' },
    { value: 'zelle', label: '💸 Zelle' },
    { value: 'venmo', label: '💸 Venmo' },
    { value: 'paypal', label: '💸 PayPal' },
    { value: 'cash_app', label: '💸 Cash App' },
    { value: 'apple_pay', label: '🍎 Apple Pay' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {expense ? 'Editar Gasto Empresarial' : 'Adicionar Gasto Empresarial'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Ex: Pagamento de fornecedor, Conta de energia..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="expense_date">Data do Gasto *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="payment_method">Método de Pagamento *</Label>
                <select
                  id="payment_method"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  required
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendor">Fornecedor/Beneficiário</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Nome do fornecedor..."
                />
              </div>
              <div>
                <Label htmlFor="receipt_number">Número do Recibo/NF</Label>
                <Input
                  id="receipt_number"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  placeholder="Ex: NF-12345"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">⏱ Pendente</option>
                <option value="paid">✓ Pago</option>
              </select>
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
                  <option value="">Nenhum</option>
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
                  <option value="">Nenhum</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalhes adicionais sobre o gasto..."
              />
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
