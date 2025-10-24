import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-links">
        <Link to="/about">О сайте</Link>
        <Link to="/contact">Контакты</Link>
        <Link to="/rules">Правила</Link>
        <Link to="/advertising">Реклама</Link>
      </div>
      <p>&copy; 2025 Soroka. Все права защищены.</p>
    </footer>
  );
};

export default Footer;
