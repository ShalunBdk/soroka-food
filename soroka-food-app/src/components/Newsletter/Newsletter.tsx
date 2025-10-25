import React, { useState } from 'react';
import api from '../../services/api';
import './Newsletter.css';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert('Пожалуйста, согласитесь с условиями рассылки');
      return;
    }

    setLoading(true);
    try {
      await api.newsletter.subscribe(email);
      alert('Спасибо за подписку!\nВаш email: ' + email);
      setEmail('');
      setAgreed(false);
    } catch (err) {
      alert('Не удалось подписаться. Возможно, этот email уже зарегистрирован.');
      console.error('Newsletter subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="newsletter-box">
      <p className="newsletter-description">Получайте новые рецепты на свою почту</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="newsletter-input"
          placeholder="Ваш email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="newsletter-checkbox">
          <input
            type="checkbox"
            id="agreeCheckbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <label htmlFor="agreeCheckbox">Я согласен получать рассылку и обновления</label>
        </div>
        <button type="submit" className="newsletter-button" disabled={loading}>
          {loading ? 'Подписываемся...' : 'Подписаться'}
        </button>
      </form>
    </div>
  );
};

export default Newsletter;
