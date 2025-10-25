import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './SiteStats.css';

const SiteStats: React.FC = () => {
  const [stats, setStats] = useState<{
    recipesCount: number;
    commentsCount: number;
    usersCount: number;
  }>({
    recipesCount: 0,
    commentsCount: 0,
    usersCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await api.recipes.getStats();
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="stats-box">
      <div className="stats-item">
        <span className="stats-number">{stats.recipesCount.toLocaleString()}</span>
        <span className="stats-label">рецептов</span>
      </div>
      <div className="stats-item">
        <span className="stats-number">{stats.usersCount.toLocaleString()}</span>
        <span className="stats-label">пользователей</span>
      </div>
      <div className="stats-item">
        <span className="stats-number">{stats.commentsCount.toLocaleString()}</span>
        <span className="stats-label">комментариев</span>
      </div>
    </div>
  );
};

export default SiteStats;
