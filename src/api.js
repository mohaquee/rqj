// ════════════════════════════════════════════════════════════════════
// API client — talks to the backend at /api
// ════════════════════════════════════════════════════════════════════
// In production, set VITE_API_BASE in .env to e.g. https://api.rqjurists.com
// In dev, defaults to http://localhost:4000
// ════════════════════════════════════════════════════════════════════

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:4000";
const TOKEN_KEY = "rqj_auth_token_v1";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// Generic fetch wrapper with auth + JSON
async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError("Cannot reach the server. Check your internet connection.", 0, networkErr);
  }

  let data;
  const text = await response.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!response.ok) {
    // 401 = expired token → wipe local token, force re-login
    if (response.status === 401) {
      setToken(null);
    }
    throw new ApiError(data?.error || response.statusText, response.status, data);
  }
  return data;
}

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────
export const api = {
  async login(username, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    });
    setToken(data.token);
    return data.user;
  },

  async me() {
    return request("/api/auth/me");
  },

  logout() {
    setToken(null);
  },

  // ─── Employees ──────────────────────────────────────────────────────
  getEmployees: () => request("/api/employees"),

  // ─── Clients ────────────────────────────────────────────────────────
  getClients: () => request("/api/clients"),
  createClient: (data) => request("/api/clients", { method: "POST", body: data }),
  updateClient: (id, data) => request(`/api/clients/${id}`, { method: "PUT", body: data }),

  // ─── Invoices ───────────────────────────────────────────────────────
  getInvoices: () => request("/api/invoices"),
  createInvoice: (data) => request("/api/invoices", { method: "POST", body: data }),
  recordPayment: (invoiceId, amount, method) =>
    request(`/api/invoices/${invoiceId}/payments`, {
      method: "POST",
      body: { amount, method },
    }),
  amendInvoice: (invoiceId, newAmount, reason) =>
    request(`/api/invoices/${invoiceId}/amendments`, {
      method: "POST",
      body: { newAmount, reason },
    }),

  // ─── Health ─────────────────────────────────────────────────────────
  health: () => request("/health", { auth: false }),
};

export const API_BASE_URL = API_BASE;
