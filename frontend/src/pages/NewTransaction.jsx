// Saisie d'une opération par le conseiller — LE moment fort de la démo :
// l'API répond avec le score IA et son explication, affichés immédiatement.
import { useEffect, useState } from "react";
import api from "../api/client";
import ScorePill from "../components/ScorePill";
import { fmtMAD } from "../utils/format";

export default function NewTransaction() {
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [form, setForm] = useState({
    client_id: "", account_id: "", transaction_type: "deposit",
    amount: "", city: "", description: "", destination_account_id: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/clients", { params: { limit: 100 } }).then(({ data }) => setClients(data));
    api.get("/accounts", { params: { limit: 100 } }).then(({ data }) => setAllAccounts(data));
  }, []);

  // Le choix du client filtre ses comptes.
  useEffect(() => {
    if (!form.client_id) return setAccounts([]);
    api.get("/accounts", { params: { client_id: form.client_id } }).then(({ data }) => setAccounts(data));
  }, [form.client_id]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const payload = {
        transaction_type: form.transaction_type,
        amount: form.amount,
        account_id: Number(form.account_id),
        city: form.city || null,
        description: form.description || null,
        destination_account_id:
          form.transaction_type === "transfer" ? Number(form.destination_account_id) : null,
      };
      const { data } = await api.post("/transactions", payload);
      setResult(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Saisie invalide — vérifiez les champs.");
    } finally {
      setBusy(false);
    }
  }

  const selectedAccount = accounts.find((a) => a.id === Number(form.account_id));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nouvelle opération</h1>
          <p>Chaque opération est analysée en temps réel par le moteur de risque</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label>Client *</label>
                <select value={form.client_id} onChange={set("client_id")} required>
                  <option value="">— choisir —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.cin})</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Compte *</label>
                <select value={form.account_id} onChange={set("account_id")} required>
                  <option value="">— choisir —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_number} · {fmtMAD(a.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Type d'opération *</label>
                <select value={form.transaction_type} onChange={set("transaction_type")}>
                  <option value="deposit">Dépôt</option>
                  <option value="withdrawal">Retrait</option>
                  <option value="transfer">Virement</option>
                </select>
              </div>
              <div>
                <label>Montant (MAD) *</label>
                <input type="number" min="0.01" step="0.01" value={form.amount} onChange={set("amount")} required />
              </div>
              {form.transaction_type === "transfer" && (
                <div>
                  <label>Compte destinataire *</label>
                  <select value={form.destination_account_id} onChange={set("destination_account_id")} required>
                    <option value="">— choisir —</option>
                    {allAccounts
                      .filter((a) => a.id !== Number(form.account_id))
                      .map((a) => (
                        <option key={a.id} value={a.id}>{a.account_number}</option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label>Ville</label>
                <input value={form.city} onChange={set("city")} placeholder="Casablanca" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Description</label>
                <input value={form.description} onChange={set("description")} />
              </div>
            </div>
            {selectedAccount && (
              <p className="muted mt">Solde actuel : <strong>{fmtMAD(selectedAccount.balance)}</strong></p>
            )}
            {error && <div className="error-box">{error}</div>}
            <button className="btn mt" disabled={busy}>
              {busy ? "Analyse en cours…" : "Valider l'opération"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Analyse du risque</h3>
          {!result && <div className="empty">Le verdict du moteur IA s'affichera ici après la saisie.</div>}
          {result && (
            <>
              <div className="row">
                <ScorePill score={result.risk_score.score} />
                <div>
                  <strong>Score {result.risk_score.score}/100</strong>
                  <div className="muted">
                    confiance : {result.risk_score.confidence_level} · modèle {result.risk_score.model_version}
                  </div>
                </div>
              </div>
              <div className="explanation">{result.risk_score.explanation}</div>
              {result.risk_score.score >= 70 ? (
                <div className="error-box mt">
                  🚨 Une alerte a été créée automatiquement pour le directeur d'agence.
                </div>
              ) : (
                <div className="success-box mt">
                  ✅ Opération n°{result.id} enregistrée ({fmtMAD(result.amount)}).
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
