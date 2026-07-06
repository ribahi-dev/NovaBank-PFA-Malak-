// Gabarit commun : sidebar sombre (navigation par rôle) + zone de contenu.
import { NavLink, Outlet } from "react-router-dom";
import { ROLE_LABEL, useAuth } from "../auth/AuthContext";

const MENU = {
  advisor: [
    { to: "/clients", label: "👥 Clients" },
    { to: "/operations/nouvelle", label: "➕ Nouvelle opération" },
    { to: "/transactions", label: "🧾 Transactions" },
  ],
  director: [
    { to: "/dashboard", label: "📊 Tableau de bord" },
    { to: "/alertes", label: "🚨 Alertes" },
    { to: "/clients", label: "👥 Clients" },
    { to: "/transactions", label: "🧾 Transactions" },
  ],
  admin: [
    { to: "/users", label: "🛡️ Utilisateurs" },
    { to: "/audit", label: "📜 Journal d'audit" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          Nova<span>Bank</span>
          <small>Plateforme d'aide à la décision</small>
        </div>
        <nav className="nav">
          {MENU[user.role].map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-name">{user.first_name} {user.last_name}</div>
          <div className="user-role">{ROLE_LABEL[user.role]}</div>
          <button onClick={logout}>Se déconnecter</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
