import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import Sidebar from '../components/Sidebar/Sidebar';
import RecipeCard from '../components/RecipeCard/RecipeCard';
import Pagination from '../components/Pagination/Pagination';
import Newsletter from '../components/Newsletter/Newsletter';
import SocialLinks from '../components/SocialLinks/SocialLinks';
import SiteStats from '../components/SiteStats/SiteStats';
import { useSidebarData } from '../hooks/useSidebarData';
import api from '../services/api';
import type { Recipe } from '../types/index';
import '../styles/CategoryPage.css';

const BestRecipes: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<{
    youtube?: string;
    instagram?: string;
    telegram?: string;
    tiktok?: string;
  }>({});
  const recipesPerPage = 9;
  const { sidebarSections } = useSidebarData();

  const breadcrumbItems = [
    { label: 'Главная', url: '/' },
    { label: 'Лучшие рецепты' }
  ];

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.settings.getPublic();
        if (settings && settings.socialLinks) {
          setSocialLinks(settings.socialLinks);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchSettings();
  }, []);

  // Fetch popular recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use sort=popular to get recipes sorted by views
        const response = await api.recipes.getAll(currentPage, recipesPerPage, 'popular');
        setRecipes(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (err) {
        setError('Не удалось загрузить рецепты');
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [currentPage]);

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />

      <div className="main-container">
        <Sidebar sections={sidebarSections} />

        <main className="content">
          <h1 className="page-title">Лучшие рецепты</h1>
          <p className="page-description">
            Самые популярные рецепты по мнению наших читателей.
            Проверенные временем блюда, которые пользуются наибольшим успехом.
          </p>

          {loading && (
            <div className="loading-message">Загрузка рецептов...</div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!loading && !error && (!recipes || recipes.length === 0) && (
            <div className="empty-message">Рецепты не найдены</div>
          )}

          {!loading && !error && recipes && recipes.length > 0 && (
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
        </main>

        <aside className="right-sidebar">
          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Подписка на рассылку</h3>
            <Newsletter />
          </div>

          {(socialLinks.youtube || socialLinks.instagram || socialLinks.telegram || socialLinks.tiktok) && (
            <div className="right-sidebar-section">
              <h3 className="right-sidebar-title">Мы в соцсетях</h3>
              <SocialLinks
                youtube={socialLinks.youtube}
                instagram={socialLinks.instagram}
                telegram={socialLinks.telegram}
                tiktok={socialLinks.tiktok}
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

export default BestRecipes;
