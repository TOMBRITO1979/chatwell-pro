'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Clock, AlertCircle, CheckSquare, ShoppingCart,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        console.log('Accounts data:', accountsData);
        if (accountsData.success) {
          console.log('Categorizing accounts:', accountsData.accounts);
          categorizeAccounts(accountsData.accounts || []);
        }
      }

      // Load tasks
      const tasksResponse = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        console.log('Tasks data:', tasksData);
        if (tasksData.success) {
          // Show only active tasks (pendente, iniciado, em_tratativa)
          const activeTasks = (tasksData.tasks || []).filter(
            (t: Task) => t.status === 'pendente' || t.status === 'iniciado' || t.status === 'em_tratativa'
          );
          console.log('Active tasks:', activeTasks);
          setTasks(activeTasks);
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
          setPurchases(pendingPurchases);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeEvents = (events: UpcomingEvent[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const todayEvents: UpcomingEvent[] = [];
    const tomorrowEvents: UpcomingEvent[] = [];
    const laterEvents: UpcomingEvent[] = [];

    events.forEach(event => {
      const eventDateTime = new Date(event.start_time);
      const eventDate = new Date(eventDateTime.getFullYear(), eventDateTime.getMonth(), eventDateTime.getDate());

      const todayTime = today.getTime();
      const tomorrowTime = tomorrow.getTime();
      const eventTime = eventDate.getTime();

      if (eventTime === todayTime) {
        todayEvents.push(event);
      } else if (eventTime === tomorrowTime) {
        tomorrowEvents.push(event);
      } else if (eventTime >= dayAfterTomorrow.getTime()) {
        laterEvents.push(event);
      }
    });

    setEventsToday(todayEvents);
    setEventsTomorrow(tomorrowEvents);
    setEventsLater(laterEvents);
  };

  const categorizeAccounts = (accounts: UpcomingAccount[]) => {
    console.log('Categorizing accounts - input:', accounts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    console.log('Date ranges:', { today, tomorrow, sevenDaysLater });

    const todayAccounts: UpcomingAccount[] = [];
    const tomorrowAccounts: UpcomingAccount[] = [];
    const laterAccounts: UpcomingAccount[] = [];

    // Filter only pending accounts
    const pendingAccounts = accounts.filter(acc => acc.status === 'pending');
    console.log('Pending accounts:', pendingAccounts);

    pendingAccounts.forEach(account => {
      const dueDateObj = new Date(account.due_date);
      const dueDate = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

      const todayTime = today.getTime();
      const tomorrowTime = tomorrow.getTime();
      const dueTime = dueDate.getTime();
      const sevenDaysTime = sevenDaysLater.getTime();

      console.log(`Account ${account.title}: due=${dueDate.toISOString()}, status=${account.status}`);

      if (dueTime === todayTime) {
        todayAccounts.push(account);
        console.log('  -> Added to TODAY');
      } else if (dueTime === tomorrowTime) {
        tomorrowAccounts.push(account);
        console.log('  -> Added to TOMORROW');
      } else if (dueTime > tomorrowTime && dueTime <= sevenDaysTime) {
        laterAccounts.push(account);
        console.log('  -> Added to LATER');
      }
    });

    console.log('Categorization result:', { todayAccounts, tomorrowAccounts, laterAccounts });
    setAccountsToday(todayAccounts);
    setAccountsTomorrow(tomorrowAccounts);
    setAccountsLater(laterAccounts);
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
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {eventsToday.map((event) => (
                      <div key={event.id} className="text-sm border-l-2 border-blue-300 pl-2">
                        <p className="font-medium line-clamp-1">{event.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.start_time)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {eventsTomorrow.map((event) => (
                      <div key={event.id} className="text-sm border-l-2 border-green-300 pl-2">
                        <p className="font-medium line-clamp-1">{event.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.start_time)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {eventsLater.map((event) => (
                      <div key={event.id} className="text-sm border-l-2 border-purple-300 pl-2">
                        <p className="font-medium line-clamp-1">{event.title}</p>
                        <p className="text-xs text-gray-500">{formatDateShort(event.start_time)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
            Vencimentos (Fluxo de Caixa)
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
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {accountsToday.map((account) => (
                      <div key={account.id} className={`text-sm border-l-2 ${account.type === 'receivable' ? 'border-green-400' : 'border-red-400'} pl-2`}>
                        <p className="font-medium line-clamp-1">{account.title}</p>
                        <p className={`text-xs font-semibold ${account.type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(account.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {accountsTomorrow.map((account) => (
                      <div key={account.id} className={`text-sm border-l-2 ${account.type === 'receivable' ? 'border-green-400' : 'border-red-400'} pl-2`}>
                        <p className="font-medium line-clamp-1">{account.title}</p>
                        <p className={`text-xs font-semibold ${account.type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(account.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
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
                </ScrollArea>
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
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-4">
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
              </ScrollArea>
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
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-4">
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
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
