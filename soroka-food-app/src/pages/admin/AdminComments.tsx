import { useState } from 'react';
import { Link } from 'react-router-dom';
import { comments, recipes } from '../../data/recipes';
import type { CommentWithRecipe } from '../../types';
import './AdminCommon.css';

function AdminComments() {
  const allComments: CommentWithRecipe[] = Object.entries(comments).flatMap(([recipeId, cmts]) =>
    cmts.map(comment => ({
      ...comment,
      recipeId: Number(recipeId),
      recipeName: recipes.find(r => r.id === Number(recipeId))?.title || '',
      status: 'approved' as const
    }))
  );

  const [commentsList, setCommentsList] = useState(allComments);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'spam'>('all');

  const filteredComments = commentsList.filter(comment => {
    if (statusFilter === 'all') return true;
    return comment.status === statusFilter;
  });

  const handleApprove = (id: number) => {
    setCommentsList(commentsList.map(c =>
      c.id === id ? { ...c, status: 'approved' as const } : c
    ));
  };

  const handleMarkAsSpam = (id: number) => {
    setCommentsList(commentsList.map(c =>
      c.id === id ? { ...c, status: 'spam' as const } : c
    ));
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Удалить комментарий?')) {
      setCommentsList(commentsList.filter(c => c.id !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      approved: { text: 'Одобрен', class: 'status-approved' },
      pending: { text: 'На модерации', class: 'status-pending' },
      spam: { text: 'Спам', class: 'status-spam' }
    };
    const badge = badges[status as keyof typeof badges] || badges.approved;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

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
            <option value="all">Все ({commentsList.length})</option>
            <option value="approved">Одобренные ({commentsList.filter(c => c.status === 'approved').length})</option>
            <option value="pending">На модерации ({commentsList.filter(c => c.status === 'pending').length})</option>
            <option value="spam">Спам ({commentsList.filter(c => c.status === 'spam').length})</option>
          </select>
        </div>
      </div>

      <div className="comments-list">
        {filteredComments.map(comment => (
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
                📝 {comment.recipeName}
              </Link>
              <span className="rating">⭐ {comment.rating}</span>
            </div>
            <div className="comment-actions">
              {comment.status !== 'approved' && (
                <button onClick={() => handleApprove(comment.id)} className="btn-approve">
                  ✓ Одобрить
                </button>
              )}
              {comment.status !== 'spam' && (
                <button onClick={() => handleMarkAsSpam(comment.id)} className="btn-spam">
                  ⚠ Спам
                </button>
              )}
              <button onClick={() => handleDelete(comment.id)} className="btn-delete">
                🗑️ Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredComments.length === 0 && (
        <div className="no-results">
          <p>Комментарии не найдены</p>
        </div>
      )}
    </div>
  );
}

export default AdminComments;
