import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router';
import api from '../services/api';
import '../styles/Unsubscribe.css';

export default function Unsubscribe() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Недействительная ссылка для отписки');
      return;
    }

    handleUnsubscribe();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const result = await api.newsletter.unsubscribe(token!);
      setStatus('success');
      setMessage(result.message || 'Вы успешно отписались от рассылки');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Отписка не удалась. Ссылка может быть недействительной.');
    }
  };

  return (
    <div className="unsubscribe-page">
      <div className="unsubscribe-container">
        {status === 'loading' && (
          <div className="unsubscribe-loading">
            <div className="spinner"></div>
            <h2>Обработка вашего запроса...</h2>
            <p>Пожалуйста, подождите</p>
          </div>
        )}

        {status === 'success' && (
          <div className="unsubscribe-success">
            <div className="success-icon">👋</div>
            <h2>Отписка выполнена успешно</h2>
            <p>{message}</p>
            <p className="info-text">
              Нам жаль вас отпускать! Вы больше не будете получать письма с нашими рецептами.
            </p>
            <p className="resubscribe-text">
              Передумали? Вы всегда можете подписаться снова на главной странице.
            </p>
            <Link to="/" className="btn-home">
              Перейти на главную
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="unsubscribe-error">
            <div className="error-icon">✗</div>
            <h2>Отписка не удалась</h2>
            <p>{message}</p>
            <div className="error-actions">
              <Link to="/" className="btn-home">
                Перейти на главную
              </Link>
              <p className="contact-text">
                Если проблема продолжается, пожалуйста, свяжитесь с нами напрямую.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
