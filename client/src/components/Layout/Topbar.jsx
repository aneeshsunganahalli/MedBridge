import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';

export default function Topbar({ onToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          ☰
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
