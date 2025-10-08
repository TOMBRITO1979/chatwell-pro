'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, Search, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PersonalExpenseForm } from './personal-expense-form';

interface PersonalExpense {
  id: string;
  description: string;
  amount: string;
  expense_date: string;
  category: string;
  payment_method: string;
  vendor: string | null;
  receipt_number: string | null;
  status: 'pending' | 'paid';
  payment_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  paid: number;
  total_amount: number;
  total_pending: number;
  total_paid: number;
}

export function PersonalExpensesList() {
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PersonalExpense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    paid: 0,
    total_amount: 0,
    total_pending: 0,
    total_paid: 0
  });

  useEffect(() => {
    loadExpenses();
  }, [search, filterCategory, filterPaymentMethod, filterStatus]);

  const loadExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      let url = '/api/personal-expenses?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (filterCategory) url += `category=${filterCategory}&`;
      if (filterPaymentMethod) url += `payment_method=${filterPaymentMethod}&`;
      if (filterStatus) url += `status=${filterStatus}&`;

      const response = await fetch(url, {
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

      if (data.success) {
        setExpenses(data.expenses);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar gastos pessoais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este gasto?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/personal-expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        loadExpenses();
      } else {
        alert(data.message || 'Erro ao deletar gasto');
      }
    } catch (error) {
      console.error('Erro ao deletar gasto:', error);
      alert('Erro ao deletar gasto');
    }
  };

  const handleEdit = (expense: PersonalExpense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleToggleStatus = async (expense: PersonalExpense) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = expense.status === 'paid' ? 'pending' : 'paid';

      const response = await fetch(`/api/personal-expenses/${expense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expense,
          status: newStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        loadExpenses();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingExpense(null);
    loadExpenses();
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'alimentacao': '🍽️ Alimentação',
      'transporte': '🚗 Transporte',
      'moradia': '🏠 Moradia',
      'saude': '💊 Saúde',
      'educacao': '📚 Educação',
      'lazer': '🎮 Lazer',
      'vestuario': '👔 Vestuário',
      'telefone': '📱 Telefone/Internet',
      'investimentos': '💰 Investimentos',
      'outros': '📋 Outros'
    };
    return categories[category] || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'dinheiro': '💵 Dinheiro',
      'cartao_credito': '💳 Cartão de Crédito',
      'cartao_debito': '💳 Cartão de Débito',
      'transferencia': '🏦 Transferência',
      'pix': '📱 PIX',
      'boleto': '📄 Boleto',
      'cheque': '📝 Cheque'
    };
    return methods[method] || method;
  };

  const categories = ['alimentacao', 'transporte', 'moradia', 'saude', 'educacao', 'lazer', 'vestuario', 'telefone', 'investimentos', 'outros'];
  const paymentMethods = ['dinheiro', 'cartao_credito', 'cartao_debito', 'transferencia', 'pix', 'boleto', 'cheque'];

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-chatwell-blue" />
            Gastos Pessoais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle suas despesas pessoais e finanças
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="chatwell-gradient text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Gasto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1">
              {formatCurrency(stats.total_amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-yellow-600 mt-1 font-semibold">
              {formatCurrency(stats.total_pending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            <p className="text-sm text-green-600 mt-1 font-semibold">
              {formatCurrency(stats.total_paid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar por descrição, fornecedor, notas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
              >
                <option value="">Todos os métodos</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{getPaymentMethodLabel(method)}</option>
                ))}
              </select>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando gastos...</p>
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              {search || filterCategory || filterPaymentMethod || filterStatus
                ? 'Nenhum gasto encontrado'
                : 'Nenhum gasto registrado ainda'}
            </p>
            {!search && !filterCategory && !filterPaymentMethod && !filterStatus && (
              <Button onClick={() => setShowForm(true)} className="chatwell-gradient text-white">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Gasto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card
              key={expense.id}
              className={`hover:shadow-lg transition-shadow ${
                expense.status === 'paid' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-500'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {expense.description}
                        </h3>
                        <div className="flex flex-wrap gap-3 items-center text-sm">
                          <span className="text-gray-600">
                            {getCategoryLabel(expense.category)}
                          </span>
                          <span className="text-gray-600">
                            {getPaymentMethodLabel(expense.payment_method)}
                          </span>
                          <span className="font-semibold text-lg text-blue-600">
                            {formatCurrency(expense.amount)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            expense.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {expense.status === 'paid' ? '✓ Pago' : '⏱ Pendente'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(expense.expense_date)}
                      </span>
                      {expense.vendor && (
                        <span>🏪 {expense.vendor}</span>
                      )}
                      {expense.receipt_number && (
                        <span>🧾 #{expense.receipt_number}</span>
                      )}
                    </div>

                    {expense.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        📝 {expense.notes}
                      </p>
                    )}

                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant={expense.status === 'paid' ? 'outline' : 'default'}
                        onClick={() => handleToggleStatus(expense)}
                        className={expense.status === 'paid' ? '' : 'bg-green-600 hover:bg-green-700 text-white'}
                      >
                        {expense.status === 'paid' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PersonalExpenseForm
          expense={editingExpense}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
