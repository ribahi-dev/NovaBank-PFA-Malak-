// Journal d'audit (admin) : qui a fait quoi, quand, depuis quelle IP.
import { useEffect, useState } from "react";
import api from "../api/client";
import { fmtDate } from "../utils/format";

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.get("/audit-logs", { params: { limit: 100 } }).then(({ data }) => setLogs(data));
  }, []);

  const visible = logs.filter(
    (l) => !filter || l.action.includes(filter) || (l.details ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Journal d'audit</h1>
          <p>Trace append-only des actions sensibles — {visible.length} entrée(s)</p>
        </div>
        <input
          style={{ maxWidth: 280 }}
          placeholder="Filtrer (login_failed, transaction…)"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>Date</th><th>Action</th><th>Entité</th><th>Utilisateur</th><th>IP</th><th>Résultat</th><th>Détails</th></tr>
          </thead>
          <tbody>
            {visible.map((l) => (
              <tr key={l.id} className="no-hover">
                <td>{fmtDate(l.created_at)}</td>
                <td><code>{l.action}</code></td>
                <td className="muted">{l.entity_type ? `${l.entity_type} #${l.entity_id}` : "—"}</td>
                <td>{l.user_id ?? "—"}</td>
                <td className="muted">{l.ip_address ?? "—"}</td>
                <td><span className={`badge ${l.success ? "success" : "blocked"}`}>{l.success ? "succès" : "échec"}</span></td>
                <td className="muted">{l.details ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <div className="empty">Aucune entrée.</div>}
      </div>
    </>
  );
}
