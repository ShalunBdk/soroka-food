import React, { useState } from 'react';
import './Newsletter.css';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert('Пожалуйста, согласитесь с условиями рассылки');
      return;
    }
    // TODO: Implement newsletter subscription
    console.log('Newsletter subscription:', email);
    alert('Спасибо за подписку!\nВаш email: ' + email);
    setEmail('');
    setAgreed(false);
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
        <button type="submit" className="newsletter-button">Подписаться</button>
      </form>
    </div>
  );
};

export default Newsletter;
