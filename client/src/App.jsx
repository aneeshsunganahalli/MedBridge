import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/Layout/AppShell';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import ManageSchedulePage from './pages/schedule/ManageSchedulePage';
import ManageClinicsPage from './pages/clinics/ManageClinicsPage';
import BookAppointmentPage from './pages/appointments/BookAppointmentPage';
import PatientAppointments from './pages/appointments/PatientAppointments';
import DoctorAppointments from './pages/appointments/DoctorAppointments';
import DocumentsPage from './pages/documents/DocumentsPage';
import RemindersPage from './pages/reminders/RemindersPage';

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <DoctorDashboard />;
  return <PatientDashboard />;
}

function AppointmentsRouter() {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <DoctorAppointments />;
  return <PatientAppointments />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppShell><DashboardRouter /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/my-appointments" element={
        <ProtectedRoute>
          <AppShell><AppointmentsRouter /></AppShell>
        </ProtectedRoute>
      } />

      {/* Patient-only routes */}
      <Route path="/book-appointment" element={
        <ProtectedRoute allowedRole="patient">
          <AppShell><BookAppointmentPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/my-documents" element={
        <ProtectedRoute allowedRole="patient">
          <AppShell><DocumentsPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/reminders" element={
        <ProtectedRoute allowedRole="patient">
          <AppShell><RemindersPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Doctor-only routes */}
      <Route path="/schedule" element={
        <ProtectedRoute allowedRole="doctor">
          <AppShell><ManageSchedulePage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/clinics" element={
        <ProtectedRoute allowedRole="doctor">
          <AppShell><ManageClinicsPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
