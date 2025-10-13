'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EventForm } from './event-form';

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  event_type: string;
  color: string;
  is_all_day: boolean;
  reminder_minutes: number;
  phone: string | null;
  email: string | null;
  client_name: string | null;
  project_name: string | null;
  client_id: string | null;
  project_id: string | null;
}

type ViewMode = 'month' | 'week' | 'list';

export function CalendarView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEvents();
  }, [currentDate, filterType]);

  const loadEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      // Calculate date range based on current view
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let url = `/api/events?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;
      if (filterType) {
        url += `&event_type=${filterType}`;
      }

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
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        loadEvents();
      } else {
        alert(data.message || 'Erro ao deletar evento');
      }
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      alert('Erro ao deletar evento');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleFormClose = () => {
    setShowEventForm(false);
    setEditingEvent(null);
    loadEvents();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month days to complete grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    return days;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];

    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWeekDay = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const filteredEvents = events.filter(event => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return event.title.toLowerCase().includes(searchLower) ||
           (event.description && event.description.toLowerCase().includes(searchLower)) ||
           (event.location && event.location.toLowerCase().includes(searchLower));
  });

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-chatwell-blue" />
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus compromissos e eventos
          </p>
        </div>
        <Button
          onClick={() => setShowEventForm(true)}
          className="chatwell-gradient text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* View Mode */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
                className={viewMode === 'month' ? 'chatwell-gradient text-white' : ''}
              >
                Mês
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'chatwell-gradient text-white' : ''}
              >
                7 Dias
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'chatwell-gradient text-white' : ''}
              >
                Lista
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Todos os tipos</option>
                <option value="meeting">Reunião</option>
                <option value="call">Ligação</option>
                <option value="task">Tarefa</option>
                <option value="event">Evento</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          {/* Search */}
          {viewMode === 'list' && (
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar, Week or List View */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando eventos...</p>
        </div>
      ) : viewMode === 'week' ? (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {getNext7Days().map((date, index) => {
                const dayEvents = getEventsForDay(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${
                      isToday ? 'ring-2 ring-chatwell-blue bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className={`text-center font-semibold mb-3 pb-2 border-b ${
                      isToday ? 'text-chatwell-blue' : 'text-gray-700'
                    }`}>
                      {formatWeekDay(date)}
                      {isToday && (
                        <div className="text-xs text-chatwell-blue font-normal mt-1">Hoje</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {dayEvents.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-4">
                          Sem eventos
                        </div>
                      ) : (
                        dayEvents.map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-2 rounded cursor-pointer hover:shadow-md transition-shadow"
                            style={{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }}
                            onClick={() => handleEdit(event)}
                          >
                            <div className="font-medium mb-1" style={{ color: event.color }}>
                              {event.title}
                            </div>
                            {!event.is_all_day && (
                              <div className="text-xs text-gray-600">
                                🕐 {formatTime(event.start_time)}
                              </div>
                            )}
                            {event.is_all_day && (
                              <div className="text-xs text-gray-600">
                                🕐 Dia inteiro
                              </div>
                            )}
                            {event.location && (
                              <div className="text-xs text-gray-600 mt-1 truncate">
                                📍 {event.location}
                              </div>
                            )}
                            {event.client_name && (
                              <div className="text-xs text-gray-600 truncate">
                                👤 {event.client_name}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'month' ? (
        <Card>
          <CardContent className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((day, index) => {
                const dayEvents = day.date ? getEventsForDay(day.date) : [];
                const isToday = day.date &&
                  day.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border rounded-lg p-2 ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-chatwell-blue' : ''}`}
                  >
                    {day.date && (
                      <>
                        <div className={`text-sm font-semibold mb-1 ${
                          isToday ? 'text-chatwell-blue' : 'text-gray-700'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                              style={{ backgroundColor: event.color + '20', color: event.color }}
                              onClick={() => handleEdit(event)}
                              title={event.title}
                            >
                              <div className="truncate font-medium">{event.title}</div>
                              {!event.is_all_day && (
                                <div className="text-xs opacity-75">
                                  {formatTime(event.start_time)}
                                </div>
                              )}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 pl-1">
                              +{dayEvents.length - 3} mais
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  {search ? 'Nenhum evento encontrado' : 'Nenhum evento cadastrado ainda'}
                </p>
                {!search && (
                  <Button onClick={() => setShowEventForm(true)} className="chatwell-gradient text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Evento
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map(event => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                          {event.event_type}
                        </span>
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div>
                          📅 {new Date(event.start_time).toLocaleDateString('pt-BR')}
                        </div>
                        {!event.is_all_day && (
                          <div>
                            🕐 {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </div>
                        )}
                        {event.is_all_day && (
                          <div>🕐 Dia inteiro</div>
                        )}
                        {event.location && (
                          <div>📍 {event.location}</div>
                        )}
                        {event.client_name && (
                          <div>👤 {event.client_name}</div>
                        )}
                        {event.project_name && (
                          <div>📊 {event.project_name}</div>
                        )}
                      </div>

                      {/* Contact Information */}
                      {(event.phone || event.email) && (
                        <div className="flex flex-wrap gap-4 text-sm mt-3 pt-3 border-t border-gray-200">
                          {event.phone && (
                            <a
                              href={`https://wa.me/${event.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
                            >
                              📱 WhatsApp: {event.phone}
                            </a>
                          )}
                          {event.email && (
                            <a
                              href={`mailto:${event.email}`}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              ✉️ Email: {event.email}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(event)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Deletar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          event={editingEvent}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
