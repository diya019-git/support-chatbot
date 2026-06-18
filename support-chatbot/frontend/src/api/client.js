import axios from "axios";

// In development, Vite proxies /api/* → Flask on port 5000.
// In production, set VITE_API_URL to your deployed backend URL.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const client = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the stored JWT (if any) to every outgoing request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("sp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token has expired or is invalid, clear it and bounce to login.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("sp_token");
      localStorage.removeItem("sp_user");
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
