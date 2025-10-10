'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface EventFormProps {
  event: any | null;
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

export function EventForm({ event, onClose }: EventFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    event_type: 'meeting',
    color: '#3B82F6',
    is_all_day: false,
    reminder_minutes: 30,
    client_id: '',
    project_id: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadClients();
    loadProjects();

    if (event) {
      // Format dates for datetime-local input
      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);

      const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_time: formatDateTimeLocal(startDate),
        end_time: formatDateTimeLocal(endDate),
        location: event.location || '',
        event_type: event.event_type || 'meeting',
        color: event.color || '#3B82F6',
        is_all_day: event.is_all_day || false,
        reminder_minutes: event.reminder_minutes || 30,
        client_id: event.client_id || '',
        project_id: event.project_id || '',
        phone: event.phone || '',
        email: event.email || ''
      });
    }
  }, [event]);

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
      const url = event ? `/api/events/${event.id}` : '/api/events';
      const method = event ? 'PUT' : 'POST';

      // Convert datetime-local to ISO string
      const submitData = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        client_id: formData.client_id || null,
        project_id: formData.project_id || null
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
        alert(event ? 'Evento atualizado!' : 'Evento criado!');
        onClose();
      } else {
        alert(data.message || 'Erro ao salvar evento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar evento');
    } finally {
      setLoading(false);
    }
  };

  const eventTypeOptions = [
    { value: 'meeting', label: 'Reunião' },
    { value: 'call', label: 'Ligação' },
    { value: 'task', label: 'Tarefa' },
    { value: 'event', label: 'Evento' },
    { value: 'other', label: 'Outro' }
  ];

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Laranja' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6366F1', label: 'Índigo' },
    { value: '#14B8A6', label: 'Turquesa' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {event ? 'Editar Evento' : 'Novo Evento'}
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
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Data/Hora Início *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">Data/Hora Fim *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_all_day"
                checked={formData.is_all_day}
                onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_all_day" className="cursor-pointer">
                Dia inteiro
              </Label>
            </div>

            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Sala de reuniões, Zoom, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_type">Tipo de Evento</Label>
                <select
                  id="event_type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                >
                  {eventTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="color">Cor</Label>
                <div className="flex gap-2">
                  <select
                    id="color"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div
                    className="w-10 h-10 rounded-md border"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="reminder_minutes">Lembrete (minutos antes)</Label>
              <select
                id="reminder_minutes"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.reminder_minutes}
                onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
              >
                <option value="0">Sem lembrete</option>
                <option value="5">5 minutos antes</option>
                <option value="15">15 minutos antes</option>
                <option value="30">30 minutos antes</option>
                <option value="60">1 hora antes</option>
                <option value="1440">1 dia antes</option>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone/WhatsApp (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: 5511999999999"
                />
                <p className="text-xs text-gray-500 mt-1">Para receber notificações via WhatsApp</p>
              </div>
              <div>
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: contato@exemplo.com"
                />
                <p className="text-xs text-gray-500 mt-1">Para receber notificações via e-mail</p>
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
