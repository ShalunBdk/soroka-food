import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recipes } from '../../data/recipes';
import './AdminRecipes.css';

function AdminRecipes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const allCategories = Array.from(
    new Set(recipes.flatMap(recipe => recipe.category))
  );

  const filteredRecipes = recipes
    .filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || recipe.category.includes(categoryFilter);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'views':
          return b.views - a.views;
        case 'rating':
          return b.rating - a.rating;
        case 'date':
        default:
          return b.id - a.id;
      }
    });

  const handleDelete = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот рецепт?')) {
      console.log('Удаление рецепта:', id);
      // Здесь будет логика удаления
    }
  };

  return (
    <div className="admin-recipes">
      <div className="admin-recipes-header">
        <div className="header-actions">
          <Link to="/admin/recipes/new" className="btn-primary">
            ➕ Добавить рецепт
          </Link>
        </div>
      </div>

      <div className="admin-recipes-filters">
        <div className="filter-group">
          <label>Поиск:</label>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Категория:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все категории</option>
            {allCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Сортировка:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date">По дате</option>
            <option value="title">По названию</option>
            <option value="views">По просмотрам</option>
            <option value="rating">По рейтингу</option>
          </select>
        </div>

        <div className="filter-results">
          Найдено: {filteredRecipes.length} из {recipes.length}
        </div>
      </div>

      <div className="admin-recipes-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Фото</th>
              <th>Название</th>
              <th style={{ width: '150px' }}>Категория</th>
              <th style={{ width: '100px' }}>Просмотры</th>
              <th style={{ width: '80px' }}>Рейтинг</th>
              <th style={{ width: '100px' }}>Дата</th>
              <th style={{ width: '180px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipes.map(recipe => (
              <tr key={recipe.id}>
                <td>
                  <img src={recipe.image} alt={recipe.title} className="table-recipe-image" />
                </td>
                <td>
                  <strong>{recipe.title}</strong>
                  <p className="recipe-desc">{recipe.description}</p>
                </td>
                <td>
                  {recipe.category.map(cat => (
                    <span key={cat} className="category-badge">{cat}</span>
                  ))}
                </td>
                <td>{recipe.views.toLocaleString()}</td>
                <td>
                  <span className="rating-badge">{recipe.rating}</span>
                </td>
                <td>{recipe.date}</td>
                <td>
                  <div className="table-actions">
                    <Link to={`/recipe/${recipe.id}`} className="btn-view" title="Просмотр">
                      👁️
                    </Link>
                    <Link to={`/admin/recipes/${recipe.id}/edit`} className="btn-edit" title="Редактировать">
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDelete(recipe.id)}
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

      {filteredRecipes.length === 0 && (
        <div className="no-results">
          <p>Рецепты не найдены</p>
        </div>
      )}
    </div>
  );
}

export default AdminRecipes;
