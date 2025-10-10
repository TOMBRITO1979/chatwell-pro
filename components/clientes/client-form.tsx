'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ClientFormProps {
  client: any | null;
  onClose: () => void;
}

interface Service {
  project_id: string;
  contract_date: string;
  delivery_date: string;
  status: string;
  notes: string;
  tags: string[];
}

interface Project {
  id: string;
  name: string;
  service_type: string;
}

export function ClientForm({ client, onClose }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    cpf_cnpj: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
    status: 'active'
  });

  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadProjects();

    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        cpf_cnpj: client.cpf_cnpj || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zip_code: client.zip_code || '',
        notes: client.notes || '',
        status: client.status || 'active'
      });
    }
  }, [client]);

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

  const handleAddService = () => {
    const today = new Date().toISOString().split('T')[0];
    setServices([
      ...services,
      {
        project_id: '',
        contract_date: today,
        delivery_date: '',
        status: 'em_tratativa',
        notes: '',
        tags: []
      }
    ]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof Service, value: any) => {
    const updatedServices = [...services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value
    };
    setServices(updatedServices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // 1. Criar ou atualizar o cliente
      const clientUrl = client ? `/api/clients/${client.id}` : '/api/clients';
      const clientMethod = client ? 'PUT' : 'POST';

      const clientResponse = await fetch(clientUrl, {
        method: clientMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const clientData = await clientResponse.json();

      if (!clientData.success) {
        alert(clientData.message || 'Erro ao salvar cliente');
        setLoading(false);
        return;
      }

      const clientId = client?.id || clientData.client.id;

      // 2. Criar contratos de serviço (apenas para novos serviços)
      if (services.length > 0) {
        const servicePromises = services.map(async (service) => {
          if (!service.project_id) return null;

          return fetch('/api/service-contracts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              client_id: clientId,
              project_id: service.project_id,
              contract_date: service.contract_date,
              delivery_date: service.delivery_date || null,
              status: service.status,
              notes: service.notes,
              tags: service.tags
            })
          });
        });

        await Promise.all(servicePromises);
      }

      alert(client ? 'Cliente atualizado!' : 'Cliente e serviços criados com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Dados do Cliente</h3>

              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    maxLength={2}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            {/* Serviços Contratados */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-semibold">Serviços Contratados</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddService}
                  className="chatwell-gradient text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Serviço
                </Button>
              </div>

              {services.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum serviço adicionado. Clique em "Adicionar Serviço" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <Card key={index} className="p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm">Serviço #{index + 1}</h4>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveService(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`service_${index}`}>Serviço *</Label>
                            <select
                              id={`service_${index}`}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={service.project_id}
                              onChange={(e) => handleServiceChange(index, 'project_id', e.target.value)}
                              required
                            >
                              <option value="">Selecione um serviço</option>
                              {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                  {project.name} ({project.service_type || 'projeto'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label htmlFor={`status_${index}`}>Status</Label>
                            <select
                              id={`status_${index}`}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={service.status}
                              onChange={(e) => handleServiceChange(index, 'status', e.target.value)}
                            >
                              <option value="em_tratativa">Em Tratativa</option>
                              <option value="iniciado">Em Andamento</option>
                              <option value="pendente">Pendente</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`contract_date_${index}`}>Data de Contratação *</Label>
                            <Input
                              id={`contract_date_${index}`}
                              type="date"
                              value={service.contract_date}
                              onChange={(e) => handleServiceChange(index, 'contract_date', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor={`delivery_date_${index}`}>Data de Entrega</Label>
                            <Input
                              id={`delivery_date_${index}`}
                              type="date"
                              value={service.delivery_date}
                              onChange={(e) => handleServiceChange(index, 'delivery_date', e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`notes_${index}`}>Observações</Label>
                          <textarea
                            id={`notes_${index}`}
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={service.notes}
                            onChange={(e) => handleServiceChange(index, 'notes', e.target.value)}
                            placeholder="Observações sobre este serviço..."
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t">
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
