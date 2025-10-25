import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { CommentWithRecipe } from '../../types';
import './AdminCommon.css';

function AdminComments() {
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'APPROVED' | 'PENDING' | 'SPAM'>('all');

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
    } catch (err) {
      setError('Не удалось загрузить комментарии');
      console.error('Error fetching comments:', err);
      setCommentsList([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredComments = commentsList;

  const handleApprove = async (id: number) => {
    try {
      await api.admin.comments.updateStatus(id, 'APPROVED');
      fetchComments();
    } catch (err) {
      alert('Не удалось одобрить комментарий');
      console.error('Error approving comment:', err);
    }
  };

  const handleMarkAsSpam = async (id: number) => {
    try {
      await api.admin.comments.updateStatus(id, 'SPAM');
      fetchComments();
    } catch (err) {
      alert('Не удалось отметить как спам');
      console.error('Error marking as spam:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить комментарий?')) {
      try {
        await api.admin.comments.delete(id);
        fetchComments();
      } catch (err) {
        alert('Не удалось удалить комментарий');
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
      </div>

      <div className="comments-list">
        {Array.isArray(filteredComments) && filteredComments.length > 0 ? (
          filteredComments.map(comment => (
            <div key={comment.id} className="comment-card">
            <div className="comment-card-header">
              <div className="comment-author">
                <strong>{comment.author}</strong>
                <span className="comment-date">{comment.date}</span>
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
