import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Minus, Package, TrendingUp, History } from 'lucide-react';

interface InventoryItem {
  id: string;
  item_id: string;
  quantity: number;
  location: string;
  last_updated: string;
  items: {
    barcode: string | null;
    name: string;
    reorder_level: number;
  };
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, items(barcode, name, reorder_level)')
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const qty = parseInt(adjustmentQty);
      const newQuantity =
        adjustmentType === 'add'
          ? selectedItem.quantity + qty
          : Math.max(0, selectedItem.quantity - qty);

      const { error: invError } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          last_updated: new Date().toISOString(),
        })
        .eq('id', selectedItem.id);

      if (invError) throw invError;

      const { error: moveError } = await supabase.from('stock_movements').insert([
        {
          item_id: selectedItem.item_id,
          type: 'adjustment',
          quantity: adjustmentType === 'add' ? qty : -qty,
          notes: adjustmentNotes,
        },
      ]);

      if (moveError) throw moveError;

      setShowAdjustModal(false);
      setSelectedItem(null);
      setAdjustmentQty('');
      setAdjustmentNotes('');
      loadInventory();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      alert('Error adjusting inventory');
    }
  };

  const openAdjustModal = (item: InventoryItem, type: 'add' | 'remove') => {
    setSelectedItem(item);
    setAdjustmentType(type);
    setShowAdjustModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const lowStockItems = inventory.filter(
    (inv) => inv.quantity <= inv.items.reorder_level
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Track and manage stock levels</p>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Low Stock Alert</h3>
              <p className="text-sm text-red-700 mt-1">
                {lowStockItems.length} item(s) are below reorder level
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reorder Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No inventory items</p>
                  </td>
                </tr>
              ) : (
                inventory.map((inv) => {
                  const isLowStock = inv.quantity <= inv.items.reorder_level;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {inv.items.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inv.items.barcode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-medium ${
                            isLowStock ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {inv.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inv.items.reorder_level}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inv.location}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isLowStock ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <button
                          onClick={() => openAdjustModal(inv, 'add')}
                          className="text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                          title="Add Stock"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAdjustModal(inv, 'remove')}
                          className="text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                          title="Remove Stock"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
              </h2>
              <p className="text-gray-600 mt-1">{selectedItem.items.name}</p>
              <p className="text-sm text-gray-500">
                Current Stock: {selectedItem.quantity}
              </p>
            </div>
            <form onSubmit={handleAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Reason for adjustment..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 text-white py-2 px-4 rounded-lg transition-colors ${
                    adjustmentType === 'add'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setSelectedItem(null);
                    setAdjustmentQty('');
                    setAdjustmentNotes('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
