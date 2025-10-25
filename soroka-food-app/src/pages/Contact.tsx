import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import api from '../services/api';
import type { StaticPage } from '../types';
import '../styles/StaticPage.css';

const Contact: React.FC = () => {
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbItems = [
    { label: 'Главная', url: '/' },
    { label: 'Контакты' }
  ];

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await api.staticPages.getBySlug('contact');
        setPage(data);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('Не удалось загрузить страницу');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  if (loading) {
    return (
      <>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="static-page-container">
          <div className="static-page-content">
            <p>Загрузка...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !page) {
    return (
      <>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="static-page-container">
          <div className="static-page-content">
            <p>{error || 'Страница не найдена'}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <div className="static-page-container">
        <div className="static-page-content">
          <h1 className="static-page-title">{page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </div>
    </>
  );
};

export default Contact;
