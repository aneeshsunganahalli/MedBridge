import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PATIENT_LINKS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/book-appointment', icon: '📅', label: 'Book Appointment' },
  { to: '/my-appointments', icon: '🗓️', label: 'My Appointments' },
  { to: '/my-documents', icon: '📄', label: 'My Documents' },
  { to: '/reminders', icon: '🔔', label: 'Reminders' },
];

const DOCTOR_LINKS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/schedule', icon: '🕐', label: 'My Schedule' },
  { to: '/my-appointments', icon: '🗓️', label: 'My Appointments' },
  { to: '/clinics', icon: '🏥', label: 'My Clinics' },
];

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  const links = user?.role === 'doctor' ? DOCTOR_LINKS : PATIENT_LINKS;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-text">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
