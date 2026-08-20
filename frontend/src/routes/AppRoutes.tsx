import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/organizer/DashboardPage';
import { CreateEventPage } from '../pages/organizer/CreateEventPage';
import { EventsListPage } from '../pages/client/EventsListPage';
import { EventDetailPage } from '../pages/client/EventDetailPage';
import { ValidationPage } from '../pages/gate/ValidationPage';
import { MyTicketsPage } from '../pages/client/MyTicketsPage';

// Placeholders temporários até criarmos as telas na Parte 2 e 3
const Placeholder = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <h1 className="text-2xl font-bold text-gray-700">{title}</h1>
  </div>
);

export const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  // Função inteligente para redirecionar o usuário para a home certa após o login
  const getHomeRoute = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'ORGANIZER') return '/organizer/dashboard';
    if (user?.role === 'GATE') return '/gate/validate';
    return '/events'; // Cliente
  };

  return (
        <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<Placeholder title="Acesso Negado (403)" />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />

        {/* Rotas do Cliente */}
        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/my-tickets" element={<Placeholder title="[Parte 3] Meus Ingressos" />} />
        </Route>
        {/* Rotas do Organizador */}
        <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
        <Route path="/organizer/dashboard" element={<DashboardPage />} />
        <Route path="/organizer/events/new" element={<CreateEventPage />} />
        </Route>

      {/* Rotas da Portaria */}
        <Route element={<ProtectedRoute allowedRoles={['GATE']} />}>
        <Route path="/gate/validate" element={<ValidationPage />} />
        </Route>

        </Routes>
  );
};