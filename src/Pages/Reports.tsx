import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Calendar, DollarSign, TrendingUp, Package } from 'lucide-react';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalTax: 0,
    totalDiscount: 0,
    itemsSold: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*, sale_items(quantity), customers(name), staff(employee_code)')
        .gte('created_at', `${dateRange.from}T00:00:00`)
        .lte('created_at', `${dateRange.to}T23:59:59`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSalesData(sales || []);

      const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const totalTax = sales?.reduce((sum, sale) => sum + sale.tax_amount, 0) || 0;
      const totalDiscount = sales?.reduce((sum, sale) => sum + sale.discount_amount, 0) || 0;
      const itemsSold = sales?.reduce((sum, sale) => {
        return sum + sale.sale_items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }, 0) || 0;

      setSummary({
        totalSales: sales?.length || 0,
        totalRevenue,
        totalTax,
        totalDiscount,
        itemsSold,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Sale Number', 'Customer', 'Staff', 'Subtotal', 'Tax', 'Discount', 'Total'];
    const rows = salesData.map(sale => [
      new Date(sale.created_at).toLocaleDateString(),
      sale.sale_number,
      sale.customers?.name || 'Walk-in',
      sale.staff?.employee_code || 'N/A',
      sale.subtotal.toFixed(2),
      sale.tax_amount.toFixed(2),
      sale.discount_amount.toFixed(2),
      sale.total_amount.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and export business reports</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalSales}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${summary.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Tax</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${summary.totalTax.toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.itemsSold}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Sales Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
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
                  Subtotal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tax
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : salesData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No sales found for the selected period
                  </td>
                </tr>
              ) : (
                salesData.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {sale.sale_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.customers?.name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.staff?.employee_code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ${sale.subtotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ${sale.tax_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${sale.total_amount.toFixed(2)}
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
