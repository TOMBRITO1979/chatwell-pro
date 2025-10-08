'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, Search, Edit, Trash2, Calendar, DollarSign, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountForm } from './account-form';

interface Account {
  id: string;
  description: string;
  amount: string;
  due_date: string;
  payment_date: string | null;
  type: 'payable' | 'receivable';
  status: 'pending' | 'paid' | 'overdue';
  category: string | null;
  payment_method: string | null;
  notes: string | null;
  client_name: string | null;
  project_name: string | null;
  client_id: string | null;
  project_id: string | null;
  created_at: string;
}

interface Stats {
  total_payable: number;
  total_receivable: number;
  pending_payable: number;
  pending_receivable: number;
  paid_payable: number;
  paid_receivable: number;
  overdue_payable: number;
  overdue_receivable: number;
}

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    total_payable: 0,
    total_receivable: 0,
    pending_payable: 0,
    pending_receivable: 0,
    paid_payable: 0,
    paid_receivable: 0,
    overdue_payable: 0,
    overdue_receivable: 0
  });

  useEffect(() => {
    loadAccounts();
  }, [search, filterType, filterStatus]);

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      let url = '/api/accounts?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (filterType) url += `type=${filterType}&`;
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
        setAccounts(data.accounts);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta conta?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        loadAccounts();
      } else {
        alert(data.message || 'Erro ao deletar conta');
      }
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      alert('Erro ao deletar conta');
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAccount(null);
    loadAccounts();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'payable' ? 'A Pagar' : 'A Receber';
  };

  const getTypeColor = (type: string) => {
    return type === 'payable' ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-chatwell-blue" />
            Contas a Pagar/Receber
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas contas a pagar e a receber
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="chatwell-gradient text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.total_payable)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Pendente: {formatCurrency(stats.pending_payable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.total_receivable)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Pendente: {formatCurrency(stats.pending_receivable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Contas Vencidas (Pagar)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.overdue_payable)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Saldo (Receber - Pagar)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              stats.total_receivable - stats.total_payable >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {formatCurrency(stats.total_receivable - stats.total_payable)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar por descrição ou categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Todos os tipos</option>
                <option value="payable">A Pagar</option>
                <option value="receivable">A Receber</option>
              </select>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando contas...</p>
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              {search || filterType || filterStatus
                ? 'Nenhuma conta encontrada'
                : 'Nenhuma conta cadastrada ainda'}
            </p>
            {!search && !filterType && !filterStatus && (
              <Button onClick={() => setShowForm(true)} className="chatwell-gradient text-white">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Conta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{account.description}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(account.status)}`}>
                        {getStatusLabel(account.status)}
                      </span>
                      <span className={`text-sm font-medium ${getTypeColor(account.type)}`}>
                        {getTypeLabel(account.type)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">{formatCurrency(account.amount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Vencimento: {formatDate(account.due_date)}</span>
                      </div>
                      {account.payment_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Pagamento: {formatDate(account.payment_date)}</span>
                        </div>
                      )}
                    </div>

                    {account.category && (
                      <div className="text-sm text-gray-500 mt-2">
                        📂 {account.category}
                      </div>
                    )}

                    {account.payment_method && (
                      <div className="text-sm text-gray-500">
                        💳 {account.payment_method}
                      </div>
                    )}

                    {(account.client_name || account.project_name) && (
                      <div className="flex gap-4 text-sm text-gray-500 mt-2">
                        {account.client_name && <div>👤 {account.client_name}</div>}
                        {account.project_name && <div>📊 {account.project_name}</div>}
                      </div>
                    )}

                    {account.notes && (
                      <div className="text-sm text-gray-600 mt-2 italic">
                        📝 {account.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <AccountForm
          account={editingAccount}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
