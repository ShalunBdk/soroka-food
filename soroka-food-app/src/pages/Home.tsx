import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import Sidebar from '../components/Sidebar/Sidebar';
import RecipeCard from '../components/RecipeCard/RecipeCard';
import Pagination from '../components/Pagination/Pagination';
import Newsletter from '../components/Newsletter/Newsletter';
import SocialLinks from '../components/SocialLinks/SocialLinks';
import SiteStats from '../components/SiteStats/SiteStats';
import Head from '../components/Head/Head';
import StructuredData from '../components/StructuredData/StructuredData';
import { useSidebarData } from '../hooks/useSidebarData';
import { useSettings } from '../contexts/SettingsContext';
import { getCanonicalUrl } from '../utils/seo';
import { generateWebSiteSchema, generateOrganizationSchema, generateBreadcrumbSchema } from '../utils/schema';
import api from '../services/api';
import type { Recipe } from '../types/index';
import '../styles/Home.css';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  const recipesPerPage = 9;
  const { sidebarSections } = useSidebarData();

  const breadcrumbItems = [
    { label: 'Главная', url: '/' },
    { label: 'Домашние рецепты приготовления блюд' }
  ];

  // Fetch recipes from API
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Map activeTab to sort parameter
        let sortParam: string | undefined;
        if (activeTab === 'new') {
          sortParam = 'newest';
        } else if (activeTab === 'popular') {
          sortParam = 'popular';
        } else if (activeTab === 'photo') {
          sortParam = 'photo';
        }

        const response = await api.recipes.getAll(currentPage, recipesPerPage, sortParam);

        // Handle null or invalid response
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response from server');
        }

        setRecipes(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err) {
        setError('Не удалось загрузить рецепты');
        console.error('Error fetching recipes:', err);
        setRecipes([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [currentPage, activeTab]);

  // SEO data
  const siteUrl = window.location.origin;
  const siteName = settings?.siteName || 'Soroka Food';
  const siteDescription = settings?.siteDescription ||
    'Удобный поиск рецептов по продуктам, калориям, времени, типу блюда. Свои кулинарные изыскания, пошаговые инструкции, фото готовых блюд.';
  const canonicalUrl = getCanonicalUrl('/', siteUrl);

  // Generate structured data
  const websiteSchema = generateWebSiteSchema(siteName, siteUrl, siteDescription);
  const organizationSchema = generateOrganizationSchema(
    siteName,
    siteUrl,
    settings?.logo || '/logo_1.png',
    settings?.socialLinks
  );
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems, siteUrl);

  return (
    <>
      {/* SEO Meta Tags */}
      <Head
        title={`${siteName} - Домашние рецепты приготовления блюд`}
        description={siteDescription}
        url={canonicalUrl}
        type="website"
        keywords="рецепты, домашние рецепты, кулинария, готовка, блюда, еда"
      />
      <StructuredData data={websiteSchema} />
      <StructuredData data={organizationSchema} />
      <StructuredData data={breadcrumbSchema} />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="main-container">
        <Sidebar sections={sidebarSections} />

        <main className="content">
          <h1 className="page-title">Домашние рецепты приготовления блюд</h1>
          <p className="page-description">
            Удобный поиск рецептов по продуктам, калориям, времени, типу блюда.
            Свои кулинарные изыскания, пошаговые инструкции, фото готовых блюд.
          </p>

          <div className="category-tabs">
            <button
              className={`category-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1); // Reset to first page
              }}
            >
              Все рецепты
            </button>
            <button
              className={`category-tab ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('new');
                setCurrentPage(1);
              }}
            >
              Новые рецепты
            </button>
            <button
              className={`category-tab ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('popular');
                setCurrentPage(1);
              }}
            >
              Популярные
            </button>
            <button
              className={`category-tab ${activeTab === 'photo' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('photo');
                setCurrentPage(1);
              }}
            >
              С фото
            </button>
          </div>

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
            <div className="recipes-grid">
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  priority={index === 0}
                />
              ))}
            </div>
          )}

          {!loading && recipes && recipes.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </main>

        <aside className="right-sidebar">
          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Подписка на рассылку</h3>
            <Newsletter />
          </div>

          {/* Показываем блок только если есть хотя бы одна ссылка */}
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

export default Home;
