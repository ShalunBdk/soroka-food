import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Простая проверка (в реальном приложении используйте API)
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('admin_logged_in', 'true');
      navigate('/admin');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <h1>Soroka</h1>
          <p>Панель администратора</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="admin-login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Логин</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>

          <button type="submit" className="admin-login-btn">
            Войти
          </button>
        </form>

        <div className="admin-login-footer">
          <p>Логин: admin | Пароль: admin</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
