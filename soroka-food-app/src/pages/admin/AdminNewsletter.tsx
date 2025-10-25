import { useState } from 'react';
import type { NewsletterSubscriber } from '../../types';
import './AdminCommon.css';

function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([
    { id: 1, email: 'user1@example.com', subscribedDate: '15.10.2024', status: 'active' },
    { id: 2, email: 'user2@example.com', subscribedDate: '14.10.2024', status: 'active' },
    { id: 3, email: 'user3@example.com', subscribedDate: '13.10.2024', status: 'unsubscribed' },
    { id: 4, email: 'user4@example.com', subscribedDate: '12.10.2024', status: 'active' },
    { id: 5, email: 'user5@example.com', subscribedDate: '11.10.2024', status: 'active' }
  ]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Удалить подписчика?')) {
      setSubscribers(subscribers.filter(s => s.id !== id));
    }
  };

  const handleExport = () => {
    const csv = [
      'ID,Email,Дата подписки,Статус',
      ...filteredSubscribers.map(s =>
        `${s.id},${s.email},${s.subscribedDate},${s.status === 'active' ? 'Активен' : 'Отписан'}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
  };

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
            <option value="all">Все ({subscribers.length})</option>
            <option value="active">Активные ({subscribers.filter(s => s.status === 'active').length})</option>
            <option value="unsubscribed">Отписанные ({subscribers.filter(s => s.status === 'unsubscribed').length})</option>
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
                <td>{subscriber.subscribedDate}</td>
                <td>
                  <span className={`status-badge ${subscriber.status === 'active' ? 'status-approved' : 'status-pending'}`}>
                    {subscriber.status === 'active' ? 'Активен' : 'Отписан'}
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
