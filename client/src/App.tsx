import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Navbar from './components/common/Navbar';
import CustomerDashboard from './components/customer/CustomerDashboard';
import StaffDashboard from './components/staff/StaffDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import './index.css';

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <>
      <Navbar />
      {user?.role === 'CUSTOMER' && <CustomerDashboard />}
      {user?.role === 'STAFF' && <StaffDashboard />}
      {user?.role === 'ADMIN' && <AdminDashboard />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
