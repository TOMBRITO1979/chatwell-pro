'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from './client-form';
import { ClientDetails } from './client-details';
import { ContractsInProgress } from '@/components/common/contracts-in-progress';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  cpf_cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export function ClientesList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    loadClients();
  }, [search]);

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const url = search 
        ? `/api/clients?search=${encodeURIComponent(search)}`
        : '/api/clients';

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
        setClients(data.clients);
        
        // Calcular estatísticas
        const total = data.clients.length;
        const active = data.clients.filter((c: Client) => c.status === 'active').length;
        const inactive = data.clients.filter((c: Client) => c.status === 'inactive').length;
        setStats({ total, active, inactive });
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        loadClients();
      } else {
        alert(data.message || 'Erro ao deletar cliente');
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      alert('Erro ao deletar cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetails(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingClient(null);
    loadClients();
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedClient(null);
    loadClients();
  };

  const handleEditFromDetails = () => {
    if (selectedClient) {
      setEditingClient(selectedClient);
      setShowDetails(false);
      setShowForm(true);
    }
  };

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-chatwell-blue" />
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus clientes e informações de contato
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="chatwell-gradient text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
            </p>
            {!search && (
              <Button onClick={() => setShowForm(true)} className="chatwell-gradient text-white">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(client)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                      client.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(client)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {(client.city || client.state) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {client.city && client.state 
                        ? `${client.city}, ${client.state}`
                        : client.city || client.state}
                    </span>
                  </div>
                )}
                {client.cpf_cnpj && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">CPF/CNPJ:</span> {client.cpf_cnpj}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Em Andamento Section */}
      <div className="mt-8">
        <ContractsInProgress />
      </div>

      {/* Form Modal */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={handleFormClose}
        />
      )}

      {/* Details Modal */}
      {showDetails && selectedClient && (
        <ClientDetails
          client={selectedClient}
          onClose={handleDetailsClose}
          onEdit={handleEditFromDetails}
        />
      )}
    </div>
  );
}
