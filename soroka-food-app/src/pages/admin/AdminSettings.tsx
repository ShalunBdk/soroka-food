import { useState, FormEvent } from 'react';
import type { SiteSettings } from '../../types';
import './AdminCommon.css';

function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Soroka',
    siteDescription: 'Домашние рецепты приготовления блюд',
    logo: '',
    socialLinks: {
      youtube: '',
      instagram: '',
      telegram: '',
      tiktok: ''
    },
    seo: {
      metaTitle: 'Soroka - Домашние рецепты',
      metaDescription: 'Удобный поиск рецептов по продуктам, калориям, времени, типу блюда',
      metaKeywords: 'рецепты, кулинария, готовка, блюда'
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Сохранение настроек:', settings);
    alert('Настройки сохранены успешно!');
  };

  return (
    <div className="admin-common">
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h3>Общие настройки</h3>
          <div className="form-group">
            <label>Название сайта *</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание сайта *</label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Логотип (URL)</label>
            <input
              type="text"
              value={settings.logo}
              onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Социальные сети</h3>
          <div className="form-group">
            <label>YouTube</label>
            <input
              type="url"
              value={settings.socialLinks.youtube}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...settings.socialLinks, youtube: e.target.value }
              })}
              placeholder="https://youtube.com/@channel"
            />
          </div>

          <div className="form-group">
            <label>Instagram</label>
            <input
              type="url"
              value={settings.socialLinks.instagram}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...settings.socialLinks, instagram: e.target.value }
              })}
              placeholder="https://instagram.com/username"
            />
          </div>

          <div className="form-group">
            <label>Telegram</label>
            <input
              type="url"
              value={settings.socialLinks.telegram}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...settings.socialLinks, telegram: e.target.value }
              })}
              placeholder="https://t.me/channel"
            />
          </div>

          <div className="form-group">
            <label>TikTok</label>
            <input
              type="url"
              value={settings.socialLinks.tiktok}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...settings.socialLinks, tiktok: e.target.value }
              })}
              placeholder="https://tiktok.com/@username"
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>SEO настройки</h3>
          <div className="form-group">
            <label>Meta Title</label>
            <input
              type="text"
              value={settings.seo.metaTitle}
              onChange={(e) => setSettings({
                ...settings,
                seo: { ...settings.seo, metaTitle: e.target.value }
              })}
              placeholder="Заголовок страницы в поисковиках"
            />
          </div>

          <div className="form-group">
            <label>Meta Description</label>
            <textarea
              value={settings.seo.metaDescription}
              onChange={(e) => setSettings({
                ...settings,
                seo: { ...settings.seo, metaDescription: e.target.value }
              })}
              rows={3}
              placeholder="Описание сайта для поисковиков"
            />
          </div>

          <div className="form-group">
            <label>Meta Keywords</label>
            <input
              type="text"
              value={settings.seo.metaKeywords}
              onChange={(e) => setSettings({
                ...settings,
                seo: { ...settings.seo, metaKeywords: e.target.value }
              })}
              placeholder="Ключевые слова через запятую"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            💾 Сохранить настройки
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;
