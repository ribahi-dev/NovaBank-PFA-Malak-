// Historique des transactions avec score IA (conseiller + directeur).
import { useEffect, useState } from "react";
import api from "../api/client";
import ScorePill from "../components/ScorePill";
import { fmtDate, fmtMAD } from "../utils/format";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    api.get("/transactions", { params: { limit: 50 } }).then(({ data }) => setTransactions(data));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>50 opérations les plus récentes, avec leur score de risque</p>
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Montant</th><th>Ville</th><th>Description</th><th>Score IA</th></tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="no-hover">
                <td>{fmtDate(t.created_at)}</td>
                <td><span className={`badge ${t.transaction_type}`}>{t.transaction_type}</span></td>
                <td><strong>{fmtMAD(t.amount)}</strong></td>
                <td>{t.city ?? "—"}</td>
                <td className="muted">{t.description ?? "—"}</td>
                <td><ScorePill score={t.risk_score?.score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <div className="empty">Aucune transaction.</div>}
      </div>
    </>
  );
}
