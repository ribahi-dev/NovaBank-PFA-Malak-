// Liste des clients : recherche (nom/CIN), création, accès à la fiche.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { fmtMAD } from "../utils/format";

const EMPTY = {
  first_name: "", last_name: "", cin: "", phone: "",
  address: "", profession: "", monthly_income: "",
};

export default function Clients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  async function load(query = "") {
    const { data } = await api.get("/clients", { params: query ? { search: query } : {} });
    setClients(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== "")
      );
      const { data } = await api.post("/clients", payload);
      setShowForm(false);
      setForm(EMPTY);
      navigate(`/clients/${data.id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Formulaire invalide — vérifiez les champs (CIN : 1-2 lettres puis chiffres).");
    }
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Clients</h1>
          <p>{clients.length} client(s) affiché(s)</p>
        </div>
        {user.role === "advisor" && (
          <button className="btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "+ Nouveau client"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h3>Nouveau client</h3>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div><label>Prénom *</label><input value={form.first_name} onChange={set("first_name")} required /></div>
              <div><label>Nom *</label><input value={form.last_name} onChange={set("last_name")} required /></div>
              <div><label>CIN *</label><input value={form.cin} onChange={set("cin")} placeholder="AB123456" required /></div>
              <div><label>Téléphone</label><input value={form.phone} onChange={set("phone")} /></div>
              <div><label>Profession</label><input value={form.profession} onChange={set("profession")} /></div>
              <div><label>Revenu mensuel (MAD)</label><input type="number" min="0" step="0.01" value={form.monthly_income} onChange={set("monthly_income")} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label>Adresse</label><input value={form.address} onChange={set("address")} /></div>
            </div>
            <button className="btn mt">Créer le client</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            style={{ maxWidth: 320 }}
            placeholder="Rechercher par nom ou CIN…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
          />
        </div>
        <table>
          <thead>
            <tr><th>Client</th><th>CIN</th><th>Profession</th><th>Revenu</th><th>Téléphone</th></tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} onClick={() => navigate(`/clients/${c.id}`)}>
                <td><strong>{c.first_name} {c.last_name}</strong></td>
                <td>{c.cin}</td>
                <td>{c.profession ?? "—"}</td>
                <td>{c.monthly_income ? fmtMAD(c.monthly_income) : "—"}</td>
                <td>{c.phone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <div className="empty">Aucun client trouvé.</div>}
      </div>
    </>
  );
}
