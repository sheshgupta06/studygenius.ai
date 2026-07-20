import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// ── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || "") : "",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request Interceptor — Attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor — Handle 401 + Auto-Refresh ─────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 — attempt token refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No refresh token — force logout
        _forceLogout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001"}/api/v1/auth/refresh-token`,
          { authorization: `Bearer ${refreshToken}` },
        );

        const { access_token } = response.data;
        localStorage.setItem("access_token", access_token);
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        onRefreshed(access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch {
        _forceLogout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

function _forceLogout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("studygenius-auth"); // Clear zustand persisted state
  window.location.href = "/sign-in";
}

export default api;
