// Composant Plotly construit sur la distribution "basic" (scatter, bar, pie) :
// ~4x plus légère que le bundle Plotly complet, suffisante pour le dashboard.
import Plotly from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";

export default createPlotlyComponent(Plotly);
