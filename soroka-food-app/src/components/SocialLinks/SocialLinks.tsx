import React from 'react';
import './SocialLinks.css';

const SocialLinks: React.FC = () => {
  const socials = [
    { name: 'YouTube', icon: '▶', url: '#' },
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'Telegram', icon: '✈', url: '#' },
    { name: 'TikTok', icon: '📱', url: '#' }
  ];

  return (
    <div className="social-links">
      {socials.map((social, index) => (
        <a key={index} href={social.url} className="social-link">
          <span className="social-icon">{social.icon}</span>
          <span>{social.name}</span>
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
