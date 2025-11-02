import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { getImageUrl } from '../utils/image';
import { shouldCountView } from '../utils/viewTracker';
import { useSettings } from '../contexts/SettingsContext';
import type { RecipeDetail as RecipeDetailType, Comment } from '../types';
import '../styles/RecipeDetail.css';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const recipeId = parseInt(id || '1');
  const { settings } = useSettings();
  const toast = useToast();

  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null);
  const [recipeComments, setRecipeComments] = useState<Comment[]>([]);
  const [relatedRecipes, setRelatedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentWebsite, setCommentWebsite] = useState(''); // Honeypot field
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch recipe details and comments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recipeData, commentsData, recipesData] = await Promise.all([
          api.recipes.getById(recipeId),
          api.comments.getByRecipeId(recipeId),
          api.recipes.getAll(1, 10) // Get more related recipes
        ]);

        setRecipe(recipeData);
        setRecipeComments(commentsData);
        setRelatedRecipes(recipesData.data.filter((r: any) => r.id !== recipeId));
      } catch (err) {
        setError('Не удалось загрузить рецепт');
        console.error('Error fetching recipe:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recipeId]);

  // Update document title when recipe is loaded
  useEffect(() => {
    const originalTitle = document.title;

    if (recipe?.title && settings) {
      const siteName = settings.siteName || 'Soroka Food';
      document.title = `${recipe.title} - ${siteName}`;
    }

    // Restore original title when component unmounts
    return () => {
      document.title = originalTitle;
    };
  }, [recipe, settings]);

  // Track view count (only once per 24 hours per user)
  useEffect(() => {
    if (recipe && shouldCountView(recipeId)) {
      // Increment view count on backend
      api.recipes.incrementView(recipeId).catch(err => {
        console.error('Failed to increment view count:', err);
      });
    }
  }, [recipe, recipeId]);

  if (loading) {
    return <div className="loading-message">Загрузка рецепта...</div>;
  }

  if (error || !recipe) {
    return <div className="error-message">{error || 'Рецепт не найден'}</div>;
  }

  const breadcrumbItems = [
    { label: 'Главная', url: '/' },
    { label: 'Рецепты', url: '/' },
    { label: recipe.title }
  ];

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!commentAuthor.trim()) {
      toast.warning('Пожалуйста, введите ваше имя');
      return;
    }

    if (commentAuthor.trim().length < 2) {
      toast.warning('Имя должно содержать минимум 2 символа');
      return;
    }

    if (!commentEmail.trim()) {
      toast.warning('Пожалуйста, введите ваш email');
      return;
    }

    if (!commentText.trim()) {
      toast.warning('Пожалуйста, введите текст комментария');
      return;
    }

    if (commentText.trim().length < 10) {
      toast.warning('Комментарий должен содержать минимум 10 символов');
      return;
    }

    if (rating === 0) {
      toast.warning('Пожалуйста, поставьте оценку');
      return;
    }

    setSubmittingComment(true);
    try {
      await api.comments.create({
        recipeId,
        author: commentAuthor.trim(),
        email: commentEmail.trim(),
        rating,
        text: commentText.trim(),
        website: commentWebsite // Honeypot field
      });

      toast.success('Спасибо за ваш комментарий! Он появится после модерации.');

      // Reset form
      setCommentAuthor('');
      setCommentEmail('');
      setCommentText('');
      setCommentWebsite('');
      setRating(0);
    } catch (err: any) {
      // Show detailed validation errors if available
      if (err.data && err.data.errors && Array.isArray(err.data.errors)) {
        const errorMessages = err.data.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
        toast.error(`Ошибка валидации:\n${errorMessages}`);
      } else {
        toast.error(err.message || 'Не удалось отправить комментарий. Попробуйте позже.');
      }
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Share handlers
  const handleShareVK = () => {
    const url = window.location.href;
    const title = recipe?.title || '';
    const shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleShareTelegram = () => {
    const url = window.location.href;
    const text = recipe?.title || '';
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `${recipe?.title || ''} - ${url}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована в буфер обмена!');
    } catch (err) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Ссылка скопирована в буфер обмена!');
      } catch (err) {
        toast.error('Не удалось скопировать ссылку');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="main-container">
        <aside className="sidebar">
          <h3 className="sidebar-title">Похожие рецепты</h3>
          <ul className="sidebar-list">
            {relatedRecipes.slice(0, 5).map((relatedRecipe) => (
              <li key={relatedRecipe.id}>
                <Link to={`/recipe/${relatedRecipe.id}`}>{relatedRecipe.title}</Link>
              </li>
            ))}
            {relatedRecipes.length === 0 && (
              <li style={{ color: '#999' }}>Нет похожих рецептов</li>
            )}
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

          <img src={getImageUrl(recipe.image)} alt={recipe.title} className="recipe-image" />

          <p className="recipe-description">{recipe.description}</p>

          <div className="share-section">
            <div className="share-title">Поделиться рецептом:</div>
            <div className="share-buttons">
              <button className="share-btn" onClick={handleShareVK}>ВКонтакте</button>
              <button className="share-btn" onClick={handleShareTelegram}>Telegram</button>
              <button className="share-btn" onClick={handleShareWhatsApp}>WhatsApp</button>
              <button className="share-btn" onClick={handleCopyLink}>Копировать ссылку</button>
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

          <div>
            <h2 className="section-title">Пошаговое приготовление</h2>
            {recipe.instructions.map((step) => (
              <div key={step.stepNumber} className="instruction-step">
                <div className="step-number">{step.stepNumber}</div>
                <p className="step-text">{step.text}</p>
                {step.images && step.images.length > 0 && (
                  <div className="step-images">
                    {step.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(img)}
                        alt={`Шаг ${step.stepNumber} - Изображение ${idx + 1}`}
                        className="step-image"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div>
            <h2 className="section-title">Пищевая ценность на 100 г</h2>
            <ul className="nutrition-list">
              <li>Калорийность: ~{recipe.nutrition.calories} ккал</li>
              <li>Белки: {recipe.nutrition.protein} г</li>
              <li>Жиры: {recipe.nutrition.fat} г</li>
              <li>Углеводы: {recipe.nutrition.carbs} г</li>
            </ul>
          </div>

          {recipe.tips && recipe.tips.length > 0 && (
            <div className="notes-box">
              <div className="notes-title">Полезные советы</div>
              {recipe.tips.map((tip, index) => (
                <div key={index} className="note-item">{tip}</div>
              ))}
            </div>
          )}

          <div className="comments-section">
            <div className="comments-header">
              <h2 className="comments-count">Комментарии ({recipeComments.length})</h2>
            </div>

            <div className="comment-form">
              <h3 className="form-title">Оставить комментарий</h3>
              <form onSubmit={handleCommentSubmit}>
                <div className="form-group">
                  <label className="form-label">Ваше имя</label>
                  <input
                    type="text"
                    className="form-input"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    required
                  />
                </div>
                {/* Honeypot field - hidden from users, visible to bots */}
                <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                  <label>Website</label>
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={commentWebsite}
                    onChange={(e) => setCommentWebsite(e.target.value)}
                  />
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
                  <textarea
                    className="form-input form-textarea"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="submit-btn" disabled={submittingComment}>
                  {submittingComment ? 'Отправка...' : 'Отправить'}
                </button>
              </form>
            </div>

            {Array.isArray(recipeComments) && recipeComments.map((comment) => (
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
            {relatedRecipes.slice(5, 9).map((relatedRecipe) => (
              <Link key={relatedRecipe.id} to={`/recipe/${relatedRecipe.id}`} className="related-recipe">
                <img src={getImageUrl(relatedRecipe.image)} alt={relatedRecipe.title} className="related-image" />
                <div className="related-info">
                  <div className="related-title">{relatedRecipe.title}</div>
                  <div className="related-meta">
                    {relatedRecipe.cookingTime} мин • {relatedRecipe.calories} ккал
                  </div>
                </div>
              </Link>
            ))}
            {relatedRecipes.length <= 5 && (
              <p style={{ color: '#999', fontSize: '0.9rem', padding: '1rem' }}>Недостаточно рецептов для отображения</p>
            )}
          </div>

          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Теги рецепта</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {recipe.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/search?q=${encodeURIComponent(tag)}`}
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
