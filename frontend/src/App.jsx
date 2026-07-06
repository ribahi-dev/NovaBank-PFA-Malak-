// Routage de l'application : routes publiques, protégées et par rôle.
import { Navigate, Route, Routes } from "react-router-dom";
import { ROLE_HOME, useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Alerts from "./pages/Alerts";
import Audit from "./pages/Audit";
import ClientDetail from "./pages/ClientDetail";
import Clients from "./pages/Clients";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NewTransaction from "./pages/NewTransaction";
import Transactions from "./pages/Transactions";
import Users from "./pages/Users";

// Redirection d'accueil : chaque rôle atterrit sur SA page principale.
function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? ROLE_HOME[user.role] : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Conseiller + Directeur */}
        <Route path="/clients" element={<ProtectedRoute roles={["advisor", "director"]}><Clients /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute roles={["advisor", "director"]}><ClientDetail /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute roles={["advisor", "director"]}><Transactions /></ProtectedRoute>} />
        {/* Conseiller uniquement */}
        <Route path="/operations/nouvelle" element={<ProtectedRoute roles={["advisor"]}><NewTransaction /></ProtectedRoute>} />
        {/* Directeur uniquement */}
        <Route path="/dashboard" element={<ProtectedRoute roles={["director"]}><Dashboard /></ProtectedRoute>} />
        <Route path="/alertes" element={<ProtectedRoute roles={["director"]}><Alerts /></ProtectedRoute>} />
        {/* Admin uniquement */}
        <Route path="/users" element={<ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute roles={["admin"]}><Audit /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
