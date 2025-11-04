import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api, { tokenManager } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './AdminEmailLogs.css';

interface EmailLog {
  id: number;
  recipient: string;
  subscriberEmail: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  template: {
    id: number;
    name: string;
    type: string;
  } | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

export default function AdminEmailLogs() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState('');

  // Check if user is at least ADMIN
  useEffect(() => {
    const userData = tokenManager.getCurrentUser();
    if (!userData) {
      navigate('/admin/login');
      return;
    }

    if (userData.role !== 'SUPER_ADMIN' && userData.role !== 'ADMIN') {
      showToast('Access denied. Only ADMIN and above can view email logs.', 'error');
      navigate('/admin');
      return;
    }

    loadLogs();
    loadStats();
  }, [currentPage, pageSize, statusFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: pageSize
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const data = await api.admin.emailLogs.getAll(params);
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      console.error('Failed to load email logs:', error);
      showToast(error.message || 'Failed to load email logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.admin.emailLogs.getStats();
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load email stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      SENT: { color: 'success', text: 'Отправлено' },
      FAILED: { color: 'error', text: 'Ошибка' },
      PENDING: { color: 'warning', text: 'В очереди' }
    };

    const badge = badges[status] || { color: 'default', text: status };
    return <span className={`status-badge status-${badge.color}`}>{badge.text}</span>;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="admin-email-logs">
        <div className="loading">Загрузка логов писем...</div>
      </div>
    );
  }

  return (
    <div className="admin-email-logs">
      <div className="logs-header">
        <h1>Логи Email рассылок</h1>
        <p className="subtitle">История отправленных писем подписчикам</p>
      </div>

      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{stats.totalSent}</div>
            <div className="stat-label">Всего отправлено</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalFailed}</div>
            <div className="stat-label">Ошибок</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalPending}</div>
            <div className="stat-label">В очереди</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.recentActivity}</div>
            <div className="stat-label">За 24 часа</div>
          </div>
        </div>
      )}

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Фильтр по статусу:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Все</option>
            <option value="SENT">Отправлено</option>
            <option value="FAILED">Ошибка</option>
            <option value="PENDING">В очереди</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="page-size">На странице:</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Получатель</th>
              <th>Тема письма</th>
              <th>Шаблон</th>
              <th>Статус</th>
              <th>Ошибка</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{log.recipient}</td>
                <td className="subject-cell">{log.subject}</td>
                <td>
                  {log.template ? (
                    <span className="template-badge">
                      {log.template.name}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{getStatusBadge(log.status)}</td>
                <td className="error-cell">
                  {log.error ? (
                    <span className="error-text" title={log.error}>
                      {log.error.substring(0, 50)}...
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && !loading && (
          <div className="no-logs">
            <p>Нет логов отправки писем</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Назад
          </button>
          <span className="page-info">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}
