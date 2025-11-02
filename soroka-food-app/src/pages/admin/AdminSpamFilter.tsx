import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './AdminCommon.css';

function AdminSpamFilter() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Локальные состояния для ползунков (для плавного отображения без сохранения)
  const [tempMaxUrls, setTempMaxUrls] = useState<number | null>(null);
  const [tempCapsPercentage, setTempCapsPercentage] = useState<number | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.admin.spamFilter.getSettings();
      setSettings(data);
    } catch (err: any) {
      toast.error(err.message || 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: string, value: boolean) => {
    setSaving(true);
    try {
      const data = await api.admin.spamFilter.updateSettings({ [field]: value });
      setSettings(data.settings);
      toast.success('Настройка обновлена');
    } catch (err: any) {
      toast.error(err.message || 'Не удалось обновить настройку');
    } finally {
      setSaving(false);
    }
  };

  const handleThresholdChange = (field: string, value: number) => {
    // Обновляем локальное состояние для плавного отображения
    if (field === 'maxUrls') {
      setTempMaxUrls(value);
    } else if (field === 'capsPercentage') {
      setTempCapsPercentage(value);
    }
  };

  const handleThresholdSave = async (field: string, value: number) => {
    setSaving(true);
    try {
      const data = await api.admin.spamFilter.updateSettings({ [field]: value });
      setSettings(data.settings);
      // Сбрасываем временные значения
      setTempMaxUrls(null);
      setTempCapsPercentage(null);
      toast.success('Порог обновлен');
    } catch (err: any) {
      toast.error(err.message || 'Не удалось обновить порог');
      // В случае ошибки тоже сбрасываем временные значения
      setTempMaxUrls(null);
      setTempCapsPercentage(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      const data = await api.admin.spamFilter.addKeyword(newKeyword.trim());
      setSettings(data.settings);
      setNewKeyword('');
      toast.success('Слово добавлено');
    } catch (err: any) {
      toast.error(err.message || 'Не удалось добавить слово');
    }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    try {
      const data = await api.admin.spamFilter.removeKeyword(keyword);
      setSettings(data.settings);
      toast.success('Слово удалено');
    } catch (err: any) {
      toast.error(err.message || 'Не удалось удалить слово');
    }
  };

  if (loading) {
    return <div className="loading-message">Загрузка...</div>;
  }

  if (!settings) {
    return <div className="error-message">Не удалось загрузить настройки</div>;
  }

  return (
    <div className="admin-common">
      <div className="page-header">
        <h1>Управление спам-фильтром</h1>
      </div>

      <div className="settings-form">
        <div className="settings-section">
          <h3>Фильтры</h3>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enableKeywordFilter}
                onChange={(e) => handleToggle('enableKeywordFilter', e.target.checked)}
                disabled={saving}
              />
              <span>Фильтр ключевых слов</span>
            </label>
            <small className="hint">Проверяет текст на наличие спам-слов (встроенных + кастомных)</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enableUrlFilter}
                onChange={(e) => handleToggle('enableUrlFilter', e.target.checked)}
                disabled={saving}
              />
              <span>Фильтр ссылок</span>
            </label>
            <small className="hint">Блокирует комментарии с большим количеством ссылок</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enableCapsFilter}
                onChange={(e) => handleToggle('enableCapsFilter', e.target.checked)}
                disabled={saving}
              />
              <span>Фильтр КАПСА</span>
            </label>
            <small className="hint">Блокирует комментарии, написанные заглавными буквами</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enableRepetitiveFilter}
                onChange={(e) => handleToggle('enableRepetitiveFilter', e.target.checked)}
                disabled={saving}
              />
              <span>Фильтр повторяющегося текста</span>
            </label>
            <small className="hint">Блокирует комментарии с повторяющимися символами/словами</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.enableDuplicateFilter}
                onChange={(e) => handleToggle('enableDuplicateFilter', e.target.checked)}
                disabled={saving}
              />
              <span>Фильтр дубликатов</span>
            </label>
            <small className="hint">Блокирует повторную отправку одинаковых комментариев (24ч)</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>Пороги срабатывания</h3>

          <div className="form-group">
            <label>Максимум ссылок: {tempMaxUrls !== null ? tempMaxUrls : settings.maxUrls}</label>
            <input
              type="range"
              min="0"
              max="10"
              value={tempMaxUrls !== null ? tempMaxUrls : settings.maxUrls}
              onChange={(e) => handleThresholdChange('maxUrls', parseInt(e.target.value))}
              onMouseUp={(e) => handleThresholdSave('maxUrls', parseInt((e.target as HTMLInputElement).value))}
              onBlur={(e) => handleThresholdSave('maxUrls', parseInt(e.target.value))}
              disabled={saving || !settings.enableUrlFilter}
            />
            <small className="hint">Комментарии с большим количеством ссылок помечаются как спам</small>
          </div>

          <div className="form-group">
            <label>Процент капса: {tempCapsPercentage !== null ? tempCapsPercentage : settings.capsPercentage}%</label>
            <input
              type="range"
              min="50"
              max="100"
              value={tempCapsPercentage !== null ? tempCapsPercentage : settings.capsPercentage}
              onChange={(e) => handleThresholdChange('capsPercentage', parseInt(e.target.value))}
              onMouseUp={(e) => handleThresholdSave('capsPercentage', parseInt((e.target as HTMLInputElement).value))}
              onBlur={(e) => handleThresholdSave('capsPercentage', parseInt(e.target.value))}
              disabled={saving || !settings.enableCapsFilter}
            />
            <small className="hint">Процент заглавных букв для срабатывания фильтра</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>Кастомные спам-слова ({settings.customKeywords.length})</h3>

          <form onSubmit={handleAddKeyword} className="add-form">
            <div className="form-group">
              <label>Добавить слово</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Введите слово..."
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-secondary">
                  Добавить
                </button>
              </div>
              <small className="hint">Слова проверяются без учета регистра</small>
            </div>
          </form>

          <div className="keywords-list">
            {settings.customKeywords.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                Нет кастомных слов
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {settings.customKeywords.map((keyword: string) => (
                  <div key={keyword} className="keyword-chip">
                    <span>{keyword}</span>
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="keyword-remove"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSpamFilter;
