"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  LogOut,
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Building2,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

interface Stats {
  total_users: string;
  active_users: string;
  inactive_users: string;
  verified_users: string;
  total_clients: string;
  total_projects: string;
  total_tasks: string;
  total_events: string;
  total_accounts: string;
}

export function SuperAdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('superAdminToken');

    if (!token) {
      router.push('/super-admin/login');
      return;
    }

    try {
      setLoading(true);

      // Buscar usuários
      const usersResponse = await fetch('/api/super-admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!usersResponse.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const usersData = await usersResponse.json();
      setUsers(usersData.users);

      // Buscar estatísticas
      const statsResponse = await fetch('/api/super-admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!statsResponse.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const statsData = await statsResponse.json();
      setStats(statsData.stats);

    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Token')) {
        router.push('/super-admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const token = localStorage.getItem('superAdminToken');

    if (!token) {
      router.push('/super-admin/login');
      return;
    }

    try {
      setActionLoading(userId);

      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário');
      }

      // Recarregar dados
      await loadData();

    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdmin');
    router.push('/super-admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Super Admin
              </h1>
              <p className="text-sm text-gray-600">Painel de Controle do Sistema</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Usuários
                </CardTitle>
                <Users className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Contas registradas no sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Usuários Ativos
                </CardTitle>
                <UserCheck className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.active_users}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Contas ativas e funcionando
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Usuários Inativos
                </CardTitle>
                <UserX className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.inactive_users}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Contas desativadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Clientes
                </CardTitle>
                <Briefcase className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.total_clients}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Clientes cadastrados
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciar Usuários
            </CardTitle>
            <CardDescription>
              Lista completa de usuários cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum usuário cadastrado
                </p>
              ) : (
                users.map((user) => (
                  <Card key={user.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{user.name}</h3>
                            {user.is_active ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Ativa
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inativa
                              </Badge>
                            )}
                            {user.email_verified && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                Verificado
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </div>
                            )}
                            {user.company_name && (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {user.company_name}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          disabled={actionLoading === user.id}
                          variant={user.is_active ? "destructive" : "default"}
                          className={user.is_active ? "" : "bg-green-600 hover:bg-green-700"}
                        >
                          {actionLoading === user.id ? (
                            'Processando...'
                          ) : user.is_active ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
