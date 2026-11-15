import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  const { token, signOut } = useAdminAuth();
  const location = useLocation();

  if (!token) return <Navigate replace to="/admin/login" state={{ from: location.pathname }} />;

  return (
    <div className="admin-shell">
      <AdminSidebar onSignOut={signOut} />
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
