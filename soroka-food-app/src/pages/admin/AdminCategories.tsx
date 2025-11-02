import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './AdminCommon.css';

function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.categories.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Не удалось загрузить категории');
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (newCategory.name.trim() && newCategory.slug.trim()) {
      try {
        await api.admin.categories.create({
          name: newCategory.name,
          slug: newCategory.slug,
          description: newCategory.description
        });
        setNewCategory({ name: '', slug: '', description: '' });
        setIsAdding(false);
        fetchCategories();
        toast.success('Категория успешно создана');
      } catch (err) {
        toast.error('Не удалось создать категорию');
        console.error('Error creating category:', err);
      }
    }
  };

  const handleDelete = async (id: number) => {
    const category = categories.find(c => c.id === id);
    if (category && category.recipeCount > 0) {
      toast.warning(`Невозможно удалить категорию "${category.name}", так как в ней ${category.recipeCount} рецептов`);
      return;
    }
    if (window.confirm('Удалить категорию?')) {
      try {
        await api.admin.categories.delete(id);
        fetchCategories();
        toast.success('Категория успешно удалена');
      } catch (err) {
        toast.error('Не удалось удалить категорию');
        console.error('Error deleting category:', err);
      }
    }
  };

  if (loading) {
    return <div className="loading-message">Загрузка категорий...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-common">
      <div className="page-header">
        <button onClick={() => setIsAdding(!isAdding)} className="btn-primary">
          {isAdding ? 'Отмена' : '➕ Добавить категорию'}
        </button>
      </div>

      {isAdding && (
        <div className="add-form">
          <h3>Новая категория</h3>
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Название категории"
            />
          </div>
          <div className="form-group">
            <label>Slug (URL) *</label>
            <input
              type="text"
              value={newCategory.slug}
              onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              placeholder="salads, desserts, etc."
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Описание категории"
              rows={3}
            />
          </div>
          <button onClick={handleAdd} className="btn-submit">Создать</button>
        </div>
      )}

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Slug</th>
              <th>Описание</th>
              <th>Рецептов</th>
              <th style={{ width: '120px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td><strong>{category.name}</strong></td>
                <td><code>{category.slug}</code></td>
                <td>{category.description || '-'}</td>
                <td>
                  <span className="count-badge">{category.recipeCount || 0}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      onClick={() => handleDelete(category.id)}
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

      {categories.length === 0 && (
        <div className="no-results">
          <p>Категории не найдены</p>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
