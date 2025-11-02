import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { tokenManager } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { type User, type UserRole } from '../../types';
import { canToggleUserStatus, canDeleteUser } from '../../utils/permissions';
import './AdminUsers.css';

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const toast = useToast();
  const currentUser = tokenManager.getCurrentUser();

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterRole = roleFilter !== 'all' ? roleFilter : undefined;
      const data = await api.admin.users.getAll(filterRole);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить пользователей');
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${username}"?`)) {
      try {
        await api.admin.users.delete(id);
        toast.success('Пользователь успешно удален');
        fetchUsers();
      } catch (err: any) {
        toast.error(err.message || 'Не удалось удалить пользователя');
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await api.admin.users.toggleStatus(id, !currentStatus);
      toast.success(`Пользователь ${!currentStatus ? 'активирован' : 'деактивирован'}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Не удалось изменить статус пользователя');
      console.error('Error toggling status:', err);
    }
  };

  const getRoleBadgeClass = (role: UserRole): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'role-badge role-super-admin';
      case 'ADMIN':
        return 'role-badge role-admin';
      case 'MODERATOR':
        return 'role-badge role-moderator';
      default:
        return 'role-badge';
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Главный администратор';
      case 'ADMIN':
        return 'Администратор';
      case 'MODERATOR':
        return 'Модератор';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-users">
        <h1>Управление пользователями</h1>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-users">
        <h1>Управление пользователями</h1>
        <div className="error-message">{error}</div>
        <button onClick={fetchUsers} className="btn-retry">Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="page-header">
        <h1>Управление пользователями</h1>
        <Link to="/admin/users/new" className="btn-primary">
          Создать пользователя
        </Link>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="role-filter">Фильтр по роли:</label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все роли</option>
            <option value="SUPER_ADMIN">Главный администратор</option>
            <option value="ADMIN">Администратор</option>
            <option value="MODERATOR">Модератор</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <p>Всего пользователей: <strong>{users.length}</strong></p>
      </div>

      {users.length === 0 ? (
        <div className="no-users">
          <p>Пользователи не найдены</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Создан</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={!user.active ? 'user-inactive' : ''}>
                  <td>{user.id}</td>
                  <td>
                    <strong>{user.username}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.active ? 'status-active' : 'status-inactive'}`}>
                      {user.active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="actions-cell">
                    <Link to={`/admin/users/${user.id}/edit`} className="btn-edit" title="Редактировать">
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.active)}
                      className={`btn-toggle ${user.active ? 'btn-deactivate' : 'btn-activate'}`}
                      title={user.active ? 'Деактивировать' : 'Активировать'}
                      disabled={!currentUser || !canToggleUserStatus(currentUser.id, currentUser.role, user.id, user.role)}
                    >
                      {user.active ? '🔒' : '🔓'}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      className="btn-delete"
                      title="Удалить"
                      disabled={!currentUser || !canDeleteUser(currentUser.id, currentUser.role, user.id, user.role)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
