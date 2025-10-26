import { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminCommon.css';

function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'UNSUBSCRIBED'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.newsletter.getAll();
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Не удалось загрузить подписчиков');
      console.error('Error fetching subscribers:', err);
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = (subscribers || []).filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить подписчика?')) {
      try {
        await api.admin.newsletter.delete(id);
        fetchSubscribers();
      } catch (err) {
        alert('Не удалось удалить подписчика');
        console.error('Error deleting subscriber:', err);
      }
    }
  };

  const handleExport = () => {
    if (!filteredSubscribers || filteredSubscribers.length === 0) {
      alert('Нет подписчиков для экспорта');
      return;
    }

    const csv = [
      'ID,Email,Дата подписки,Статус',
      ...filteredSubscribers.map(s =>
        `${s.id},${s.email},${new Date(s.createdAt).toLocaleDateString()},${s.status === 'ACTIVE' ? 'Активен' : 'Отписан'}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
  };

  if (loading) {
    return <div className="loading-message">Загрузка подписчиков...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-common">
      <div className="page-header">
        <button onClick={handleExport} className="btn-primary">
          💾 Экспорт в CSV
        </button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Поиск:</label>
          <input
            type="text"
            placeholder="Поиск по email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Статус:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="filter-select"
          >
            <option value="all">Все ({Array.isArray(subscribers) ? subscribers.length : 0})</option>
            <option value="ACTIVE">Активные ({Array.isArray(subscribers) ? subscribers.filter(s => s.status === 'ACTIVE').length : 0})</option>
            <option value="UNSUBSCRIBED">Отписанные ({Array.isArray(subscribers) ? subscribers.filter(s => s.status === 'UNSUBSCRIBED').length : 0})</option>
          </select>
        </div>

        <div className="filter-results">
          Найдено: {filteredSubscribers.length}
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th>Email</th>
              <th style={{ width: '150px' }}>Дата подписки</th>
              <th style={{ width: '120px' }}>Статус</th>
              <th style={{ width: '100px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map(subscriber => (
              <tr key={subscriber.id}>
                <td>{subscriber.id}</td>
                <td><strong>{subscriber.email}</strong></td>
                <td>{new Date(subscriber.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${subscriber.status === 'ACTIVE' ? 'status-approved' : 'status-pending'}`}>
                    {subscriber.status === 'ACTIVE' ? 'Активен' : 'Отписан'}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      onClick={() => handleDelete(subscriber.id)}
                      className="btn-delete"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubscribers.length === 0 && (
        <div className="no-results">
          <p>Подписчики не найдены</p>
        </div>
      )}
    </div>
  );
}

export default AdminNewsletter;
