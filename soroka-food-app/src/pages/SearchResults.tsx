import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import Sidebar from '../components/Sidebar/Sidebar';
import RecipeCard from '../components/RecipeCard/RecipeCard';
import Pagination from '../components/Pagination/Pagination';
import Newsletter from '../components/Newsletter/Newsletter';
import SocialLinks from '../components/SocialLinks/SocialLinks';
import SiteStats from '../components/SiteStats/SiteStats';
import { useSidebarData } from '../hooks/useSidebarData';
import { useSettings } from '../contexts/SettingsContext';
import api from '../services/api';
import type { Recipe } from '../types/index';
import '../styles/CategoryPage.css';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [currentPage, setCurrentPage] = useState(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  const recipesPerPage = 9;
  const { sidebarSections } = useSidebarData();

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Главная', url: '/' },
    { label: 'Результаты поиска' }
  ];

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.trim().length === 0) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await api.recipes.search(query, currentPage, recipesPerPage);

        if (response && Array.isArray(response.data)) {
          setRecipes(response.data);
          setTotalPages(response.pagination.totalPages);
        } else {
          setError('Неверный формат данных');
        }
      } catch (err: any) {
        setError('Ошибка при поиске рецептов');
        console.error('Error searching recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage]);

  // Reset to first page when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="main-container">
        <Sidebar sections={sidebarSections} />

        <main className="content">
          <h1 className="page-title">Результаты поиска</h1>
          {query && (
            <p className="page-description">
              Поиск по запросу: <strong>"{query}"</strong>
            </p>
          )}

          {!query && (
            <div className="empty-message">Введите запрос для поиска рецептов</div>
          )}

          {loading && query && (
            <div className="loading-message">Поиск рецептов...</div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!loading && !error && query && recipes.length === 0 && (
            <div className="empty-message">
              По вашему запросу ничего не найдено. Попробуйте изменить запрос.
            </div>
          )}

          {!loading && !error && recipes.length > 0 && (
            <>
              <p className="page-description">
                Найдено рецептов: {recipes.length}
              </p>
              <div className="recipes-grid">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </main>

        <aside className="right-sidebar">
          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Подписка на рассылку</h3>
            <Newsletter />
          </div>

          {settings?.socialLinks && (settings.socialLinks.youtube || settings.socialLinks.instagram || settings.socialLinks.telegram || settings.socialLinks.tiktok) && (
            <div className="right-sidebar-section">
              <h3 className="right-sidebar-title">Мы в соцсетях</h3>
              <SocialLinks
                youtube={settings.socialLinks.youtube}
                instagram={settings.socialLinks.instagram}
                telegram={settings.socialLinks.telegram}
                tiktok={settings.socialLinks.tiktok}
              />
            </div>
          )}

          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Статистика сайта</h3>
            <SiteStats />
          </div>
        </aside>
      </div>
    </>
  );
};

export default SearchResults;
