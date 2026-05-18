import type { ActiveSection } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';
import './Sidebar.css';

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  userEmail?: string;
  onLogout: () => void;
}

export function Sidebar({ activeSection, onSectionChange, userEmail, onLogout }: SidebarProps) {
  const lang = useLanguage();

  const NAV_ITEMS: { id: ActiveSection; label: string; icon: string }[] = [
    { id: 'contacts', label: t('nav_contacts', lang), icon: '👥' },
    { id: 'materials', label: t('nav_materials', lang), icon: '♻️' },
    { id: 'settings', label: t('nav_settings', lang), icon: '⚙️' },
  ];
  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">♻</span>
        <div>
          <div className="sidebar-logo-name">RegionFlow</div>
          <div className="sidebar-logo-sub">Správa výkupů</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-email">{userEmail}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={onLogout} title="Odhlásit se">
          ⏻
        </button>
      </div>
    </aside>
  );
}
