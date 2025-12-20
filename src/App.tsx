import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Items from './pages/Items';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import Placeholder from './pages/Placeholder';
import {
  Clock,
  Wallet,
  DollarSign,
  CreditCard,
  Truck,
  FileText,
  Printer,
  Settings,
} from 'lucide-react';

function App() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'items':
        return <Items />;
      case 'inventory':
        return <Inventory />;
      case 'customers':
        return <Customers />;
      case 'vendors':
        return <Vendors />;
      case 'staff':
        return <Staff />;
      case 'attendance':
        return (
          <Placeholder
            icon={Clock}
            title="Attendance Management"
            description="Track employee attendance and working hours"
          />
        );
      case 'payroll':
        return (
          <Placeholder
            icon={Wallet}
            title="Payroll Management"
            description="Manage employee salaries and payroll processing"
          />
        );
      case 'expenses':
        return (
          <Placeholder
            icon={DollarSign}
            title="Expense Management"
            description="Track and manage business expenses"
          />
        );
      case 'credit':
        return (
          <Placeholder
            icon={CreditCard}
            title="Credit/Debit Management"
            description="Manage customer credit and payment recovery"
          />
        );
      case 'deliveries':
        return (
          <Placeholder
            icon={Truck}
            title="Delivery Management"
            description="Track and manage home deliveries"
          />
        );
      case 'receipts':
        return (
          <Placeholder
            icon={FileText}
            title="Receipt Management"
            description="View and manage sales receipts"
          />
        );
      case 'reports':
        return <Reports />;
      case 'printers':
        return (
          <Placeholder
            icon={Printer}
            title="Printer Management"
            description="Configure thermal printers and printing settings"
          />
        );
      case 'settings':
        return (
          <Placeholder
            icon={Settings}
            title="System Settings"
            description="Configure tax rates, discounts, and system preferences"
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
