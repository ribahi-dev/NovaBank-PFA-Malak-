// Formatage centralisé : mêmes dates et mêmes montants sur tous les écrans.
export const fmtMAD = (value) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(value);

export const fmtDate = (value) =>
  new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export const scoreClass = (score) =>
  score >= 85 ? "score-critical" : score >= 70 ? "score-high" : score >= 40 ? "score-medium" : "score-low";
