import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import GestionActasPage from "./pages/GestionActas/GestionActasPage";
import AdministracionPage from "./pages/Administracion/AdministracionPage";
import { useAuth, type Permission } from "./auth/AuthContext";

function SessionLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f7f3] px-6">
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-5 text-center shadow-soft">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-700">Validando sesión...</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <SessionLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: JSX.Element;
}) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AuthorizedHome() {
  const { hasPermission } = useAuth();
    if (hasPermission("administrar")) return <Navigate to="/dashboard" replace />;
  if (hasPermission("ver")) return <Navigate to="/gestion-actas" replace />;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
      <h1 className="text-xl font-bold text-gray-800">Sin módulos asignados</h1>
      <p className="mt-2 text-sm text-gray-600">
        Tu usuario no tiene permisos activos. Solicita acceso a un administrador.
      </p>
    </div>
  );
}

function LoginRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return <SessionLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route
          path="dashboard"
          element={
            <RequirePermission permission="administrar">
              <DashboardPage />
            </RequirePermission>
          }
        />
        <Route index element={<AuthorizedHome />} />
        <Route
          path="gestion-actas"
          element={
            <RequirePermission permission="ver">
              <GestionActasPage />
            </RequirePermission>
          }
        />
        <Route
          path="administracion"
          element={
            <RequirePermission permission="administrar">
              <AdministracionPage />
            </RequirePermission>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
