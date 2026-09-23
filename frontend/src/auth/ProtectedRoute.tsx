import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function BootScreen() {
  return (
    <div className="boot-screen" role="status" aria-live="polite">
      <div className="boot-spinner" />
      <p>Chargement de la session…</p>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) return <BootScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, bootstrapping, isAuthenticated } = useAuth();
  const location = useLocation();

  if (bootstrapping) return <BootScreen />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
