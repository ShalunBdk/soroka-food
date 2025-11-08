import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { tokenManager } from '../../services/api';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentUser = tokenManager.getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdminOrAbove = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.admin-sidebar') && !target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Дашборд', icon: '📊' },
    { path: '/admin/recipes', label: 'Рецепты', icon: '📝' },
    { path: '/admin/categories', label: 'Категории', icon: '🗂️' },
    { path: '/admin/tags', label: 'Теги', icon: '🏷️' },
    { path: '/admin/comments', label: 'Комментарии', icon: '💬' },
    { path: '/admin/users', label: 'Пользователи', icon: '👥' },
    { path: '/admin/newsletter', label: 'Подписчики', icon: '✉️' },
    ...(isAdminOrAbove ? [
      { path: '/admin/email-logs', label: 'Email логи', icon: '📧' }
    ] : []),
    { path: '/admin/static-pages', label: 'Статические страницы', icon: '📄' },
    { path: '/admin/settings', label: 'Настройки', icon: '⚙️' },
    ...(isSuperAdmin ? [
      { path: '/admin/smtp', label: 'SMTP настройки', icon: '📬' },
      { path: '/admin/spam-filter', label: 'Спам-фильтр', icon: '🛡️' },
      { path: '/admin/logs', label: 'Логи администраторов', icon: '📋' }
    ] : [])
  ];

  return (
    <div className="admin-layout">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-logo">
          <Link to="/">
            <h2>Soroka Admin</h2>
          </Link>
        </div>
        <nav className="admin-nav">
          <ul>
            {menuItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-content">
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Открыть меню"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <h1 className="admin-page-title">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Админ-панель'}
            </h1>
            <div className="admin-user-menu">
              <span className="admin-username">Администратор</span>
              <button onClick={handleLogout} className="admin-logout-btn">
                Выйти
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
