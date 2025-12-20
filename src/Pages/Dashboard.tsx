import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

interface Stats {
  totalSales: number;
  todaySales: number;
  totalCustomers: number;
  totalItems: number;
  lowStockItems: number;
  pendingDeliveries: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    todaySales: 0,
    totalCustomers: 0,
    totalItems: 0,
    lowStockItems: 0,
    pendingDeliveries: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [salesResult, todaySalesResult, customersResult, itemsResult, inventoryResult, deliveriesResult, recentSalesResult] =
        await Promise.all([
          supabase.from('sales').select('total_amount', { count: 'exact' }).eq('status', 'completed'),
          supabase.from('sales').select('total_amount').eq('status', 'completed').gte('created_at', today),
          supabase.from('customers').select('id', { count: 'exact' }),
          supabase.from('items').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('inventory').select('quantity, items!inner(reorder_level)'),
          supabase.from('deliveries').select('id', { count: 'exact' }).eq('status', 'pending'),
          supabase
            .from('sales')
            .select('*, customers(name), staff(employee_code)')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

      const totalSales = salesResult.data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const todaySales = todaySalesResult.data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

      const lowStock =
        inventoryResult.data?.filter((inv: any) => inv.quantity <= inv.items.reorder_level).length || 0;

      setStats({
        totalSales,
        todaySales,
        totalCustomers: customersResult.count || 0,
        totalItems: itemsResult.count || 0,
        lowStockItems: lowStock,
        pendingDeliveries: deliveriesResult.count || 0,
      });

      setRecentSales(recentSalesResult.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats.totalSales.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats.todaySales.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.lowStockItems}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Deliveries</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingDeliveries}</p>
            </div>
            <div className="bg-teal-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sale Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No sales yet
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {sale.sale_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.customers?.name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.staff?.employee_code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${sale.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : sale.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
