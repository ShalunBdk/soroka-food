import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './AdminCommon.css';

interface Tag {
  name: string;
  count: number;
}

function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.tags.getAll();
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Не удалось загрузить теги');
      console.error('Error fetching tags:', err);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (tagName: string) => {
    setEditingTag(tagName);
    setNewName(tagName);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setNewName('');
  };

  const handleRename = async (oldName: string) => {
    if (newName.trim() && newName !== oldName) {
      try {
        await api.admin.tags.rename(oldName, newName.trim());
        setEditingTag(null);
        setNewName('');
        fetchTags();
        toast.success('Тег успешно переименован');
      } catch (err) {
        toast.error('Не удалось переименовать тег');
        console.error('Error renaming tag:', err);
      }
    } else {
      handleCancelEdit();
    }
  };

  const handleDelete = async (name: string) => {
    const tag = tags.find(t => t.name === name);
    if (tag && tag.count > 0) {
      if (!window.confirm(`Удалить тег "${name}"? Он используется в ${tag.count} рецептах и будет удален из них.`)) {
        return;
      }
    } else if (!window.confirm(`Удалить тег "${name}"?`)) {
      return;
    }

    try {
      await api.admin.tags.delete(name);
      fetchTags();
      toast.success('Тег успешно удален');
    } catch (err) {
      toast.error('Не удалось удалить тег');
      console.error('Error deleting tag:', err);
    }
  };

  if (loading) {
    return <div className="loading-message">Загрузка тегов...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-common">
      <div className="page-header">
        <h2>Управление тегами</h2>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
          Теги создаются при добавлении/редактировании рецептов. Здесь вы можете просматривать, переименовывать и удалять теги из всех рецептов.
        </p>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Название тега</th>
              <th>Используется в рецептах</th>
              <th style={{ width: '150px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag, index) => (
              <tr key={tag.name}>
                <td>{index + 1}</td>
                <td>
                  {editingTag === tag.name ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleRename(tag.name);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        border: '2px solid #4CAF50',
                        borderRadius: '4px',
                        fontSize: '0.95rem'
                      }}
                      autoFocus
                    />
                  ) : (
                    <strong>{tag.name}</strong>
                  )}
                </td>
                <td>
                  <span className="count-badge">{tag.count}</span>
                </td>
                <td>
                  <div className="table-actions">
                    {editingTag === tag.name ? (
                      <>
                        <button
                          onClick={() => handleRename(tag.name)}
                          className="btn-submit"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                          title="Сохранить"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn-delete"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                          title="Отмена"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(tag.name)}
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                          title="Переименовать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(tag.name)}
                          className="btn-delete"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tags.length === 0 && (
        <div className="no-results">
          <p>Теги не найдены</p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>
            Добавьте теги при создании или редактировании рецептов
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminTags;
