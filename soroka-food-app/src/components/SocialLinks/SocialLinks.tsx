import React from 'react';
import './SocialLinks.css';

interface SocialLinksProps {
  youtube?: string;
  instagram?: string;
  telegram?: string;
  tiktok?: string;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ youtube, instagram, telegram, tiktok }) => {
  const socials = [
    { name: 'YouTube', icon: '▶', url: youtube },
    { name: 'Instagram', icon: '📷', url: instagram },
    { name: 'Telegram', icon: '✈', url: telegram },
    { name: 'TikTok', icon: '📱', url: tiktok }
  ].filter(social => social.url && social.url.trim() !== ''); // Показывать только кнопки с установленными ссылками

  // Если нет ни одной ссылки, не показываем компонент
  if (socials.length === 0) {
    return null;
  }

  return (
    <div className="social-links">
      {socials.map((social, index) => (
        <a
          key={index}
          href={social.url}
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="social-icon">{social.icon}</span>
          <span>{social.name}</span>
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
