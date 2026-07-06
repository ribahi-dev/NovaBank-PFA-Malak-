// Contexte d'authentification : qui est connecté, avec quel rôle.
// Le rôle pilote le menu, les routes accessibles et la page d'accueil.
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const ROLE_HOME = { advisor: "/clients", director: "/dashboard", admin: "/users" };
export const ROLE_LABEL = { advisor: "Conseiller", director: "Directeur d'agence", admin: "Administrateur" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au chargement de l'app : si un jeton existe, on récupère le profil.
  useEffect(() => {
    if (!localStorage.getItem("access_token")) return setLoading(false);
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    // FastAPI attend un formulaire OAuth2 (username/password), pas du JSON.
    const form = new URLSearchParams({ username: email, password });
    const { data } = await api.post("/auth/login", form);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
