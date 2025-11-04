import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { getImageUrl } from '../../utils/image';
import './AdminRecipes.css';

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

function AdminRecipes() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Fetch recipes and categories
  useEffect(() => {
    fetchRecipes();
    fetchCategories();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.admin.recipes.getAll(1, 100);
      setRecipes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Не удалось загрузить рецепты');
      console.error('Error fetching recipes:', err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const filteredRecipes = (recipes || [])
    .filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' ||
        (recipe.categories && recipe.categories.some((c: any) => c.name === categoryFilter));
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'date':
        default:
          return b.id - a.id;
      }
    });

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот рецепт?')) {
      try {
        await api.admin.recipes.delete(id);
        toast.success('Рецепт успешно удален');
        fetchRecipes(); // Refresh the list
      } catch (err) {
        toast.error('Не удалось удалить рецепт');
        console.error('Error deleting recipe:', err);
      }
    }
  };

  if (loading) {
    return <div className="loading-message">Загрузка рецептов...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

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
            {Array.isArray(categories) && categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
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
            {filteredRecipes && filteredRecipes.length > 0 ? (
              filteredRecipes.map(recipe => (
                <tr key={recipe.id}>
                  <td>
                    <img src={getImageUrl(recipe.image)} alt={recipe.title} className="table-recipe-image" />
                  </td>
                  <td>
                    <strong>{recipe.title}</strong>
                    <p className="recipe-desc">{stripHtml(recipe.description)}</p>
                  </td>
                  <td>
                    {Array.isArray(recipe.categories) && recipe.categories.map((cat: any) => (
                      <span key={cat.id || cat.name} className="category-badge">{cat.name}</span>
                    ))}
                    {(!recipe.categories || recipe.categories.length === 0) && (
                      <span className="category-badge">Без категории</span>
                    )}
                  </td>
                  <td>{(recipe.views || 0).toLocaleString()}</td>
                  <td>
                    <span className="rating-badge">{recipe.rating || 0}</span>
                  </td>
                  <td>{recipe.date || 'N/A'}</td>
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
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'Загрузка...' : 'Рецепты не найдены'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminRecipes;
