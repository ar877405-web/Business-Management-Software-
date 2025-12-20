import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  UsersRound,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  CreditCard,
  Printer,
  TrendingUp,
  DollarSign,
  Clock,
  Wallet,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
  { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { id: 'items', label: 'Items', icon: Package, roles: ['admin', 'manager'] },
  { id: 'inventory', label: 'Inventory', icon: TrendingUp, roles: ['admin', 'manager'] },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
  { id: 'vendors', label: 'Vendors', icon: Truck, roles: ['admin', 'manager'] },
  { id: 'staff', label: 'Staff', icon: UsersRound, roles: ['admin', 'manager'] },
  { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['admin', 'manager'] },
  { id: 'payroll', label: 'Payroll', icon: Wallet, roles: ['admin'] },
  { id: 'expenses', label: 'Expenses', icon: DollarSign, roles: ['admin', 'manager'] },
  { id: 'credit', label: 'Credit/Debit', icon: CreditCard, roles: ['admin', 'manager'] },
  { id: 'deliveries', label: 'Deliveries', icon: Truck, roles: ['admin', 'manager', 'cashier'] },
  { id: 'receipts', label: 'Receipts', icon: FileText, roles: ['admin', 'manager', 'cashier'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { id: 'printers', label: 'Printers', icon: Printer, roles: ['admin', 'manager'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredNavItems = navigationItems.filter(
    (item) => profile && item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">POS System</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{profile?.full_name}</div>
              <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-20 transform transition-transform lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1 overflow-y-auto h-full">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="lg:ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
