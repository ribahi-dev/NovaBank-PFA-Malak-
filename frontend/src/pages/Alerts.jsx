// Centre d'alertes du directeur : filtrage, détail avec explication IA,
// prise en charge et clôture (cycle de vie du CdC §7.4).
import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import ScorePill from "../components/ScorePill";
import { fmtDate, fmtMAD } from "../utils/format";

const TABS = [
  { key: "open", label: "Ouvertes" },
  { key: "in_progress", label: "En cours" },
  { key: "closed", label: "Clôturées" },
];
const LEVELS = { low: "faible", medium: "moyen", high: "élevé", critical: "critique" };

export default function Alerts() {
  const [tab, setTab] = useState("open");
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const { data } = await api.get("/alerts", { params: { status_filter: tab } });
    setAlerts(data);
    setSelected(null);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(alert, status) {
    await api.patch(`/alerts/${alert.id}`, { status });
    load();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Centre d'alertes</h1>
          <p>Anomalies détectées par le moteur IA et événements de sécurité</p>
        </div>
        <div className="row">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`btn sm ${tab === t.key ? "" : "secondary"}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <table>
            <thead><tr><th>Date</th><th>Niveau</th><th>Type</th><th>Statut</th></tr></thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} onClick={() => setSelected(a)}
                    style={selected?.id === a.id ? { background: "var(--primary-light)" } : {}}>
                  <td>{fmtDate(a.created_at)}</td>
                  <td><span className={`badge ${a.level}`}>{LEVELS[a.level]}</span></td>
                  <td>{a.alert_type === "transaction_risk" ? "Transaction à risque" : "Sécurité connexion"}</td>
                  <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {alerts.length === 0 && <div className="empty">Aucune alerte dans cette catégorie.</div>}
        </div>

        <div className="card">
          <h3>Détail de l'alerte</h3>
          {!selected && <div className="empty">Sélectionnez une alerte dans la liste.</div>}
          {selected && (
            <>
              <div className="row">
                <span className={`badge ${selected.level}`}>{LEVELS[selected.level]}</span>
                <span className="muted">créée le {fmtDate(selected.created_at)}</span>
              </div>
              <p style={{ lineHeight: 1.6 }}>{selected.message}</p>

              {selected.transaction && (
                <>
                  <h4 style={{ marginBottom: 8 }}>Transaction associée</h4>
                  <dl className="detail-list">
                    <dt>Type</dt><dd>{selected.transaction.transaction_type}</dd>
                    <dt>Montant</dt><dd>{fmtMAD(selected.transaction.amount)}</dd>
                    <dt>Ville</dt><dd>{selected.transaction.city ?? "—"}</dd>
                    <dt>Score IA</dt>
                    <dd><ScorePill score={selected.transaction.risk_score?.score} /></dd>
                  </dl>
                  {selected.transaction.risk_score && (
                    <div className="explanation">{selected.transaction.risk_score.explanation}</div>
                  )}
                </>
              )}

              {selected.status !== "closed" && (
                <div className="row mt">
                  {selected.status === "open" && (
                    <button className="btn secondary sm" onClick={() => changeStatus(selected, "in_progress")}>
                      Prendre en charge
                    </button>
                  )}
                  <button className="btn sm" onClick={() => changeStatus(selected, "closed")}>
                    Clôturer l'alerte
                  </button>
                </div>
              )}
              {selected.closed_at && (
                <p className="muted mt">Clôturée le {fmtDate(selected.closed_at)}</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
