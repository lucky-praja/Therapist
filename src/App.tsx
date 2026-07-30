import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProtectedLayout } from '@/pages/ProtectedLayout';
import { AppLayout } from '@/pages/AppLayout';
import { DashboardHome } from '@/pages/DashboardHome';
import { SchedulePage } from '@/pages/SchedulePage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ClientDetailPage } from '@/pages/ClientDetailPage';
import { NotesPage } from '@/pages/NotesPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ChatPage } from '@/pages/ChatPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PublicProfilePage } from '@/pages/PublicProfilePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/t/:slug" element={<PublicProfilePage />} />
          <Route path="/t/:slug/book" element={<PublicProfilePage />} />

          <Route element={<ProtectedLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/app" element={<DashboardHome />} />
              <Route path="/app/schedule" element={<SchedulePage />} />
              <Route path="/app/clients" element={<ClientsPage />} />
              <Route path="/app/clients/:id" element={<ClientDetailPage />} />
              <Route path="/app/notes" element={<NotesPage />} />
              <Route path="/app/payments" element={<PaymentsPage />} />
              <Route path="/app/analytics" element={<AnalyticsPage />} />
              <Route path="/app/chat" element={<ChatPage />} />
              <Route path="/app/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
