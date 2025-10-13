'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Clock, AlertCircle, CheckSquare, ShoppingCart,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface UpcomingEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  event_type: string;
  phone?: string;
  email?: string;
}

interface UpcomingAccount {
  id: string;
  title: string;
  description?: string;
  amount: string;
  due_date: string;
  type: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

interface Purchase {
  id: string;
  item_name: string;
  quantity: number;
  estimated_price: string | null;
  purchased: boolean;
}

export function DashboardStats() {
  const [loading, setLoading] = useState(true);
  const [eventsToday, setEventsToday] = useState<UpcomingEvent[]>([]);
  const [eventsTomorrow, setEventsTomorrow] = useState<UpcomingEvent[]>([]);
  const [eventsLater, setEventsLater] = useState<UpcomingEvent[]>([]);
  const [accountsToday, setAccountsToday] = useState<UpcomingAccount[]>([]);
  const [accountsTomorrow, setAccountsTomorrow] = useState<UpcomingAccount[]>([]);
  const [accountsLater, setAccountsLater] = useState<UpcomingAccount[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

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

      // Load events
      const eventsResponse = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        if (eventsData.success) {
          categorizeEvents(eventsData.events || []);
        }
      }

      // Load accounts
      const accountsResponse = await fetch('/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        if (accountsData.success) {
          categorizeAccounts(accountsData.accounts || []);
        }
      }

      // Load tasks
      const tasksResponse = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        if (tasksData.success) {
          // Show only pending and in-progress tasks
          const activeTasks = (tasksData.tasks || []).filter(
            (t: Task) => t.status === 'pending' || t.status === 'in_progress'
          );
          setTasks(activeTasks.slice(0, 5));
        }
      }

      // Load purchases
      const purchasesResponse = await fetch('/api/purchases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json();
        if (purchasesData.success) {
          // Show only pending purchases
          const pendingPurchases = (purchasesData.purchases || []).filter(
            (p: Purchase) => !p.purchased
          );
          setPurchases(pendingPurchases.slice(0, 5));
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeEvents = (events: UpcomingEvent[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const todayEvents: UpcomingEvent[] = [];
    const tomorrowEvents: UpcomingEvent[] = [];
    const laterEvents: UpcomingEvent[] = [];

    events.forEach(event => {
      const eventDate = new Date(event.start_time);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate.getTime() === today.getTime()) {
        todayEvents.push(event);
      } else if (eventDate.getTime() === tomorrow.getTime()) {
        tomorrowEvents.push(event);
      } else if (eventDate > tomorrow) {
        laterEvents.push(event);
      }
    });

    setEventsToday(todayEvents);
    setEventsTomorrow(tomorrowEvents);
    setEventsLater(laterEvents.slice(0, 5));
  };

  const categorizeAccounts = (accounts: UpcomingAccount[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAccounts: UpcomingAccount[] = [];
    const tomorrowAccounts: UpcomingAccount[] = [];
    const laterAccounts: UpcomingAccount[] = [];

    // Filter only pending accounts
    const pendingAccounts = accounts.filter(acc => acc.status === 'pending');

    pendingAccounts.forEach(account => {
      const dueDate = new Date(account.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate.getTime() === today.getTime()) {
        todayAccounts.push(account);
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        tomorrowAccounts.push(account);
      } else if (dueDate > tomorrow && dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        laterAccounts.push(account);
      }
    });

    setAccountsToday(todayAccounts);
    setAccountsTomorrow(tomorrowAccounts);
    setAccountsLater(laterAccounts.slice(0, 5));
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão rápida da sua agenda, vencimentos e tarefas
        </p>
      </div>

      {/* Agenda */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Agenda
          </h2>
          <Link href="/agenda" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Ver tudo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hoje */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Hoje</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  {eventsToday.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsToday.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum evento</p>
              ) : (
                <div className="space-y-2">
                  {eventsToday.map((event) => (
                    <div key={event.id} className="text-sm border-l-2 border-blue-300 pl-2">
                      <p className="font-medium line-clamp-1">{event.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(event.start_time)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amanhã */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Amanhã</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                  {eventsTomorrow.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsTomorrow.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum evento</p>
              ) : (
                <div className="space-y-2">
                  {eventsTomorrow.map((event) => (
                    <div key={event.id} className="text-sm border-l-2 border-green-300 pl-2">
                      <p className="font-medium line-clamp-1">{event.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(event.start_time)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Depois */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Próximos Dias</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                  {eventsLater.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLater.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum evento</p>
              ) : (
                <div className="space-y-2">
                  {eventsLater.map((event) => (
                    <div key={event.id} className="text-sm border-l-2 border-purple-300 pl-2">
                      <p className="font-medium line-clamp-1">{event.title}</p>
                      <p className="text-xs text-gray-500">{formatDateShort(event.start_time)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vencimentos */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            Vencimentos (Contas a Pagar/Receber)
          </h2>
          <Link href="/contas" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Ver tudo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hoje */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Hoje</span>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                  {accountsToday.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountsToday.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum vencimento</p>
              ) : (
                <div className="space-y-2">
                  {accountsToday.map((account) => (
                    <div key={account.id} className={`text-sm border-l-2 ${account.type === 'receivable' ? 'border-green-400' : 'border-red-400'} pl-2`}>
                      <p className="font-medium line-clamp-1">{account.title}</p>
                      <p className={`text-xs font-semibold ${account.type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(account.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amanhã */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Amanhã</span>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
                  {accountsTomorrow.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountsTomorrow.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum vencimento</p>
              ) : (
                <div className="space-y-2">
                  {accountsTomorrow.map((account) => (
                    <div key={account.id} className={`text-sm border-l-2 ${account.type === 'receivable' ? 'border-green-400' : 'border-red-400'} pl-2`}>
                      <p className="font-medium line-clamp-1">{account.title}</p>
                      <p className={`text-xs font-semibold ${account.type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(account.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos 7 dias */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Próximos 7 Dias</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                  {accountsLater.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountsLater.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum vencimento</p>
              ) : (
                <div className="space-y-2">
                  {accountsLater.map((account) => (
                    <div key={account.id} className={`text-sm border-l-2 ${account.type === 'receivable' ? 'border-green-400' : 'border-red-400'} pl-2`}>
                      <p className="font-medium line-clamp-1">{account.title}</p>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold ${account.type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(account.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDateShort(account.due_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tarefas e Lista de Compras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarefas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                Tarefas Pendentes
              </span>
              <Link href="/tarefas" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhuma tarefa pendente</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="border-l-2 border-blue-400 pl-3 py-2">
                    <p className="font-medium text-sm line-clamp-1">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateShort(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Compras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Lista de Compras
              </span>
              <Link href="/compras" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum item pendente</p>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="border-l-2 border-green-400 pl-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm line-clamp-1">{purchase.item_name}</p>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {purchase.quantity}x
                      </span>
                    </div>
                    {purchase.estimated_price && (
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        ~{formatCurrency(purchase.estimated_price)}
                      </p>
                    )}
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
