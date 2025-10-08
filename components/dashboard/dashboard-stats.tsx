'use client';

import { useState, useEffect } from 'react';
import {
  Users, CheckSquare, Briefcase, Calendar,
  DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  AlertCircle, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface DashboardStats {
  clients: { total: number };
  tasks: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  events: { upcoming: number };
  accounts: {
    receivable_pending: number;
    receivable_paid: number;
    payable_pending: number;
    payable_paid: number;
  };
  business_expenses: {
    pending: number;
    paid: number;
  };
  personal_expenses: {
    pending: number;
    paid: number;
  };
  purchases: {
    total: number;
    pending: number;
    total_estimated: number;
  };
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

interface UpcomingEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  type: string;
}

interface UpcomingAccount {
  id: string;
  description: string;
  amount: string;
  due_date: string;
  type: string;
  status: string;
}

export function DashboardStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [upcomingAccounts, setUpcomingAccounts] = useState<UpcomingAccount[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const response = await fetch('/api/dashboard/stats', {
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
        setStats(data.stats);
        setRecentTasks(data.recent_tasks || []);
        setUpcomingEvents(data.upcoming_events || []);
        setUpcomingAccounts(data.upcoming_accounts || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Erro ao carregar dados</p>
      </div>
    );
  }

  const cashFlow =
    stats.accounts.receivable_pending -
    stats.accounts.payable_pending -
    stats.business_expenses.pending -
    stats.personal_expenses.pending;

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link href="/clientes">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.clients.total}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tarefas">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.tasks.total}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-yellow-600">{stats.tasks.pending} pendentes</span>
                {stats.tasks.overdue > 0 && (
                  <span className="text-red-600">{stats.tasks.overdue} atrasadas</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/projetos">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Projetos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.projects.total}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-blue-600">{stats.projects.active} ativos</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/agenda">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Eventos (próx. 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.events.upcoming}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Visão Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">A Receber (Pendente)</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.accounts.receivable_pending)}
                </p>
              </div>
              <ArrowUpRight className="w-6 h-6 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">A Pagar (Pendente)</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(stats.accounts.payable_pending)}
                </p>
              </div>
              <ArrowDownRight className="w-6 h-6 text-red-600" />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Fluxo de Caixa Projetado</p>
                <p className={`text-xl font-bold ${cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Gastos Empresariais (Pendentes)</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(stats.business_expenses.pending)}
                </p>
              </div>
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Gastos Pessoais (Pendentes)</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(stats.personal_expenses.pending)}
                </p>
              </div>
              <TrendingDown className="w-5 h-5 text-purple-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Lista de Compras (Estimado)</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(stats.purchases.total_estimated)}
                </p>
              </div>
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks, Events, and Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Tarefas Prioritárias
              </span>
              <Link href="/tarefas" className="text-sm text-blue-600 hover:underline">
                Ver todas
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma tarefa pendente</p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="border-l-2 border-blue-500 pl-3">
                    <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximos Eventos
              </span>
              <Link href="/agenda" className="text-sm text-blue-600 hover:underline">
                Ver todos
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum evento próximo</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-2 border-green-500 pl-3">
                    <p className="text-sm font-medium line-clamp-1">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(event.start_date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Vencimentos (7 dias)
              </span>
              <Link href="/contas" className="text-sm text-blue-600 hover:underline">
                Ver todas
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAccounts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma conta próxima ao vencimento</p>
            ) : (
              <div className="space-y-3">
                {upcomingAccounts.map((account) => (
                  <div key={account.id} className={`border-l-2 ${account.type === 'receivable' ? 'border-green-500' : 'border-red-500'} pl-3`}>
                    <p className="text-sm font-medium line-clamp-1">{account.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs font-semibold ${account.type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(parseFloat(account.amount))}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(account.due_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
