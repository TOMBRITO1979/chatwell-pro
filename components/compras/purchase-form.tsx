'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface PurchaseFormProps {
  purchase: any | null;
  onClose: () => void;
}

export function PurchaseForm({ purchase, onClose }: PurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    unit: 'un',
    category: 'outros',
    estimated_price: '',
    purchased: false,
    notes: ''
  });

  useEffect(() => {
    if (purchase) {
      setFormData({
        item_name: purchase.item_name || '',
        quantity: purchase.quantity || 1,
        unit: purchase.unit || 'un',
        category: purchase.category || 'outros',
        estimated_price: purchase.estimated_price || '',
        purchased: purchase.purchased || false,
        notes: purchase.notes || ''
      });
    }
  }, [purchase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = purchase ? `/api/purchases/${purchase.id}` : '/api/purchases';
      const method = purchase ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        quantity: parseInt(String(formData.quantity)) || 1,
        estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : 0
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
        alert(purchase ? 'Item atualizado!' : 'Item adicionado!');
        onClose();
      } else {
        alert(data.message || 'Erro ao salvar item');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar item');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'alimentos', label: '🍎 Alimentos' },
    { value: 'limpeza', label: '🧹 Limpeza' },
    { value: 'higiene', label: '🧴 Higiene' },
    { value: 'bebidas', label: '🥤 Bebidas' },
    { value: 'papelaria', label: '📝 Papelaria' },
    { value: 'eletronicos', label: '💻 Eletrônicos' },
    { value: 'outros', label: '📦 Outros' }
  ];

  const units = [
    { value: 'un', label: 'Unidade(s)' },
    { value: 'kg', label: 'Kg' },
    { value: 'g', label: 'Gramas' },
    { value: 'l', label: 'Litro(s)' },
    { value: 'ml', label: 'Ml' },
    { value: 'cx', label: 'Caixa(s)' },
    { value: 'pct', label: 'Pacote(s)' },
    { value: 'dz', label: 'Dúzia(s)' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {purchase ? 'Editar Item' : 'Adicionar Item'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="item_name">Nome do Item *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                required
                placeholder="Ex: Arroz, Sabão em pó, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <select
                  id="unit"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="estimated_price">Preço Estimado (R$)</Label>
                <Input
                  id="estimated_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimated_price}
                  onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="purchased"
                checked={formData.purchased}
                onChange={(e) => setFormData({ ...formData, purchased: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="purchased" className="cursor-pointer">
                Marcar como comprado
              </Label>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Marca específica, local de compra, etc..."
              />
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
