'use client';

import { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ServiceFormProps {
  service: any | null;
  onClose: () => void;
}

interface Client {
  id: string;
  name: string;
}

export function ServiceForm({ service, onClose }: ServiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    service_type: 'service',
    image_url: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'em_tratativa',
    priority: 'medium',
    progress: 0,
    notes: '',
    client_id: ''
  });

  useEffect(() => {
    loadClients();

    if (service) {
      const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setFormData({
        name: service.name || '',
        description: service.description || '',
        service_type: service.service_type || 'service',
        image_url: service.image_url || '',
        start_date: formatDateForInput(service.start_date),
        end_date: formatDateForInput(service.end_date),
        budget: service.budget || '',
        status: service.status || 'em_tratativa',
        priority: service.priority || 'medium',
        progress: service.progress || 0,
        notes: service.notes || '',
        client_id: service.client_id || ''
      });
    }
  }, [service]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = service ? `/api/projects/${service.id}` : '/api/projects';
      const method = service ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        budget: parseFloat(formData.budget) || 0,
        progress: parseInt(String(formData.progress)) || 0,
        client_id: formData.client_id || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        image_url: formData.image_url || null
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
        const typeLabel = formData.service_type === 'service' ? 'Serviço' :
                          formData.service_type === 'product' ? 'Produto' : 'Projeto';
        alert(service ? `${typeLabel} atualizado!` : `${typeLabel} criado!`);
        onClose();
      } else {
        alert(data.message || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {service ? 'Editar Serviço/Produto/Projeto' : 'Novo Serviço/Produto/Projeto'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo */}
            <div>
              <Label htmlFor="service_type">Tipo *</Label>
              <select
                id="service_type"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              >
                <option value="service">Serviço</option>
                <option value="product">Produto</option>
                <option value="project">Projeto</option>
              </select>
            </div>

            {/* Nome */}
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Desenvolvimento de Website"
              />
            </div>

            {/* Imagem URL */}
            <div>
              <Label htmlFor="image_url">URL da Imagem</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="pl-10"
                  />
                </div>
              </div>
              {formData.image_url && (
                <div className="mt-2">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva os detalhes..."
              />
            </div>

            {/* Cliente e Orçamento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Cliente</Label>
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
                <Label htmlFor="budget">Orçamento (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Data de Término</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            {/* Status, Prioridade e Progresso */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="em_tratativa">Em Tratativa</option>
                  <option value="iniciado">Iniciado</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div>
                <Label htmlFor="progress">Progresso (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Progress Bar Preview */}
            <div>
              <Label>Visualização do Progresso</Label>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div
                  className="bg-chatwell-blue h-3 rounded-full transition-all"
                  style={{ width: `${formData.progress}%` }}
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações adicionais..."
              />
            </div>

            {/* Botões */}
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
