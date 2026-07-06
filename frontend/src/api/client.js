// Client HTTP central : baseURL, jeton JWT automatique, refresh transparent.
// TOUTES les requêtes de l'application passent par cette instance.
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Chaque requête sortante embarque l'access token s'il existe.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sur un 401 : on tente UNE fois le refresh, puis on rejoue la requête.
// Si le refresh échoue (expiré/révoqué), on déconnecte proprement.
let refreshing = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem("refresh_token");
    if (error.response?.status === 401 && refreshToken && !original._retried) {
      original._retried = true;
      try {
        refreshing =
          refreshing ??
          axios.post("/api/auth/refresh", { refresh_token: refreshToken });
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        refreshing = null;
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
