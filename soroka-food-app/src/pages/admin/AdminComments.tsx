import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './AdminCommon.css';

type SortOption = 'newest' | 'oldest' | 'rating-high' | 'rating-low';

function AdminComments() {
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'APPROVED' | 'PENDING' | 'SPAM'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchComments();
  }, [statusFilter]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await api.admin.comments.getAll(status as any);
      setCommentsList(Array.isArray(data) ? data : []);
      setSelectedIds(new Set()); // Clear selection on reload
    } catch (err) {
      setError('Не удалось загрузить комментарии');
      console.error('Error fetching comments:', err);
      setCommentsList([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredComments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredComments.map(c => c.id)));
    }
  };

  const handleBulkAction = async (action: 'delete' | 'approve' | 'spam' | 'pending') => {
    if (selectedIds.size === 0) {
      toast.error('Выберите хотя бы один комментарий');
      return;
    }

    const actionNames = {
      delete: 'удалить',
      approve: 'одобрить',
      spam: 'пометить как спам',
      pending: 'вернуть на модерацию'
    };

    if (action === 'delete' && !window.confirm(`Вы уверены, что хотите удалить ${selectedIds.size} комментариев?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const result = await api.admin.comments.bulkAction(Array.from(selectedIds), action);
      toast.success(`Успешно обработано: ${result.count} комментариев`);
      fetchComments();
    } catch (err: any) {
      toast.error(err.message || `Не удалось ${actionNames[action]} комментарии`);
      console.error('Error bulk action:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня, ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Вчера, ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return diffDays + ' дн. назад';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const sortComments = (comments: any[]): any[] => {
    const sorted = [...comments];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'rating-high':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'rating-low':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  };

  const filteredComments = sortComments(commentsList);

  const handleApprove = async (id: number) => {
    try {
      await api.admin.comments.updateStatus(id, 'APPROVED');
      fetchComments();
      toast.success('Комментарий одобрен');
    } catch (err) {
      toast.error('Не удалось одобрить комментарий');
      console.error('Error approving comment:', err);
    }
  };

  const handleMarkAsSpam = async (id: number) => {
    try {
      await api.admin.comments.updateStatus(id, 'SPAM');
      fetchComments();
      toast.success('Комментарий помечен как спам');
    } catch (err) {
      toast.error('Не удалось отметить как спам');
      console.error('Error marking as spam:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить комментарий?')) {
      try {
        await api.admin.comments.delete(id);
        fetchComments();
        toast.success('Комментарий удален');
      } catch (err) {
        toast.error('Не удалось удалить комментарий');
        console.error('Error deleting comment:', err);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      APPROVED: { text: 'Одобрен', class: 'status-approved' },
      PENDING: { text: 'На модерации', class: 'status-pending' },
      SPAM: { text: 'Спам', class: 'status-spam' }
    };
    const badge = badges[status as keyof typeof badges] || badges.APPROVED;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return <div className="loading-message">Загрузка комментариев...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-common">
      <div className="filters-bar">
        <div className="filter-group">
          <label>Статус:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="filter-select"
          >
            <option value="all">Все ({Array.isArray(commentsList) ? commentsList.length : 0})</option>
            <option value="APPROVED">Одобренные ({Array.isArray(commentsList) ? commentsList.filter(c => c.status === 'APPROVED').length : 0})</option>
            <option value="PENDING">На модерации ({Array.isArray(commentsList) ? commentsList.filter(c => c.status === 'PENDING').length : 0})</option>
            <option value="SPAM">Спам ({Array.isArray(commentsList) ? commentsList.filter(c => c.status === 'SPAM').length : 0})</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Сортировка:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="filter-select"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="rating-high">По рейтингу (высокий)</option>
            <option value="rating-low">По рейтингу (низкий)</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-info">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredComments.length}
                onChange={toggleSelectAll}
              />
              <span>Выбрано: {selectedIds.size}</span>
            </label>
          </div>
          <div className="bulk-actions-buttons">
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={bulkActionLoading}
              className="btn-bulk btn-bulk-approve"
            >
              ✓ Одобрить
            </button>
            <button
              onClick={() => handleBulkAction('spam')}
              disabled={bulkActionLoading}
              className="btn-bulk btn-bulk-spam"
            >
              ⚠ Спам
            </button>
            <button
              onClick={() => handleBulkAction('pending')}
              disabled={bulkActionLoading}
              className="btn-bulk btn-bulk-pending"
            >
              ⏸ На модерацию
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={bulkActionLoading}
              className="btn-bulk btn-bulk-delete"
            >
              🗑️ Удалить
            </button>
          </div>
        </div>
      )}

      <div className="comments-list">
        {Array.isArray(filteredComments) && filteredComments.length > 0 ? (
          filteredComments.map(comment => (
            <div key={comment.id} className={`comment-card ${selectedIds.has(comment.id) ? 'selected' : ''}`}>
            <div className="comment-card-header">
              <label className="comment-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.has(comment.id)}
                  onChange={() => toggleSelect(comment.id)}
                />
              </label>
              <div className="comment-author">
                <strong>{comment.author}</strong>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
              </div>
              {getStatusBadge(comment.status)}
            </div>
            <div className="comment-text">
              {comment.text}
            </div>
            <div className="comment-meta">
              <Link to={`/recipe/${comment.recipeId}`} className="recipe-link">
                📝 {comment.recipe?.title || 'Рецепт #' + comment.recipeId}
              </Link>
              <span className="rating">⭐ {comment.rating}</span>
            </div>
            <div className="comment-actions">
              {comment.status !== 'APPROVED' && (
                <button onClick={() => handleApprove(comment.id)} className="btn-approve">
                  ✓ Одобрить
                </button>
              )}
              {comment.status !== 'SPAM' && (
                <button onClick={() => handleMarkAsSpam(comment.id)} className="btn-spam">
                  ⚠ Спам
                </button>
              )}
              <button onClick={() => handleDelete(comment.id)} className="btn-delete">
                🗑️ Удалить
              </button>
            </div>
          </div>
          ))
        ) : (
          <div className="no-results">
            <p>Комментарии не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminComments;
