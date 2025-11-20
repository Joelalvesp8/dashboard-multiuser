import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'bg-primary-100 text-primary-700'
      : 'text-gray-700 hover:bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive(
                    '/dashboard'
                  )}`}
                >
                  Dashboard
                </Link>
                {hasPermission('view_users') && (
                  <Link
                    to="/users"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive(
                      '/users'
                    )}`}
                  >
                    Usuários
                  </Link>
                )}
                {hasPermission('manage_roles') && (
                  <Link
                    to="/roles"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive(
                      '/roles'
                    )}`}
                  >
                    Roles & Permissões
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-sm text-gray-700 mr-4">
                  Olá, <span className="font-medium">{user?.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({user?.role})</span>
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
