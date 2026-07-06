// Administration des utilisateurs de la plateforme (admin uniquement).
import { useEffect, useState } from "react";
import api from "../api/client";
import { ROLE_LABEL } from "../auth/AuthContext";
import { fmtDate } from "../utils/format";

const EMPTY = { first_name: "", last_name: "", email: "", password: "", role: "advisor" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/users").then(({ data }) => setUsers(data));
  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Formulaire invalide (mot de passe : 8 caractères minimum).");
    }
  }

  async function toggleActive(user) {
    await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
    load();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Utilisateurs</h1>
          <p>Comptes de la plateforme et attribution des rôles</p>
        </div>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "+ Nouvel utilisateur"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h3>Nouvel utilisateur</h3>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div><label>Prénom *</label><input value={form.first_name} onChange={set("first_name")} required /></div>
              <div><label>Nom *</label><input value={form.last_name} onChange={set("last_name")} required /></div>
              <div><label>Email *</label><input type="email" value={form.email} onChange={set("email")} required /></div>
              <div><label>Mot de passe *</label><input type="password" value={form.password} onChange={set("password")} minLength={8} required /></div>
              <div>
                <label>Rôle *</label>
                <select value={form.role} onChange={set("role")}>
                  <option value="advisor">Conseiller</option>
                  <option value="director">Directeur d'agence</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <button className="btn mt">Créer l'utilisateur</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Créé le</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="no-hover">
                <td><strong>{u.first_name} {u.last_name}</strong></td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role}`}>{ROLE_LABEL[u.role]}</span></td>
                <td><span className={`badge ${u.is_active ? "active" : "blocked"}`}>{u.is_active ? "actif" : "désactivé"}</span></td>
                <td className="muted">{fmtDate(u.created_at)}</td>
                <td>
                  <button className="btn secondary sm" onClick={() => toggleActive(u)}>
                    {u.is_active ? "Désactiver" : "Réactiver"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
