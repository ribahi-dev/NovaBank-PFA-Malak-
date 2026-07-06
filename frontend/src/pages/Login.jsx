// Page de connexion : héro aux couleurs de la marque + formulaire.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_HOME, useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        err.response?.status === 423
          ? detail // compte verrouillé : le message précis vient du serveur
          : detail || "Connexion impossible — vérifiez le serveur."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <h1>
          Nova<span>Bank</span>
        </h1>
        <p>
          Plateforme intelligente d'aide à la décision pour l'agence bancaire :
          pilotage, détection d'anomalies par IA et sécurité.
        </p>
        <ul>
          <li>📊 Tableau de bord temps réel de l'activité</li>
          <li>🤖 Score de risque expliqué pour chaque transaction</li>
          <li>🚨 Centre d'alertes pour le directeur d'agence</li>
          <li>🔐 Accès sécurisé par rôles (JWT, RBAC, audit)</li>
        </ul>
      </div>
      <div className="login-form-side">
        <div className="login-card">
          <h2>Connexion</h2>
          <p className="subtitle">Accédez à votre espace de travail</p>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">Email professionnel</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@novabank.ma"
                required
              />
            </div>
            <div>
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error-box">{error}</div>}
            <button className="btn" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
