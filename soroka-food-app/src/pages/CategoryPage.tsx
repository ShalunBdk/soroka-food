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
import api from '../services/api';
import type { Recipe } from '../types/index';
import '../styles/CategoryPage.css';

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [category, setCategory] = useState<CategoryInfo | null>(null);
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

  // Breadcrumbs
  const breadcrumbItems = category
    ? [
        { label: 'Главная', url: '/' },
        { label: category.name }
      ]
    : [{ label: 'Главная', url: '/' }];

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

  // Fetch recipes by category
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);
      try {
        const response = await api.recipes.getByCategory(slug, currentPage, recipesPerPage);

        // Check if response has the expected structure
        if (response && Array.isArray(response.recipes)) {
          setRecipes(response.recipes);
          setCategory(response.category);
          setTotalPages(response.pagination.totalPages);
        } else if (response && Array.isArray(response.data)) {
          // Fallback to old format if needed
          setRecipes(response.data);
          setTotalPages(response.pagination?.totalPages || 1);
        } else {
          setError('Неверный формат данных');
        }
      } catch (err: any) {
        if (err.status === 404) {
          setError('Категория не найдена');
        } else {
          setError('Не удалось загрузить рецепты');
        }
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [slug, currentPage]);

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

          {!loading && !error && category && (
            <>
              <h1 className="page-title">{category.name}</h1>
              {category.description && (
                <p className="page-description">{category.description}</p>
              )}

              {recipes && recipes.length === 0 && (
                <div className="empty-message">В этой категории пока нет рецептов</div>
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

export default CategoryPage;
