import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getImageUrl } from '../../utils/image';
import type { AdminStats } from '../../types';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboardData = await api.admin.getStats();

        // getDashboardStats returns { stats: {...}, recentRecipes: [...] }
        setStats(dashboardData.stats || dashboardData);
        setRecentRecipes(dashboardData.recentRecipes || []);
      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-message">Загрузка...</div>;
  }

  if (error || !stats) {
    return <div className="error-message">{error || 'Ошибка загрузки данных'}</div>;
  }

  const topRecipes = Array.isArray(recentRecipes)
    ? [...recentRecipes].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
    : [];

  return (
    <div className="dashboard">
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Всего рецептов</h3>
            <p className="stat-number">{stats.totalRecipes}</p>
            <span className="stat-detail">
              {stats.publishedRecipes} опубликовано / {stats.draftRecipes} черновиков
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>Комментарии</h3>
            <p className="stat-number">{stats.totalComments}</p>
            <span className="stat-detail">
              {stats.pendingComments} на модерации
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✉️</div>
          <div className="stat-content">
            <h3>Подписчики</h3>
            <p className="stat-number">{stats.totalSubscribers}</p>
            <span className="stat-detail">Активных подписок</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>Просмотры</h3>
            <p className="stat-number">{stats.viewsLast7Days.toLocaleString()}</p>
            <span className="stat-detail">За последние 7 дней</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Последние рецепты</h2>
            <Link to="/admin/recipes" className="section-link">Все рецепты →</Link>
          </div>
          <div className="recipes-list">
            {recentRecipes && recentRecipes.length > 0 ? (
              recentRecipes.map(recipe => (
                <div key={recipe.id} className="recipe-item">
                  <img src={getImageUrl(recipe.image)} alt={recipe.title} className="recipe-thumb" />
                  <div className="recipe-item-info">
                    <h4>{recipe.title}</h4>
                    <p className="recipe-meta">
                      {recipe.views || 0} просмотров • {recipe.date || new Date(recipe.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to={`/admin/recipes/${recipe.id}/edit`} className="edit-link">
                    Редактировать
                  </Link>
                </div>
              ))
            ) : (
              <p>Нет рецептов</p>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Популярные рецепты</h2>
          </div>
          <div className="top-recipes-list">
            {topRecipes.map((recipe, index) => (
              <div key={recipe.id} className="top-recipe-item">
                <span className="recipe-rank">#{index + 1}</span>
                <div className="top-recipe-info">
                  <h4>{recipe.title}</h4>
                  <p>{recipe.views.toLocaleString()} просмотров</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Последние комментарии</h2>
            <Link to="/admin/comments" className="section-link">Все комментарии →</Link>
          </div>
          <div className="comments-list">
            <p style={{ padding: '1rem', color: '#666' }}>
              Комментарии отображаются на странице "Комментарии"
            </p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Быстрые действия</h2>
        <div className="actions-grid">
          <Link to="/admin/recipes/new" className="action-card">
            <span className="action-icon">➕</span>
            <span>Добавить рецепт</span>
          </Link>
          <Link to="/admin/categories" className="action-card">
            <span className="action-icon">🗂️</span>
            <span>Управление категориями</span>
          </Link>
          <Link to="/admin/newsletter" className="action-card">
            <span className="action-icon">✉️</span>
            <span>Подписчики рассылки</span>
          </Link>
          <Link to="/admin/settings" className="action-card">
            <span className="action-icon">⚙️</span>
            <span>Настройки сайта</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
