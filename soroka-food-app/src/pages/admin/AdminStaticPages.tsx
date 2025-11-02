import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import type { StaticPage } from '../../types';
import './AdminCommon.css';

function AdminStaticPages() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<StaticPage | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.staticPages.getAll();
      setPages(data);
    } catch (err) {
      setError('Не удалось загрузить статические страницы');
      console.error('Error fetching static pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = (page: StaticPage) => {
    setSelectedPage(page);
    setEditedTitle(page.title);
    setEditedContent(page.content);
  };

  const handleSave = async () => {
    if (!selectedPage) return;

    if (!editedTitle.trim() || !editedContent.trim()) {
      toast.warning('Пожалуйста, заполните название и содержание');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.admin.staticPages.update(selectedPage.id, {
        title: editedTitle,
        content: editedContent
      });

      // Update in local state
      setPages(pages.map(p => p.id === updated.id ? updated : p));
      setSelectedPage(updated);
      toast.success('Страница успешно сохранена!');
    } catch (err) {
      toast.error('Не удалось сохранить страницу');
      console.error('Error saving page:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedPage) {
      setEditedTitle(selectedPage.title);
      setEditedContent(selectedPage.content);
    }
  };

  const getPageNameBySlug = (slug: string): string => {
    const names: Record<string, string> = {
      'about': 'О сайте',
      'contact': 'Контакты',
      'rules': 'Правила',
      'advertising': 'Реклама'
    };
    return names[slug] || slug;
  };

  if (loading) {
    return <div className="loading-message">Загрузка страниц...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-common">
      <div className="static-pages-container">
        <div className="pages-sidebar">
          <h3>Статические страницы</h3>
          <ul className="pages-list">
            {pages.map((page) => (
              <li
                key={page.id}
                className={selectedPage?.id === page.id ? 'active' : ''}
                onClick={() => handleSelectPage(page)}
              >
                <strong>{getPageNameBySlug(page.slug)}</strong>
                <small>/{page.slug}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="page-editor">
          {selectedPage ? (
            <>
              <div className="editor-header">
                <h2>Редактирование: {getPageNameBySlug(selectedPage.slug)}</h2>
                <div className="editor-actions">
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    Отменить
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Заголовок страницы *</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Введите заголовок страницы"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Содержание (HTML) *</label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={20}
                  placeholder="Введите содержание страницы (поддерживается HTML)"
                  className="form-control content-editor"
                />
              </div>

              <div className="editor-help">
                <h4>Подсказка:</h4>
                <p>Вы можете использовать HTML-теги для форматирования текста:</p>
                <ul>
                  <li><code>&lt;h2&gt;Заголовок&lt;/h2&gt;</code> - для заголовков</li>
                  <li><code>&lt;p&gt;Текст&lt;/p&gt;</code> - для абзацев</li>
                  <li><code>&lt;ul&gt;&lt;li&gt;Пункт&lt;/li&gt;&lt;/ul&gt;</code> - для списков</li>
                  <li><code>&lt;a href="url"&gt;Ссылка&lt;/a&gt;</code> - для ссылок</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Выберите страницу для редактирования</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminStaticPages;
