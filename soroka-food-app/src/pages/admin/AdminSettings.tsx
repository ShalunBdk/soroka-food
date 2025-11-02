import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { getImageUrl } from '../../utils/image';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.settings.get();
      if (data) {
        // Ensure nested objects exist
        setSettings({
          siteName: data.siteName || '',
          siteDescription: data.siteDescription || '',
          logo: data.logo || '',
          socialLinks: {
            youtube: data.socialLinks?.youtube || '',
            instagram: data.socialLinks?.instagram || '',
            telegram: data.socialLinks?.telegram || '',
            tiktok: data.socialLinks?.tiktok || ''
          },
          seo: {
            metaTitle: data.seo?.metaTitle || '',
            metaDescription: data.seo?.metaDescription || '',
            metaKeywords: data.seo?.metaKeywords || ''
          }
        });
      }
    } catch (err) {
      setError('Не удалось загрузить настройки');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Пожалуйста, выберите изображение');
      return;
    }

    setUploading(true);
    try {
      const result = await api.upload.recipeImage(file);
      setSettings({ ...settings, logo: result.url });
      toast.success('Логотип успешно загружен!');
    } catch (err) {
      console.error('Error uploading logo:', err);
      toast.error('Не удалось загрузить логотип');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Prevent saving while loading to avoid overwriting with initial state
    if (loading) {
      toast.info('Подождите, настройки загружаются...');
      return;
    }

    setSaving(true);
    try {
      await api.admin.settings.update(settings);
      toast.success('Настройки сохранены успешно!');
    } catch (err) {
      toast.error('Не удалось сохранить настройки');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-message">Загрузка настроек...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

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
            <label>Логотип</label>
            <div className="file-upload-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="file-input"
              />
              <span className="file-hint">
                {uploading ? 'Загрузка...' : 'Выберите изображение логотипа'}
              </span>
            </div>
            {settings.logo && (
              <div className="logo-preview">
                <img src={getImageUrl(settings.logo)} alt="Logo Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, logo: '' })}
                  className="btn-remove"
                  style={{ marginTop: '10px' }}
                >
                  Удалить логотип
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h3>Социальные сети</h3>
          <div className="form-group">
            <label>YouTube</label>
            <input
              type="url"
              value={settings.socialLinks?.youtube || ''}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...(settings.socialLinks || {}), youtube: e.target.value }
              })}
              placeholder="https://youtube.com/@channel"
            />
          </div>

          <div className="form-group">
            <label>Instagram</label>
            <input
              type="url"
              value={settings.socialLinks?.instagram || ''}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...(settings.socialLinks || {}), instagram: e.target.value }
              })}
              placeholder="https://instagram.com/username"
            />
          </div>

          <div className="form-group">
            <label>Telegram</label>
            <input
              type="url"
              value={settings.socialLinks?.telegram || ''}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...(settings.socialLinks || {}), telegram: e.target.value }
              })}
              placeholder="https://t.me/channel"
            />
          </div>

          <div className="form-group">
            <label>TikTok</label>
            <input
              type="url"
              value={settings.socialLinks?.tiktok || ''}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...(settings.socialLinks || {}), tiktok: e.target.value }
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
              value={settings.seo?.metaTitle || ''}
              onChange={(e) => setSettings({
                ...settings,
                seo: { ...(settings.seo || {}), metaTitle: e.target.value }
              })}
              placeholder="Заголовок страницы в поисковиках"
            />
          </div>

          <div className="form-group">
            <label>Meta Description</label>
            <textarea
              value={settings.seo?.metaDescription || ''}
              onChange={(e) => setSettings({
                ...settings,
                seo: { ...(settings.seo || {}), metaDescription: e.target.value }
              })}
              rows={3}
              placeholder="Описание сайта для поисковиков"
            />
          </div>

          <div className="form-group">
            <label>Meta Keywords</label>
            <input
              type="text"
              value={settings.seo?.metaKeywords || ''}
              onChange={(e) => setSettings({
                ...settings,
                seo: { ...(settings.seo || {}), metaKeywords: e.target.value }
              })}
              placeholder="Ключевые слова через запятую"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={saving || uploading}>
            {saving ? 'Сохранение...' : '💾 Сохранить настройки'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;
