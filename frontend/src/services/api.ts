import axios from "axios";

// Camada única de acesso à API — nenhum componente deve chamar fetch/axios
// diretamente (ver convenção em docs/PROMPT_DESENVOLVIMENTO.md).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
