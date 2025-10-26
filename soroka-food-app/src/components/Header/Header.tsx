import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/image';
import { useSettings } from '../../contexts/SettingsContext';
import './Header.css';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="header">
      <nav className="nav-container">
        <Link to="/" className="logo">
          {settings?.logo && (
            <img
              src={getImageUrl(settings.logo)}
              alt="Logo"
              className="logo-image"
            />
          )}
          <span className="logo-text">{settings?.siteName || 'Soroka Food'}</span>
        </Link>
        <ul className="nav-menu">
          <li><Link to="/recipes">Рецепты</Link></li>
          <li><Link to="/about">О сайте</Link></li>
          <li><Link to="/best">Лучшее</Link></li>
          <li><Link to="/contact">Контакты</Link></li>
        </ul>
        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Поиск рецептов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">Найти</button>
        </form>
      </nav>
    </header>
  );
};

export default Header;
