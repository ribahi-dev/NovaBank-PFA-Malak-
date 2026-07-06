// Tableau de bord du directeur : KPI + graphiques Plotly (CdC Modules 5/6).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import Plot from "../components/Plot";
import { fmtMAD } from "../utils/format";

const TYPE_LABELS = { deposit: "Dépôts", withdrawal: "Retraits", transfer: "Virements" };

export default function Dashboard() {
  const [kpi, setKpi] = useState(null);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    api.get("/analytics/kpi").then(({ data }) => setKpi(data));
    api.get("/analytics/trends?days=30").then(({ data }) => setTrends(data));
    api.get("/analytics/distribution").then(({ data }) => setDistribution(data));
  }, []);

  if (!kpi) return <p className="muted">Chargement…</p>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vue d'ensemble de l'activité de l'agence — 30 derniers jours</p>
        </div>
      </div>

      <div className="grid-kpi">
        <div className="card kpi">
          <div className="kpi-label">Clients actifs</div>
          <div className="kpi-value">{kpi.total_clients}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Comptes</div>
          <div className="kpi-value">{kpi.total_accounts}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Transactions</div>
          <div className="kpi-value">{kpi.total_transactions}</div>
          <div className="kpi-sub">
            {fmtMAD(kpi.total_deposits)} déposés · {fmtMAD(kpi.total_withdrawals)} retirés
          </div>
        </div>
        <Link to="/alertes" style={{ textDecoration: "none" }}>
          <div className={`card kpi ${kpi.open_alerts > 0 ? "alert" : ""}`}>
            <div className="kpi-label">Alertes ouvertes</div>
            <div className="kpi-value">{kpi.open_alerts}</div>
            <div className="kpi-sub">cliquer pour traiter</div>
          </div>
        </Link>
        <div className="card kpi">
          <div className="kpi-label">Score de risque moyen</div>
          <div className="kpi-value">
            {kpi.average_risk_score === null ? "—" : `${kpi.average_risk_score.toFixed(1)}/100`}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Activité quotidienne</h3>
          <Plot
            data={[
              {
                x: trends.map((t) => t.day),
                y: trends.map((t) => t.transaction_count),
                type: "bar",
                name: "Opérations",
                marker: { color: "#f08100" },
              },
            ]}
            layout={{
              height: 320, margin: { t: 10, r: 20, b: 60, l: 40 },
              yaxis: { title: { text: "Nombre d'opérations" } },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />
        </div>
        <div className="card">
          <h3>Répartition des opérations</h3>
          <Plot
            data={[
              {
                labels: distribution.map((d) => TYPE_LABELS[d.transaction_type] ?? d.transaction_type),
                values: distribution.map((d) => d.count),
                type: "pie",
                hole: 0.45,
                marker: { colors: ["#f08100", "#1f2427", "#fdb913"] },
                textinfo: "label+percent",
              },
            ]}
            layout={{
              height: 320, margin: { t: 10, r: 20, b: 20, l: 20 },
              showlegend: false,
              paper_bgcolor: "transparent",
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </>
  );
}
