import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { type UserRole } from '../../types';
import './UserForm.css';

function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'MODERATOR' as UserRole,
    active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const user = await api.admin.users.getById(parseInt(id!));
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
        active: user.active
      });
    } catch (err: any) {
      toast.error(err.message || 'Не удалось загрузить пользователя');
      navigate('/admin/users');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать минимум 3 символа';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Имя пользователя может содержать только буквы, цифры и подчеркивание';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }

    // Password validation (only for create mode)
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Пароль обязателен';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Пароль должен содержать минимум 8 символов';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Пароль должен содержать хотя бы одну заглавную букву';
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = 'Пароль должен содержать хотя бы одну строчную букву';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Пароль должен содержать хотя бы одну цифру';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Пароли не совпадают';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await api.admin.users.update(parseInt(id!), {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          active: formData.active
        });
        toast.success('Пользователь успешно обновлен');
      } else {
        await api.admin.users.create({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        toast.success('Пользователь успешно создан');
      }
      navigate('/admin/users');
    } catch (err: any) {
      toast.error(err.message || 'Произошла ошибка при сохранении');
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error('Введите новый пароль');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('Пароль должен содержать заглавные и строчные буквы, и цифры');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    try {
      await api.admin.users.changePassword(parseInt(id!), newPassword);
      toast.success('Пароль успешно изменен');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Не удалось изменить пароль');
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';

    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];

    // Fill the rest
    for (let i = 3; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setNewPassword(password);
    setConfirmNewPassword(password);
  };

  return (
    <div className="user-form">
      <div className="form-header">
        <h1>{isEditMode ? 'Редактировать пользователя' : 'Создать пользователя'}</h1>
        <Link to="/admin/users" className="btn-back">
          ← Назад к списку
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="username">
            Имя пользователя <span className="required">*</span>
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className={errors.username ? 'error' : ''}
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        {!isEditMode && (
          <>
            <div className="form-group">
              <label htmlFor="password">
                Пароль <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
              <small className="hint">
                Минимум 8 символов, должен содержать заглавные и строчные буквы, цифры
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Подтвердите пароль <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </>
        )}

        {isEditMode && (
          <div className="form-group">
            <label>Пароль</label>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="btn-secondary"
            >
              Изменить пароль
            </button>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="role">
            Роль <span className="required">*</span>
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
          >
            <option value="SUPER_ADMIN">Главный администратор</option>
            <option value="ADMIN">Администратор</option>
            <option value="MODERATOR">Модератор</option>
          </select>
          <small className="hint">
            {formData.role === 'SUPER_ADMIN' && 'Полный доступ ко всем функциям'}
            {formData.role === 'ADMIN' && 'Может создавать только модераторов'}
            {formData.role === 'MODERATOR' && 'Управление контентом: рецепты, комментарии, категории'}
          </small>
        </div>

        {isEditMode && (
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span>Пользователь активен</span>
            </label>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Сохранение...' : isEditMode ? 'Обновить пользователя' : 'Создать пользователя'}
          </button>
          <Link to="/admin/users" className="btn-cancel">
            Отмена
          </Link>
        </div>
      </form>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Изменить пароль</h2>

            <div className="form-group">
              <label htmlFor="newPassword">Новый пароль</label>
              <input
                type="text"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmNewPassword">Подтвердите пароль</label>
              <input
                type="text"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={generateRandomPassword}
              className="btn-generate"
            >
              Сгенерировать пароль
            </button>

            <div className="modal-actions">
              <button onClick={handlePasswordChange} className="btn-primary">
                Изменить пароль
              </button>
              <button onClick={() => setShowPasswordModal(false)} className="btn-cancel">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserForm;
