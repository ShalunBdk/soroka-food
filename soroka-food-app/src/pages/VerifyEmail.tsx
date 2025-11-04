import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router';
import api from '../services/api';
import '../styles/VerifyEmail.css';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Неверная ссылка подтверждения');
      return;
    }

    // Prevent duplicate verification requests (React StrictMode calls useEffect twice)
    if (verificationAttempted.current) {
      return;
    }
    verificationAttempted.current = true;

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const result = await api.newsletter.verify(token!);
      setStatus('success');
      setMessage(result.message || 'Email успешно подтвержден!');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Ошибка подтверждения. Возможно, ссылка устарела.');
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-container">
        {status === 'loading' && (
          <div className="verify-loading">
            <div className="spinner"></div>
            <h2>Проверяем ваш email...</h2>
            <p>Пожалуйста, подождите</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-success">
            <div className="success-icon">✓</div>
            <h2>Email подтвержден!</h2>
            <p>{message}</p>
            <p className="info-text">
              Теперь вы будете получать уведомления о новых рецептах и обновлениях от Soroka Food.
            </p>
            <Link to="/" className="btn-home">
              Перейти на главную
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-error">
            <div className="error-icon">✗</div>
            <h2>Ошибка подтверждения</h2>
            <p>{message}</p>
            <div className="error-actions">
              <Link to="/" className="btn-home">
                Перейти на главную
              </Link>
              <p className="retry-text">
                Хотите попробовать снова? Подпишитесь с вашим email на главной странице.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
