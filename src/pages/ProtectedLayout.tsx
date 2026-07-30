import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { FullPageSpinner } from '@/components/Feedback';

export function ProtectedLayout() {
  const { session, therapist, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Preparing your workspace" />;

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!therapist) return <FullPageSpinner label="Loading profile" />;

  return <Outlet />;
}
