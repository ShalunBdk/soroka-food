import React, { useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import Sidebar from '../components/Sidebar/Sidebar';
import RecipeCard from '../components/RecipeCard/RecipeCard';
import Pagination from '../components/Pagination/Pagination';
import Newsletter from '../components/Newsletter/Newsletter';
import SocialLinks from '../components/SocialLinks/SocialLinks';
import { recipes } from '../data/recipes';
import type { SidebarSection } from '../types/index';
import '../styles/Home.css';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 9;

  const sidebarSections: SidebarSection[] = [
    {
      title: 'Популярно сейчас',
      links: [
        { title: 'Салаты', url: '/category/salads' },
        { title: 'Супы', url: '/category/soups' },
        { title: 'Вторые блюда', url: '/category/main' },
        { title: 'Выпечка', url: '/category/baking' },
        { title: 'Десерты', url: '/category/desserts' }
      ]
    },
    {
      title: 'Категории блюд',
      links: [
        { title: 'Завтраки', url: '/category/breakfast' },
        { title: 'Обеды', url: '/category/lunch' },
        { title: 'Ужины', url: '/category/dinner' },
        { title: 'Закуски', url: '/category/snacks' },
        { title: 'Напитки', url: '/category/drinks' },
        { title: 'Заготовки', url: '/category/preserves' },
        { title: 'Соусы', url: '/category/sauces' }
      ]
    },
    {
      title: 'По типу кухни',
      links: [
        { title: 'Русская кухня', url: '/cuisine/russian' },
        { title: 'Европейская', url: '/cuisine/european' },
        { title: 'Азиатская', url: '/cuisine/asian' },
        { title: 'Восточная', url: '/cuisine/eastern' }
      ]
    }
  ];

  const breadcrumbItems = [
    { label: 'Главная', url: '/' },
    { label: 'Домашние рецепты приготовления блюд' }
  ];

  const totalPages = Math.ceil(recipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const currentRecipes = recipes.slice(startIndex, startIndex + recipesPerPage);

  return (
    <>
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
              onClick={() => setActiveTab('all')}
            >
              Все рецепты
            </button>
            <button
              className={`category-tab ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => setActiveTab('new')}
            >
              Новые рецепты
            </button>
            <button
              className={`category-tab ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              Популярные
            </button>
            <button
              className={`category-tab ${activeTab === 'photo' ? 'active' : ''}`}
              onClick={() => setActiveTab('photo')}
            >
              С фото
            </button>
          </div>

          <div className="recipes-grid">
            {currentRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </main>

        <aside className="right-sidebar">
          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Подписка на рассылку</h3>
            <Newsletter />
          </div>

          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Мы в соцсетях</h3>
            <SocialLinks />
          </div>

          <div className="right-sidebar-section">
            <h3 className="right-sidebar-title">Статистика сайта</h3>
            <div className="stats-box">
              <div className="stats-item">
                <span className="stats-number">2,450</span>
                <span className="stats-label">рецептов</span>
              </div>
              <div className="stats-item">
                <span className="stats-number">5,830</span>
                <span className="stats-label">пользователей</span>
              </div>
              <div className="stats-item">
                <span className="stats-number">12,400</span>
                <span className="stats-label">комментариев</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Home;
