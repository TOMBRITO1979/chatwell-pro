'use client';

import { useState, useEffect } from 'react';
import { Briefcase, User, Calendar, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceContractForm } from '@/components/clientes/service-contract-form';

interface ServiceContract {
  id: string;
  client_id: string;
  client_name: string;
  project_id: string;
  project_name: string;
  service_type: string;
  contract_date: string;
  delivery_date?: string;
  status: string;
  notes?: string;
  tags?: string[];
}

interface ContractsInProgressProps {
  title?: string;
  showOnlyInProgress?: boolean;
}

export function ContractsInProgress({
  title = 'Em Andamento',
  showOnlyInProgress = true
}: ContractsInProgressProps) {
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingContract, setEditingContract] = useState<ServiceContract | null>(null);

  useEffect(() => {
    loadContracts();
  }, [showOnlyInProgress]);

  const loadContracts = async () => {
    try {
      const token = localStorage.getItem('token');

      let url = '/api/service-contracts';
      if (showOnlyInProgress) {
        url += '?in_progress=true';
      }

      const response = await fetch(url, {
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

  const handleEdit = (contract: ServiceContract) => {
    setEditingContract(contract);
    setShowEditForm(true);
  };

  const handleFormClose = () => {
    setShowEditForm(false);
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-chatwell-blue" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-600">
              Carregando contratações...
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {showOnlyInProgress
                  ? 'Nenhuma contratação em andamento'
                  : 'Nenhuma contratação encontrada'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Cliente</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Serviço/Produto/Projeto</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Data</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleEdit(contract)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{contract.client_name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{contract.project_name}</p>
                          <p className="text-xs text-gray-500">
                            {contract.service_type === 'service'
                              ? 'Serviço'
                              : contract.service_type === 'product'
                              ? 'Produto'
                              : 'Projeto'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(contract.contract_date).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(contract);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form Modal */}
      {showEditForm && editingContract && (
        <ServiceContractForm
          clientId={editingContract.client_id}
          contract={editingContract}
          onClose={handleFormClose}
        />
      )}
    </>
  );
}
