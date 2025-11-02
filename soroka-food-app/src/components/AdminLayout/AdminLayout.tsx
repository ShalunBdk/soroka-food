import { Link, useLocation, useNavigate } from 'react-router-dom';
import { tokenManager } from '../../services/api';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = tokenManager.getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

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
    { path: '/admin/static-pages', label: 'Статические страницы', icon: '📄' },
    { path: '/admin/settings', label: 'Настройки', icon: '⚙️' },
    ...(isSuperAdmin ? [{ path: '/admin/spam-filter', label: 'Спам-фильтр', icon: '🛡️' }] : [])
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
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
