import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

interface CuisineInfo {
  type: string;
  name: string;
}

const CuisinePage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cuisine, setCuisine] = useState<CuisineInfo | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  const recipesPerPage = 9;
  const { sidebarSections } = useSidebarData();

  // Breadcrumbs
  const breadcrumbItems = cuisine
    ? [
        { label: 'Главная', url: '/' },
        { label: cuisine.name }
      ]
    : [{ label: 'Главная', url: '/' }];

  // Fetch recipes by cuisine
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!type) return;

      setLoading(true);
      setError(null);
      try {
        const response = await api.recipes.getByCuisine(type, currentPage, recipesPerPage);

        // Check if response has the expected structure
        if (response && Array.isArray(response.recipes)) {
          setRecipes(response.recipes);
          setCuisine(response.cuisine);
          setTotalPages(response.pagination.totalPages);
        } else {
          setError('Неверный формат данных');
        }
      } catch (err: any) {
        if (err.status === 404) {
          setError('Тип кухни не найден');
        } else {
          setError('Не удалось загрузить рецепты');
        }
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [type, currentPage]);

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="main-container">
        <Sidebar sections={sidebarSections} />

        <main className="content">
          {loading && (
            <div className="loading-message">Загрузка рецептов...</div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!loading && !error && cuisine && (
            <>
              <h1 className="page-title">{cuisine.name}</h1>
              <p className="page-description">
                Вкусные и проверенные рецепты блюд {cuisine.name.toLowerCase()}.
                Традиционные и современные блюда с пошаговыми инструкциями.
              </p>

              {recipes && recipes.length === 0 && (
                <div className="empty-message">Рецепты этого типа кухни пока отсутствуют</div>
              )}

              {recipes && recipes.length > 0 && (
                <>
                  <div className="recipes-grid">
                    {recipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
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

export default CuisinePage;
