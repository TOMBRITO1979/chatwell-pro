'use client';

import { useState, useEffect } from 'react';
import { X, Save, Briefcase, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface Project {
  id: string;
  name: string;
  service_type: string;
  image_url?: string;
}

interface ServiceContract {
  id?: string;
  client_id: string;
  project_id: string;
  contract_date: string;
  delivery_date?: string;
  status: string;
  notes?: string;
  tags?: string[];
}

interface ServiceContractFormProps {
  clientId: string;
  contract?: ServiceContract | null;
  onClose: () => void;
}

export function ServiceContractForm({ clientId, contract, onClose }: ServiceContractFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: contract?.project_id || '',
    contract_date: contract?.contract_date || new Date().toISOString().split('T')[0],
    delivery_date: contract?.delivery_date || '',
    status: contract?.status || 'em_tratativa',
    notes: contract?.notes || '',
    tags: contract?.tags?.join(', ') || ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (contract) {
      // Formatar datas para o formato YYYY-MM-DD
      const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        project_id: contract.project_id || '',
        contract_date: formatDate(contract.contract_date) || new Date().toISOString().split('T')[0],
        delivery_date: formatDate(contract.delivery_date) || '',
        status: contract.status || 'em_tratativa',
        notes: contract.notes || '',
        tags: contract.tags?.join(', ') || ''
      });
    }
  }, [contract]);

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

      // Converter tags de string para array
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const payload = {
        client_id: clientId,
        project_id: formData.project_id,
        contract_date: formData.contract_date,
        delivery_date: formData.delivery_date || null,
        status: formData.status,
        notes: formData.notes || null,
        tags: tagsArray
      };

      const url = contract?.id
        ? `/api/service-contracts/${contract.id}`
        : '/api/service-contracts';

      const method = contract?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        onClose();
      } else {
        alert(data.message || 'Erro ao salvar contratação');
      }
    } catch (error) {
      console.error('Erro ao salvar contratação:', error);
      alert('Erro ao salvar contratação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-chatwell-blue" />
              {contract?.id ? 'Editar Contratação' : 'Nova Contratação'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Serviço/Produto/Projeto */}
            <div>
              <Label htmlFor="project_id">Serviço/Produto/Projeto *</Label>
              <select
                id="project_id"
                required
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chatwell-blue"
              >
                <option value="">Selecione um serviço...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.service_type === 'service' ? 'Serviço' : project.service_type === 'product' ? 'Produto' : 'Projeto'})
                  </option>
                ))}
              </select>
            </div>

            {/* Data de Contratação */}
            <div>
              <Label htmlFor="contract_date">Data de Contratação *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="contract_date"
                  type="date"
                  required
                  value={formData.contract_date}
                  onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Data de Entrega */}
            <div>
              <Label htmlFor="delivery_date">Data de Entrega Prevista</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chatwell-blue"
              >
                <option value="em_tratativa">Em Tratativa</option>
                <option value="iniciado">Em Andamento</option>
                <option value="pendente">Pendente</option>
                <option value="cancelado">Cancelado</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="tags"
                  type="text"
                  placeholder="urgente, prioridade, vip (separadas por vírgula)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chatwell-blue"
                placeholder="Detalhes adicionais sobre a contratação..."
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 chatwell-gradient text-white"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
