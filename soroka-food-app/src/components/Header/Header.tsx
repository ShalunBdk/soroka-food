import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
  };

  return (
    <header className="header">
      <nav className="nav-container">
        <Link to="/" className="logo">Soroka</Link>
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
