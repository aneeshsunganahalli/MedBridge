import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';

export default function Topbar({ onToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="topbar-logo">
          <span className="topbar-logo-icon">M</span>
          MedBridge
        </div>
      </div>
      <div className="topbar-right">
        {user && (
          <div className="topbar-user">
            <span>{user.full_name}</span>
            <Badge status={user.role}>{user.role}</Badge>
          </div>
        )}
        <button className="topbar-logout" onClick={logout}>
          Sign Out
        </button>
      </div>
    </header>
  );
}
