import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  timeout: 15000 // stop request after 15s
});

// This function is used after login or logout
export function setAuthToken(token) {

  // If logged in, it add the token to ALL future requests automatically
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  
  // If logged out, it removes token form futur requests
  else delete api.defaults.headers.common.Authorization;
}

export default api;
