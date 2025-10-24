import React from 'react';
import { Link } from 'react-router-dom';
import type { SidebarSection } from '../../types/index';
import './Sidebar.css';

interface SidebarProps {
  sections: SidebarSection[];
}

const Sidebar: React.FC<SidebarProps> = ({ sections }) => {
  return (
    <aside className="sidebar">
      {sections.map((section, index) => (
        <div key={index} className="sidebar-section">
          <h3 className="sidebar-title">{section.title}</h3>
          <ul className="sidebar-list">
            {section.links.map((link, linkIndex) => (
              <li key={linkIndex}>
                <Link to={link.url}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
