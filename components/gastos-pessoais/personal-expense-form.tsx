'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface PersonalExpenseFormProps {
  expense: any | null;
  onClose: () => void;
}

export function PersonalExpenseForm({ expense, onClose }: PersonalExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: '',
    category: 'outros',
    payment_method: 'dinheiro',
    vendor: '',
    receipt_number: '',
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
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
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = expense ? `/api/personal-expenses/${expense.id}` : '/api/personal-expenses';
      const method = expense ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
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
    { value: 'alimentacao', label: '🍽️ Alimentação' },
    { value: 'transporte', label: '🚗 Transporte' },
    { value: 'moradia', label: '🏠 Moradia' },
    { value: 'saude', label: '💊 Saúde' },
    { value: 'educacao', label: '📚 Educação' },
    { value: 'lazer', label: '🎮 Lazer' },
    { value: 'vestuario', label: '👔 Vestuário' },
    { value: 'telefone', label: '📱 Telefone/Internet' },
    { value: 'investimentos', label: '💰 Investimentos' },
    { value: 'outros', label: '📋 Outros' }
  ];

  const paymentMethods = [
    { value: 'dinheiro', label: '💵 Dinheiro' },
    { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
    { value: 'cartao_debito', label: '💳 Cartão de Débito' },
    { value: 'transferencia', label: '🏦 Transferência' },
    { value: 'pix', label: '📱 PIX' },
    { value: 'boleto', label: '📄 Boleto' },
    { value: 'cheque', label: '📝 Cheque' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {expense ? 'Editar Gasto Pessoal' : 'Adicionar Gasto Pessoal'}
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
                placeholder="Ex: Almoço, Uber, Conta de luz..."
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
                <Label htmlFor="vendor">Local/Fornecedor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Ex: Restaurante, loja..."
                />
              </div>
              <div>
                <Label htmlFor="receipt_number">Número do Recibo</Label>
                <Input
                  id="receipt_number"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  placeholder="Ex: #12345"
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
