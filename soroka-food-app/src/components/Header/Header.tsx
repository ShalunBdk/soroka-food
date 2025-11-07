import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/image';
import { useSettings } from '../../contexts/SettingsContext';
import './Header.css';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false); // Закрываем мобильный поиск после поиска
    }
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
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

        {/* Desktop search */}
        <form className="search-box search-desktop" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Поиск рецептов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">Найти</button>
        </form>

        {/* Mobile search icon */}
        <button
          className="search-icon-mobile"
          onClick={toggleMobileSearch}
          type="button"
          aria-label="Поиск"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </nav>

      {/* Mobile fullscreen search */}
      {isMobileSearchOpen && (
        <div className="mobile-search-overlay">
          <div className="mobile-search-container">
            <form className="mobile-search-form" onSubmit={handleSearch}>
              <input
                type="text"
                className="mobile-search-input"
                placeholder="Поиск рецептов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="mobile-search-btn">Найти</button>
            </form>
            <button
              className="mobile-search-close"
              onClick={toggleMobileSearch}
              type="button"
              aria-label="Закрыть"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
