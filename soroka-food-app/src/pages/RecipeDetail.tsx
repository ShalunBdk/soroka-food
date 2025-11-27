import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import ImageModal from '../components/ImageModal/ImageModal';
import RecipePrintView from '../components/RecipePrintView/RecipePrintView';
import Head from '../components/Head/Head';
import StructuredData from '../components/StructuredData/StructuredData';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { getImageUrl } from '../utils/image';
import { shouldCountView } from '../utils/viewTracker';
import { formatTime } from '../utils/time';
import { useSettings } from '../contexts/SettingsContext';
import { generateRecipeMetaDescription, getFullImageUrl, getCanonicalUrl } from '../utils/seo';
import { generateRecipeSchema, generateBreadcrumbSchema } from '../utils/schema';
import type { RecipeDetail as RecipeDetailType, Comment } from '../types';
import '../styles/RecipeDetail.css';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const recipeId = parseInt(id || '1');
  const { settings } = useSettings();
  const toast = useToast();

  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null);
  const [recipeComments, setRecipeComments] = useState<Comment[]>([]);
  const [commentsPagination, setCommentsPagination] = useState<any>(null);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
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

  // Image modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');

  // Servings adjustment state
  const [currentServings, setCurrentServings] = useState<number>(0);

  // Fetch recipe details and comments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recipeData, commentsResponse, recipesData] = await Promise.all([
          api.recipes.getById(recipeId),
          api.comments.getByRecipeId(recipeId, 1, 20), // First page, 20 comments
          api.recipes.getAll(1, 10) // Get more related recipes
        ]);

        setRecipe(recipeData);
        setCurrentServings(recipeData.servings); // Initialize servings
        setRecipeComments(commentsResponse.data);
        setCommentsPagination(commentsResponse.pagination);
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

  // Load more comments (pagination)
  const loadMoreComments = async () => {
    if (!commentsPagination || !commentsPagination.hasMore) return;

    setLoadingMoreComments(true);
    try {
      const nextPage = commentsPagination.page + 1;
      const response = await api.comments.getByRecipeId(recipeId, nextPage, 20);

      setRecipeComments(prev => [...prev, ...response.data]);
      setCommentsPagination(response.pagination);
    } catch (err) {
      toast.error('Не удалось загрузить комментарии');
      console.error('Error loading more comments:', err);
    } finally {
      setLoadingMoreComments(false);
    }
  };

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

  // Prepare SEO data
  const siteUrl = window.location.origin;
  const siteName = settings?.siteName || 'Soroka Food';

  const metaDescription = recipe
    ? generateRecipeMetaDescription(recipe.description, recipe.cookingTime, recipe.servings)
    : '';

  const fullImageUrl = recipe?.image
    ? getFullImageUrl(getImageUrl(recipe.image), siteUrl)
    : undefined;

  const canonicalUrl = getCanonicalUrl(`/recipe/${recipeId}`, siteUrl);

  // Generate structured data
  const recipeSchema = recipe
    ? generateRecipeSchema(recipe, siteUrl, siteName)
    : null;

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems, siteUrl);

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

  const handlePrint = () => {
    window.print();
  };

  // Image modal handlers
  const handleImageClick = (imageUrl: string, altText: string) => {
    setModalImageUrl(imageUrl);
    setModalImageAlt(altText);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Adjust servings
  const adjustServings = (delta: number) => {
    if (!recipe) return;
    const newServings = Math.max(1, currentServings + delta);
    setCurrentServings(newServings);
  };

  return (
    <>
      {/* SEO Meta Tags */}
      {recipe && (
        <>
          <Head
            title={`${recipe.title} - ${siteName}`}
            description={metaDescription}
            image={fullImageUrl}
            url={canonicalUrl}
            type="article"
            keywords={recipe.tags.join(', ')}
            author={siteName}
            publishedTime={recipe.date}
          />
          {recipeSchema && <StructuredData data={recipeSchema} />}
          <StructuredData data={breadcrumbSchema} />
        </>
      )}

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

          <img
            src={getImageUrl(recipe.image)}
            alt={recipe.title}
            className="recipe-image"
            onClick={() => handleImageClick(getImageUrl(recipe.image), recipe.title)}
            style={{ cursor: 'pointer' }}
            loading="eager"
            decoding="async"
          />

          <div className="recipe-description" dangerouslySetInnerHTML={{ __html: recipe.description }} />

          <div className="share-section">
            <div className="share-content">
              <div className="share-left">
                <div className="share-title">Поделиться рецептом:</div>
                <div className="share-buttons">
                  <button className="share-btn" onClick={handleShareVK}>ВКонтакте</button>
                  <button className="share-btn" onClick={handleShareTelegram}>Telegram</button>
                  <button className="share-btn" onClick={handleShareWhatsApp}>WhatsApp</button>
                  <button className="share-btn" onClick={handleCopyLink}>Копировать ссылку</button>
                  <button className="share-btn print-btn" onClick={handlePrint}>🖨️ Распечатать</button>
                </div>
              </div>
              <div className="share-qr">
                <QRCode
                  value={window.location.href}
                  size={100}
                  level="M"
                />
              </div>
            </div>
          </div>

          <div className="info-box">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Порций</span>
                <div className="servings-controls">
                  <button
                    onClick={() => adjustServings(-1)}
                    className="servings-btn"
                    disabled={currentServings <= 1}
                    title="Уменьшить количество порций"
                  >
                    −
                  </button>
                  <span className="info-value">{currentServings}</span>
                  <button
                    onClick={() => adjustServings(1)}
                    className="servings-btn"
                    title="Увеличить количество порций"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="info-item">
                {recipe.prepTime ? (
                  <>
                    <span className="info-label">Общее время</span>
                    <span className="info-value">{formatTime(recipe.prepTime + recipe.cookingTime)}</span>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.3rem' }}>
                      Подготовка: {formatTime(recipe.prepTime)}<br />
                      Приготовление: {formatTime(recipe.cookingTime)}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="info-label">Время приготовления</span>
                    <span className="info-value">{formatTime(recipe.cookingTime)}</span>
                  </>
                )}
              </div>
              <div className="info-item">
                <span className="info-label">Калорийность (на 100г)</span>
                <span className="info-value">{recipe.calories} ккал</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="section-title">Ингредиенты</h2>
            {(() => {
              // Group ingredients by category
              const grouped = recipe.ingredients.reduce((acc, ingredient) => {
                const category = ingredient.category?.trim() || '';
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(ingredient);
                return acc;
              }, {} as Record<string, typeof recipe.ingredients>);

              // Get categories, putting empty category first
              const categories = Object.keys(grouped).sort((a, b) => {
                if (a === '') return -1;
                if (b === '') return 1;
                return 0;
              });

              return categories.map((category, catIndex) => (
                <div key={catIndex} style={{ marginBottom: category ? '1.5rem' : '0' }}>
                  {category && (
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      marginTop: catIndex > 0 ? '1.5rem' : '0',
                      marginBottom: '0.75rem',
                      color: '#333'
                    }}>
                      {category}
                    </h3>
                  )}
                  <ul className="ingredients-list">
                    {grouped[category].map((ingredient, index) => (
                      <li key={index}>
                        {ingredient.quantity && ingredient.unit && ingredient.unit !== 'по вкусу' ? (
                          <>
                            {ingredient.name} —{' '}
                            {currentServings !== recipe.servings ? (
                              <>
                                {(ingredient.quantity * (currentServings / recipe.servings)).toFixed(1).replace(/\.0$/, '')} {ingredient.unit}
                              </>
                            ) : (
                              `${ingredient.quantity} ${ingredient.unit}`
                            )}
                          </>
                        ) : (
                          `${ingredient.name} — ${ingredient.amount}`
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ));
            })()}
          </div>

          <div>
            <h2 className="section-title">Пошаговое приготовление</h2>
            {recipe.instructions.map((step) => (
              <div key={step.stepNumber} className="instruction-step">
                <div className="step-number">{step.stepNumber}</div>
                <div className="step-text" dangerouslySetInnerHTML={{ __html: step.text }} />
                {step.images && step.images.length > 0 && (
                  <div className="step-images">
                    {step.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(img)}
                        alt={`Шаг ${step.stepNumber} - Изображение ${idx + 1}`}
                        className="step-image"
                        onClick={() => handleImageClick(getImageUrl(img), `Шаг ${step.stepNumber} - Изображение ${idx + 1}`)}
                        loading="lazy"
                        decoding="async"
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

            {/* Load More Comments Button */}
            {commentsPagination && commentsPagination.hasMore && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  onClick={loadMoreComments}
                  disabled={loadingMoreComments}
                  className="submit-btn"
                  style={{ maxWidth: '300px', margin: '0 auto' }}
                >
                  {loadingMoreComments ? 'Загрузка...' : `Загрузить еще (${commentsPagination.total - recipeComments.length})`}
                </button>
              </div>
            )}

            {/* No comments message */}
            {recipeComments.length === 0 && !loading && (
              <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>
                Пока нет комментариев. Будьте первым!
              </p>
            )}
          </div>
        </main>

        <aside className="right-sidebar">
          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Популярные рецепты</h3>
            {relatedRecipes.slice(5, 9).map((relatedRecipe) => (
              <Link key={relatedRecipe.id} to={`/recipe/${relatedRecipe.id}`} className="related-recipe">
                <img
                  src={getImageUrl(relatedRecipe.image)}
                  alt={relatedRecipe.title}
                  className="related-image"
                  loading="lazy"
                  decoding="async"
                />
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

      <ImageModal
        imageUrl={modalImageUrl}
        altText={modalImageAlt}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Print View (hidden on screen, visible when printing) */}
      {recipe && (
        <RecipePrintView recipe={recipe} currentServings={currentServings} />
      )}
    </>
  );
};

export default RecipeDetail;
