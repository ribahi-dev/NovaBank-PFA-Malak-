// Garde de route : authentification obligatoire, rôle optionnel.
// NB : c'est du CONFORT d'interface — la vraie sécurité est le RBAC
// vérifié côté serveur à chaque requête (un menu caché n'est pas une défense).
import { Navigate } from "react-router-dom";
import { ROLE_HOME, useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
}
