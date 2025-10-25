import { useState } from 'react';
import { recipes } from '../../data/recipes';
import type { ExtendedCategory } from '../../types';
import './AdminCommon.css';

function AdminCategories() {
  const allCategories = Array.from(new Set(recipes.flatMap(recipe => recipe.category)));

  const [categories, setCategories] = useState<ExtendedCategory[]>(
    allCategories.map((cat, index) => ({
      id: index + 1,
      name: cat,
      slug: cat.toLowerCase().replace(/\s+/g, '-'),
      recipeCount: recipes.filter(r => r.category.includes(cat)).length,
      description: ''
    }))
  );

  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const handleAdd = () => {
    if (newCategory.name.trim()) {
      const category: ExtendedCategory = {
        id: categories.length + 1,
        name: newCategory.name,
        slug: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        description: newCategory.description,
        recipeCount: 0
      };
      setCategories([...categories, category]);
      setNewCategory({ name: '', description: '' });
      setIsAdding(false);
    }
  };

  const handleDelete = (id: number) => {
    const category = categories.find(c => c.id === id);
    if (category && category.recipeCount > 0) {
      alert(`Невозможно удалить категорию "${category.name}", так как в ней ${category.recipeCount} рецептов`);
      return;
    }
    if (window.confirm('Удалить категорию?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

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
                  <span className="count-badge">{category.recipeCount}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn-edit" title="Редактировать">✏️</button>
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
    </div>
  );
}

export default AdminCategories;
