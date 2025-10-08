'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Edit, Trash2, Check, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseForm } from './purchase-form';

interface Purchase {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  category: string;
  estimated_price: string;
  purchased: boolean;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  purchased: number;
  total_estimated: number;
}

export function PurchasesList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    purchased: 0,
    total_estimated: 0
  });

  useEffect(() => {
    loadPurchases();
  }, [search, filterCategory, filterStatus]);

  const loadPurchases = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      let url = '/api/purchases?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (filterCategory) url += `category=${filterCategory}&`;
      if (filterStatus) url += `status=${filterStatus}&`;

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
        setPurchases(data.purchases);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar lista de compras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        loadPurchases();
      } else {
        alert(data.message || 'Erro ao deletar item');
      }
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      alert('Erro ao deletar item');
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setShowForm(true);
  };

  const handleTogglePurchased = async (purchase: Purchase) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchases/${purchase.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...purchase,
          purchased: !purchase.purchased
        })
      });

      const data = await response.json();

      if (data.success) {
        loadPurchases();
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPurchase(null);
    loadPurchases();
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'alimentos': '🍎 Alimentos',
      'limpeza': '🧹 Limpeza',
      'higiene': '🧴 Higiene',
      'bebidas': '🥤 Bebidas',
      'papelaria': '📝 Papelaria',
      'eletronicos': '💻 Eletrônicos',
      'outros': '📦 Outros'
    };
    return categories[category] || category;
  };

  const categories = ['alimentos', 'limpeza', 'higiene', 'bebidas', 'papelaria', 'eletronicos', 'outros'];

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-chatwell-blue" />
            Lista de Compras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize suas compras e controle gastos
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="chatwell-gradient text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              A Comprar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Comprados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.purchased}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.total_estimated)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pending">A Comprar</option>
                <option value="purchased">Comprados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando lista...</p>
        </div>
      ) : purchases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              {search || filterCategory || filterStatus
                ? 'Nenhum item encontrado'
                : 'Sua lista de compras está vazia'}
            </p>
            {!search && !filterCategory && !filterStatus && (
              <Button onClick={() => setShowForm(true)} className="chatwell-gradient text-white">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <Card
              key={purchase.id}
              className={`hover:shadow-lg transition-shadow ${
                purchase.purchased ? 'opacity-60 bg-gray-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleTogglePurchased(purchase)}
                    className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      purchase.purchased
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {purchase.purchased && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg mb-1 ${
                          purchase.purchased ? 'line-through text-gray-500' : ''
                        }`}>
                          {purchase.item_name}
                        </h3>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-sm text-gray-600">
                            {getCategoryLabel(purchase.category)}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {purchase.quantity} {purchase.unit}
                          </span>
                          {purchase.estimated_price && parseFloat(purchase.estimated_price) > 0 && (
                            <span className="text-sm font-semibold text-blue-600">
                              {formatCurrency(purchase.estimated_price)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(purchase)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(purchase.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {purchase.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        📝 {purchase.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PurchaseForm
          purchase={editingPurchase}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
