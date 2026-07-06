// Pastille de score 0-100 : la couleur porte le niveau de risque.
import { scoreClass } from "../utils/format";

export default function ScorePill({ score }) {
  if (score === null || score === undefined) return <span className="muted">—</span>;
  return <span className={`score-pill ${scoreClass(score)}`}>{score}</span>;
}
