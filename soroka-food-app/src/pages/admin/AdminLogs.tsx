import { useState, useEffect } from 'react';
import api, { tokenManager } from '../../services/api';
import { type AdminLog, type AdminLogsResponse, type User } from '../../types';
import './AdminLogs.css';

function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Filters
  const [userFilter, setUserFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  // Users list for filter dropdown
  const [users, setUsers] = useState<User[]>([]);

  const currentUser = tokenManager.getCurrentUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, userFilter, actionFilter, resourceFilter, startDate, endDate]);

  const fetchUsers = async () => {
    try {
      const data = await api.admin.users.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit };
      if (userFilter) params.userId = parseInt(userFilter);
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response: AdminLogsResponse = await api.admin.logs.getAll(params);
      setLogs(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить логи');
      console.error('Error fetching logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setUserFilter('');
    setActionFilter('');
    setResourceFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionBadgeClass = (action: string): string => {
    if (action.startsWith('CREATE') || action.startsWith('UPLOAD')) {
      return 'action-badge action-create';
    } else if (action.startsWith('UPDATE') || action.startsWith('RENAME') || action.startsWith('PUBLISH') || action.startsWith('UNPUBLISH')) {
      return 'action-badge action-update';
    } else if (action.startsWith('DELETE') || action.startsWith('BULK_DELETE')) {
      return 'action-badge action-delete';
    } else if (action.startsWith('APPROVE') || action.startsWith('BULK_APPROVE')) {
      return 'action-badge action-approve';
    } else if (action.includes('SPAM') || action.includes('REJECT')) {
      return 'action-badge action-spam';
    } else if (action === 'LOGIN' || action === 'LOGOUT') {
      return 'action-badge action-auth';
    }
    return 'action-badge action-other';
  };

  const formatAction = (action: string): string => {
    const actionMap: { [key: string]: string } = {
      'LOGIN': 'Вход',
      'LOGOUT': 'Выход',
      'CREATE_RECIPE': 'Создание рецепта',
      'UPDATE_RECIPE': 'Обновление рецепта',
      'DELETE_RECIPE': 'Удаление рецепта',
      'PUBLISH_RECIPE': 'Публикация рецепта',
      'UNPUBLISH_RECIPE': 'Снятие с публикации',
      'CREATE_CATEGORY': 'Создание категории',
      'UPDATE_CATEGORY': 'Обновление категории',
      'DELETE_CATEGORY': 'Удаление категории',
      'RENAME_TAG': 'Переименование тега',
      'DELETE_TAG': 'Удаление тега',
      'APPROVE_COMMENT': 'Одобрение комментария',
      'REJECT_COMMENT': 'Отклонение комментария',
      'MARK_SPAM_COMMENT': 'Пометка как спам',
      'DELETE_COMMENT': 'Удаление комментария',
      'BULK_APPROVE_COMMENTS': 'Массовое одобрение',
      'BULK_SPAM_COMMENTS': 'Массовая пометка спам',
      'BULK_PENDING_COMMENTS': 'Массовый возврат на модерацию',
      'BULK_DELETE_COMMENTS': 'Массовое удаление',
      'CREATE_USER': 'Создание пользователя',
      'UPDATE_USER': 'Обновление пользователя',
      'DELETE_USER': 'Удаление пользователя',
      'CHANGE_USER_PASSWORD': 'Смена пароля',
      'TOGGLE_USER_STATUS': 'Изменение статуса',
      'EXPORT_SUBSCRIBERS': 'Экспорт подписчиков',
      'DELETE_SUBSCRIBER': 'Удаление подписчика',
      'UPDATE_SITE_SETTINGS': 'Обновление настроек',
      'UPDATE_STATIC_PAGE': 'Обновление статичной страницы',
      'UPDATE_SPAM_FILTER': 'Обновление спам-фильтра',
      'ADD_SPAM_KEYWORD': 'Добавление спам-слова',
      'REMOVE_SPAM_KEYWORD': 'Удаление спам-слова',
      'UPLOAD_RECIPE_IMAGE': 'Загрузка изображения рецепта',
      'UPLOAD_STEP_IMAGES': 'Загрузка изображений шагов',
    };
    return actionMap[action] || action;
  };

  const formatResource = (resource: string): string => {
    const resourceMap: { [key: string]: string } = {
      'recipes': 'Рецепты',
      'categories': 'Категории',
      'tags': 'Теги',
      'comments': 'Комментарии',
      'users': 'Пользователи',
      'newsletter': 'Рассылка',
      'settings': 'Настройки',
      'static_pages': 'Статичные страницы',
      'spam_filter': 'Спам-фильтр',
      'auth': 'Аутентификация',
      'uploads': 'Загрузки',
    };
    return resourceMap[resource] || resource;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const toggleExpandLog = (logId: number) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  // Only SUPER_ADMIN can access logs
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="admin-logs">
        <h1>Доступ запрещен</h1>
        <p>Только главные администраторы могут просматривать логи.</p>
      </div>
    );
  }

  if (loading && logs.length === 0) {
    return (
      <div className="admin-logs">
        <h1>Логи администраторов</h1>
        <p>Загрузка логов...</p>
      </div>
    );
  }

  return (
    <div className="admin-logs">
      <div className="admin-logs-header">
        <h1>Логи администраторов</h1>
        <p className="total-count">Всего записей: {total}</p>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <div className="filter-group">
          <label>Пользователь:</label>
          <select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.role})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Действие:</label>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            <option value="LOGIN">Вход</option>
            <option value="CREATE_RECIPE">Создание рецепта</option>
            <option value="UPDATE_RECIPE">Обновление рецепта</option>
            <option value="DELETE_RECIPE">Удаление рецепта</option>
            <option value="CREATE_USER">Создание пользователя</option>
            <option value="DELETE_USER">Удаление пользователя</option>
            <option value="APPROVE_COMMENT">Одобрение комментария</option>
            <option value="MARK_SPAM_COMMENT">Пометка спам</option>
            <option value="UPDATE_SITE_SETTINGS">Обновление настроек</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Ресурс:</label>
          <select value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}>
            <option value="">Все</option>
            <option value="recipes">Рецепты</option>
            <option value="categories">Категории</option>
            <option value="comments">Комментарии</option>
            <option value="users">Пользователи</option>
            <option value="settings">Настройки</option>
          </select>
        </div>

        <div className="filter-group">
          <label>С даты:</label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
        </div>

        <div className="filter-group">
          <label>По дату:</label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
        </div>

        <button className="btn-reset" onClick={handleResetFilters}>
          Сбросить фильтры
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Logs Table */}
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата/Время</th>
              <th>Пользователь</th>
              <th>Действие</th>
              <th>Ресурс</th>
              <th>ID Ресурса</th>
              <th>IP Адрес</th>
              <th>Детали</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-logs">
                  {loading ? 'Загрузка...' : 'Логи не найдены'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr key={log.id} className="log-row">
                    <td>{log.id}</td>
                    <td className="log-date">{formatDate(log.createdAt)}</td>
                    <td className="log-user">
                      {log.user.username}
                      <span className="user-role">{log.user.role}</span>
                    </td>
                    <td>
                      <span className={getActionBadgeClass(log.action)}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td>{formatResource(log.resource)}</td>
                    <td>{log.resourceId || '-'}</td>
                    <td className="log-ip">{log.ipAddress || '-'}</td>
                    <td>
                      {log.details ? (
                        <button
                          className="btn-details"
                          onClick={() => toggleExpandLog(log.id)}
                        >
                          {expandedLog === log.id ? 'Скрыть' : 'Показать'}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                  {expandedLog === log.id && log.details && (
                    <tr className="log-details-row">
                      <td colSpan={8}>
                        <div className="log-details">
                          <h4>Детали действия:</h4>
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
            className="pagination-btn"
          >
            Назад
          </button>
          <span className="page-info">
            Страница {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || loading}
            className="pagination-btn"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminLogs;
