import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import { recipeDetails, comments, recipes } from '../data/recipes';
import '../styles/RecipeDetail.css';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const recipeId = parseInt(id || '1');
  const recipe = recipeDetails[recipeId];
  const recipeComments = comments[recipeId] || [];

  const [activeTab, setActiveTab] = useState('ingredients');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  if (!recipe) {
    return <div>Рецепт не найден</div>;
  }

  const breadcrumbItems = [
    { label: 'Главная', url: '/' },
    { label: 'Рецепты', url: '/' },
    { label: recipe.title }
  ];

  const relatedRecipes = recipes.filter(r => r.id !== recipeId).slice(0, 4);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Пожалуйста, поставьте оценку');
      return;
    }
    alert('Спасибо за ваш комментарий!');
    setRating(0);
  };

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="main-container">
        <aside className="sidebar">
          <h3 className="sidebar-title">Похожие рецепты</h3>
          <ul className="sidebar-list">
            <li><Link to="#">Голубцы классические</Link></li>
            <li><Link to="#">Капуста тушеная с сосисками</Link></li>
            <li><Link to="#">Щи из свежей капусты</Link></li>
            <li><Link to="#">Котлеты из фарша</Link></li>
            <li><Link to="#">Капустные оладьи</Link></li>
          </ul>
        </aside>

        <main className="content">
          <h1 className="recipe-title">{recipe.title}</h1>

          <div className="recipe-meta">
            <span>Автор: {recipe.author}</span>
            <span>Дата: {recipe.date}</span>
            <span>Просмотров: {recipe.views.toLocaleString()}</span>
            <span>Рейтинг: {'★'.repeat(Math.round(recipe.rating))} ({recipe.rating})</span>
          </div>

          <img src={recipe.image} alt={recipe.title} className="recipe-image" />

          <p className="recipe-description">{recipe.description}</p>

          <div className="share-section">
            <div className="share-title">Поделиться рецептом:</div>
            <div className="share-buttons">
              <button className="share-btn">ВКонтакте</button>
              <button className="share-btn">Telegram</button>
              <button className="share-btn">WhatsApp</button>
              <button className="share-btn">Копировать ссылку</button>
            </div>
          </div>

          <div className="info-box">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Порций</span>
                <span className="info-value">{recipe.servings}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Время приготовления</span>
                <span className="info-value">{recipe.cookingTime} мин</span>
              </div>
              <div className="info-item">
                <span className="info-label">Калорийность</span>
                <span className="info-value">{recipe.calories} ккал</span>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => setActiveTab('ingredients')}
            >
              Ингредиенты
            </button>
            <button
              className={`tab ${activeTab === 'instructions' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructions')}
            >
              Приготовление
            </button>
            <button
              className={`tab ${activeTab === 'nutrition' ? 'active' : ''}`}
              onClick={() => setActiveTab('nutrition')}
            >
              Пищевая ценность
            </button>
          </div>

          {activeTab === 'ingredients' && (
            <div>
              <h2 className="section-title">Ингредиенты</h2>
              <ul className="ingredients-list">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>
                    {ingredient.amount} {ingredient.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div>
              <h2 className="section-title">Пошаговое приготовление</h2>
              {recipe.instructions.map((step) => (
                <div key={step.stepNumber} className="instruction-step">
                  <div className="step-number">{step.stepNumber}</div>
                  <p className="step-text">{step.text}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div>
              <h2 className="section-title">Пищевая ценность на 100 г</h2>
              <ul className="nutrition-list">
                <li>Калорийность: ~{recipe.nutrition.calories} ккал</li>
                <li>Белки: {recipe.nutrition.protein} г</li>
                <li>Жиры: {recipe.nutrition.fat} г</li>
                <li>Углеводы: {recipe.nutrition.carbs} г</li>
              </ul>
            </div>
          )}

          <div className="notes-box">
            <div className="notes-title">Полезные советы</div>
            {recipe.tips.map((tip, index) => (
              <div key={index} className="note-item">{tip}</div>
            ))}
          </div>

          <div className="comments-section">
            <div className="comments-header">
              <h2 className="comments-count">Комментарии ({recipeComments.length})</h2>
            </div>

            <div className="comment-form">
              <h3 className="form-title">Оставить комментарий</h3>
              <form onSubmit={handleCommentSubmit}>
                <div className="form-group">
                  <label className="form-label">Ваше имя</label>
                  <input type="text" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Ваша оценка</label>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Комментарий</label>
                  <textarea className="form-input form-textarea" required></textarea>
                </div>
                <button type="submit" className="submit-btn">Отправить</button>
              </form>
            </div>

            {recipeComments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <div>
                    <div className="comment-author">{comment.author}</div>
                    <div className="comment-date">{comment.date}</div>
                  </div>
                  <div className="comment-rating">{'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}</div>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))}
          </div>
        </main>

        <aside className="right-sidebar">
          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Популярные рецепты</h3>
            {relatedRecipes.map((relatedRecipe) => (
              <Link key={relatedRecipe.id} to={`/recipe/${relatedRecipe.id}`} className="related-recipe">
                <img src={relatedRecipe.image} alt={relatedRecipe.title} className="related-image" />
                <div className="related-info">
                  <div className="related-title">{relatedRecipe.title}</div>
                  <div className="related-meta">
                    {relatedRecipe.cookingTime} мин • {relatedRecipe.calories} ккал
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Теги рецепта</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {recipe.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/tag/${tag}`}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    textDecoration: 'none',
                    color: '#555',
                    fontSize: '0.9rem'
                  }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default RecipeDetail;
