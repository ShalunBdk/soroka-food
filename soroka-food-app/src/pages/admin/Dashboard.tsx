import { Link } from 'react-router-dom';
import { recipes } from '../../data/recipes';
import { comments } from '../../data/recipes';
import type { AdminStats } from '../../types';
import './Dashboard.css';

function Dashboard() {
  // Подсчет статистики
  const stats: AdminStats = {
    totalRecipes: recipes.length,
    publishedRecipes: recipes.length, // Все опубликованы пока
    draftRecipes: 0,
    totalComments: Object.values(comments).flat().length,
    pendingComments: 0,
    totalSubscribers: 245, // Моковые данные
    viewsLast7Days: 12450,
    viewsLast30Days: 54230
  };

  const recentRecipes = recipes.slice(0, 5);
  const recentComments = Object.entries(comments).flatMap(([recipeId, cmts]) =>
    cmts.map(comment => ({
      ...comment,
      recipeId: Number(recipeId),
      recipeName: recipes.find(r => r.id === Number(recipeId))?.title || ''
    }))
  ).slice(0, 5);

  const topRecipes = [...recipes]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

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
            {recentRecipes.map(recipe => (
              <div key={recipe.id} className="recipe-item">
                <img src={recipe.image} alt={recipe.title} className="recipe-thumb" />
                <div className="recipe-item-info">
                  <h4>{recipe.title}</h4>
                  <p className="recipe-meta">
                    {recipe.views} просмотров • {recipe.date}
                  </p>
                </div>
                <Link to={`/admin/recipes/${recipe.id}/edit`} className="edit-link">
                  Редактировать
                </Link>
              </div>
            ))}
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
            {recentComments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <strong>{comment.author}</strong>
                  <span className="comment-date">{comment.date}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
                <Link to={`/recipe/${comment.recipeId}`} className="comment-recipe">
                  {comment.recipeName}
                </Link>
              </div>
            ))}
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
