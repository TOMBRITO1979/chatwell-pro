'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Calendar, Tag, Briefcase, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceContractForm } from './service-contract-form';

interface ServiceContract {
  id: string;
  client_id: string;
  project_id: string;
  project_name: string;
  service_type: string;
  contract_date: string;
  delivery_date?: string;
  status: string;
  notes?: string;
  tags?: string[];
  image_url?: string;
}

interface ClientDetailsProps {
  client: any;
  onClose: () => void;
  onEdit: () => void;
}

export function ClientDetails({ client, onClose, onEdit }: ClientDetailsProps) {
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingContract, setEditingContract] = useState<ServiceContract | null>(null);

  useEffect(() => {
    loadContracts();
  }, [client.id]);

  const loadContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/service-contracts?client_id=${client.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setContracts(data.contracts);
      }
    } catch (error) {
      console.error('Erro ao carregar contratações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta contratação?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/service-contracts/${contractId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        loadContracts();
      } else {
        alert(data.message || 'Erro ao deletar contratação');
      }
    } catch (error) {
      console.error('Erro ao deletar contratação:', error);
      alert('Erro ao deletar contratação');
    }
  };

  const handleEditContract = (contract: ServiceContract) => {
    setEditingContract(contract);
    setShowContractForm(true);
  };

  const handleContractFormClose = () => {
    setShowContractForm(false);
    setEditingContract(null);
    loadContracts();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: any = {
      'em_tratativa': 'bg-yellow-100 text-yellow-800',
      'iniciado': 'bg-blue-100 text-blue-800',
      'pendente': 'bg-orange-100 text-orange-800',
      'cancelado': 'bg-red-100 text-red-800'
    };

    const statusLabels: any = {
      'em_tratativa': 'Em Tratativa',
      'iniciado': 'Iniciado',
      'pendente': 'Pendente',
      'cancelado': 'Cancelado'
    };

    return (
      <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{client.name}</h2>
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                  client.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Cliente
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Informações do Cliente */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.email && (
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p>{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <span className="font-medium text-gray-600">Telefone:</span>
                    <p>{client.phone}</p>
                  </div>
                )}
                {client.whatsapp && (
                  <div>
                    <span className="font-medium text-gray-600">WhatsApp:</span>
                    <p>{client.whatsapp}</p>
                  </div>
                )}
                {client.cpf_cnpj && (
                  <div>
                    <span className="font-medium text-gray-600">CPF/CNPJ:</span>
                    <p>{client.cpf_cnpj}</p>
                  </div>
                )}
                {(client.address || client.city || client.state) && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Endereço:</span>
                    <p>
                      {client.address && `${client.address}, `}
                      {client.city && client.state ? `${client.city} - ${client.state}` : client.city || client.state}
                      {client.zip_code && `, ${client.zip_code}`}
                    </p>
                  </div>
                )}
                {client.notes && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Observações:</span>
                    <p className="text-sm text-gray-700">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Serviços Contratados */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-chatwell-blue" />
                    Serviços Contratados
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowContractForm(true)}
                    className="chatwell-gradient text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-gray-600 py-8">Carregando contratações...</p>
                ) : contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Nenhum serviço contratado ainda</p>
                    <Button
                      size="sm"
                      onClick={() => setShowContractForm(true)}
                      className="chatwell-gradient text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeiro Serviço
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{contract.project_name}</h3>
                              {getStatusBadge(contract.status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Contratação: {formatDate(contract.contract_date)}</span>
                              </div>
                              {contract.delivery_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Entrega: {formatDate(contract.delivery_date)}</span>
                                </div>
                              )}
                            </div>
                            {contract.tags && contract.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {contract.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {contract.notes && (
                              <div className="flex items-start gap-1 text-sm text-gray-600">
                                <FileText className="w-4 h-4 mt-0.5" />
                                <p className="line-clamp-2">{contract.notes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditContract(contract)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteContract(contract.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Card>
      </div>

      {/* Form Modal */}
      {showContractForm && (
        <ServiceContractForm
          clientId={client.id}
          contract={editingContract}
          onClose={handleContractFormClose}
        />
      )}
    </>
  );
}
