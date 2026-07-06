// Fiche client : informations, comptes (avec ouverture), dernières opérations.
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import ScorePill from "../components/ScorePill";
import { fmtDate, fmtMAD } from "../utils/format";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [newAccount, setNewAccount] = useState({ account_type: "current", initial_balance: "0" });

  const load = useCallback(async () => {
    const [c, a, t] = await Promise.all([
      api.get(`/clients/${id}`),
      api.get("/accounts", { params: { client_id: id } }),
      api.get("/transactions", { params: { client_id: id, limit: 10 } }),
    ]);
    setClient(c.data);
    setAccounts(a.data);
    setTransactions(t.data);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function openAccount(event) {
    event.preventDefault();
    await api.post("/accounts", { client_id: Number(id), ...newAccount });
    load();
  }

  async function deactivate() {
    if (!window.confirm("Désactiver ce client ? (suppression logique)")) return;
    await api.delete(`/clients/${id}`);
    navigate("/clients");
  }

  if (!client) return <p className="muted">Chargement…</p>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{client.first_name} {client.last_name}{" "}
            {!client.is_active && <span className="badge blocked">désactivé</span>}
          </h1>
          <p>CIN {client.cin} · client depuis le {new Date(client.created_at).toLocaleDateString("fr-FR")}</p>
        </div>
        {user.role === "advisor" && client.is_active && (
          <button className="btn danger sm" onClick={deactivate}>Désactiver</button>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Informations</h3>
          <dl className="detail-list">
            <dt>Téléphone</dt><dd>{client.phone ?? "—"}</dd>
            <dt>Adresse</dt><dd>{client.address ?? "—"}</dd>
            <dt>Profession</dt><dd>{client.profession ?? "—"}</dd>
            <dt>Revenu mensuel</dt><dd>{client.monthly_income ? fmtMAD(client.monthly_income) : "—"}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>Comptes ({accounts.length})</h3>
          <table>
            <thead><tr><th>Numéro</th><th>Type</th><th>Solde</th><th>Statut</th></tr></thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="no-hover">
                  <td>{a.account_number}</td>
                  <td><span className={`badge ${a.account_type}`}>{a.account_type === "current" ? "courant" : "épargne"}</span></td>
                  <td><strong>{fmtMAD(a.balance)}</strong></td>
                  <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {user.role === "advisor" && client.is_active && (
            <form onSubmit={openAccount} className="row mt">
              <select
                style={{ maxWidth: 140 }}
                value={newAccount.account_type}
                onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
              >
                <option value="current">Courant</option>
                <option value="savings">Épargne</option>
              </select>
              <input
                style={{ maxWidth: 160 }} type="number" min="0" step="0.01"
                value={newAccount.initial_balance}
                onChange={(e) => setNewAccount({ ...newAccount, initial_balance: e.target.value })}
                placeholder="Solde initial"
              />
              <button className="btn sm">Ouvrir un compte</button>
            </form>
          )}
        </div>
      </div>

      <div className="card mt">
        <h3>Dernières opérations</h3>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Montant</th><th>Ville</th><th>Score IA</th></tr></thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="no-hover">
                <td>{fmtDate(t.created_at)}</td>
                <td><span className={`badge ${t.transaction_type}`}>{t.transaction_type}</span></td>
                <td><strong>{fmtMAD(t.amount)}</strong></td>
                <td>{t.city ?? "—"}</td>
                <td><ScorePill score={t.risk_score?.score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <div className="empty">Aucune opération.</div>}
      </div>
    </>
  );
}
