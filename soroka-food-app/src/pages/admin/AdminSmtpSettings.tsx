import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api, { tokenManager } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './AdminSmtpSettings.css';

interface SmtpSettings {
  id: number;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
  hasPassword: boolean;
}

export default function AdminSmtpSettings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<SmtpSettings>({
    id: 1,
    host: '',
    port: 587,
    secure: false,
    user: '',
    fromEmail: '',
    fromName: '',
    enabled: false,
    hasPassword: false
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if user is SUPER_ADMIN
  useEffect(() => {
    const userData = tokenManager.getCurrentUser();
    if (!userData) {
      navigate('/admin/login');
      return;
    }

    if (userData.role !== 'SUPER_ADMIN') {
      showToast('Access denied. Only SUPER_ADMIN can manage SMTP settings.', 'error');
      navigate('/admin');
      return;
    }

    loadSettings();
  }, [navigate]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.admin.smtp.getSettings();
      setSettings(data);
    } catch (error: any) {
      console.error('Failed to load SMTP settings:', error);
      showToast(error.message || 'Failed to load SMTP settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        user: settings.user,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        enabled: settings.enabled
      };

      // Only include password if it's been changed
      if (password) {
        updateData.password = password;
      }

      const data = await api.admin.smtp.updateSettings(updateData);
      setSettings(data.settings);
      setPassword(''); // Clear password field after save
      showToast('SMTP settings saved successfully', 'success');
    } catch (error: any) {
      console.error('Failed to save SMTP settings:', error);
      showToast(error.message || 'Failed to save SMTP settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);

    try {
      const result = await api.admin.smtp.testConnection();
      showToast(result.message || 'SMTP connection test successful!', 'success');
    } catch (error: any) {
      console.error('SMTP test failed:', error);
      showToast(error.message || 'SMTP connection test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-smtp-settings">
        <div className="loading">Загрузка SMTP настроек...</div>
      </div>
    );
  }

  return (
    <div className="admin-smtp-settings">
      <div className="settings-header">
        <h1>SMTP Настройки</h1>
        <p className="subtitle">Настройка почтового сервера для отправки рассылок</p>
      </div>

      <form onSubmit={handleSubmit} className="smtp-form">
        <div className="form-section">
          <h2>Конфигурация сервера</h2>

          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="host">
                SMTP Хост *
                <span className="help-text">например, smtp.yandex.ru, smtp.mail.ru, mail.yourdomain.com</span>
              </label>
              <input
                type="text"
                id="host"
                value={settings.host}
                onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                required
                placeholder="smtp.yandex.ru"
              />
            </div>

            <div className="form-group flex-1">
              <label htmlFor="port">
                Порт *
                <span className="help-text">587 (TLS) или 465 (SSL)</span>
              </label>
              <input
                type="number"
                id="port"
                value={settings.port}
                onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) })}
                required
                min="1"
                max="65535"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={settings.secure}
                onChange={(e) => setSettings({ ...settings, secure: e.target.checked })}
              />
              <span>Использовать SSL/TLS (включить для порта 465, выключить для 587)</span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Аутентификация</h2>

          <div className="form-group">
            <label htmlFor="user">
              Имя пользователя/Email *
              <span className="help-text">Ваше имя пользователя или email для SMTP</span>
            </label>
            <input
              type="text"
              id="user"
              value={settings.user}
              onChange={(e) => setSettings({ ...settings, user: e.target.value })}
              required
              placeholder="your-email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Пароль {settings.hasPassword && '(текущий пароль установлен)'}
              <span className="help-text">
                {settings.hasPassword
                  ? 'Оставьте пустым, чтобы сохранить текущий пароль'
                  : 'Ваш пароль SMTP или специальный пароль приложения'}
              </span>
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={settings.hasPassword ? '••••••••' : 'Введите пароль'}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Информация об отправителе</h2>

          <div className="form-group">
            <label htmlFor="fromName">
              Имя отправителя *
              <span className="help-text">Имя, которое отображается в почте получателей</span>
            </label>
            <input
              type="text"
              id="fromName"
              value={settings.fromName}
              onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
              required
              placeholder="Soroka Food"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fromEmail">
              Email отправителя *
              <span className="help-text">Email адрес, который отображается как отправитель</span>
            </label>
            <input
              type="email"
              id="fromEmail"
              value={settings.fromEmail}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
              required
              placeholder="noreply@sorokafood.com"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Статус</h2>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              />
              <span className="enabled-label">
                Включить отправку писем
                {!settings.enabled && (
                  <span className="warning-text"> (Письма не будут отправляться пока выключено)</span>
                )}
              </span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleTestConnection}
            disabled={testing || !settings.enabled}
          >
            {testing ? 'Тестирование...' : 'Проверить подключение'}
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate('/admin')}
          >
            Отмена
          </button>
        </div>
      </form>

      <div className="smtp-help">
        <h3>ℹ️ Помощь по настройке</h3>
        <div className="help-content">
          <h4>Яндекс Почта:</h4>
          <ul>
            <li>Хост: <code>smtp.yandex.ru</code></li>
            <li>Порт: <code>465</code> (SSL) или <code>587</code> (TLS)</li>
            <li>Включите SSL/TLS для порта 465, выключите для 587</li>
            <li>Создайте пароль приложения в настройках безопасности</li>
          </ul>

          <h4>Mail.ru:</h4>
          <ul>
            <li>Хост: <code>smtp.mail.ru</code></li>
            <li>Порт: <code>465</code> (SSL) или <code>587</code> (TLS)</li>
            <li>Включите SSL/TLS для порта 465, выключите для 587</li>
            <li>Используйте пароль приложения из настроек безопасности</li>
          </ul>

          <h4>Свой сервер (Mailcow, Postfix и др.):</h4>
          <ul>
            <li>Используйте хост и порт вашего SMTP сервера</li>
            <li>Обычно: порт <code>587</code> (STARTTLS) или <code>465</code> (SSL)</li>
            <li>Убедитесь, что сервер доступен с этого IP адреса</li>
          </ul>

          <h4>Примечание по безопасности:</h4>
          <p>Пароли шифруются перед сохранением. Только SUPER_ADMIN может просматривать и изменять SMTP настройки.</p>
        </div>
      </div>
    </div>
  );
}
