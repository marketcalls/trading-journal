import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials (cookies) for CSRF
});

// CSRF token storage
let csrfToken: string | null = null;

// Helper function to ensure CSRF token is available
const ensureCsrfToken = async (): Promise<void> => {
  if (!csrfToken) {
    try {
      // Make a simple GET request to obtain CSRF token
      // This will be handled by the response interceptor
      await api.get('/auth/me').catch(() => {
        // Ignore errors (e.g., if not logged in)
      });
    } catch (error) {
      // Silently fail - token will be obtained on next successful request
    }
  }
};

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  async (config) => {
    // Add JWT token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure CSRF token is available for state-changing requests
    const stateMethods = ['post', 'put', 'patch', 'delete'];
    if (config.method && stateMethods.includes(config.method.toLowerCase())) {
      // If no CSRF token, try to get one
      if (!csrfToken && token) {
        await ensureCsrfToken();
      }

      // Add CSRF token if available
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and extract CSRF token
api.interceptors.response.use(
  (response) => {
    // Extract and store CSRF token from response headers
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      csrfToken = newCsrfToken;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403 && error.response?.data?.detail?.includes('CSRF')) {
      // CSRF token issue - clear token and retry after login
      csrfToken = null;
      console.error('CSRF protection error:', error.response.data.detail);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (username: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  me: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get('/auth/me', { headers });
  },
};

// Users API (Admin only)
export const usersApi = {
  getAll: (skip = 0, limit = 100) => api.get(`/users?skip=${skip}&limit=${limit}`),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Portfolios API
export const portfoliosApi = {
  getAll: () => api.get('/portfolios'),
  create: (data: { name: string; description?: string; initial_balance: number }) =>
    api.post('/portfolios', data),
  getById: (id: number) => api.get(`/portfolios/${id}`),
  update: (id: number, data: any) => api.patch(`/portfolios/${id}`, data),
  delete: (id: number) => api.delete(`/portfolios/${id}`),
};

// Trades API
export const tradesApi = {
  getByPortfolio: (portfolioId: number, status?: string) => {
    const url = status ? `/trades/portfolio/${portfolioId}?status=${status}` : `/trades/portfolio/${portfolioId}`;
    return api.get(url);
  },
  create: (data: any) => api.post('/trades', data),
  getById: (id: number) => api.get(`/trades/${id}`),
  update: (id: number, data: any) => api.patch(`/trades/${id}`, data),
  close: (id: number, data: { exit_price: number; exit_date: string }) =>
    api.post(`/trades/${id}/close`, data),
  uploadScreenshot: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/trades/${id}/screenshot`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: number) => api.delete(`/trades/${id}`),
};

// Analytics API
export const analyticsApi = {
  getPortfolioAnalytics: (portfolioId: number) => api.get(`/analytics/portfolio/${portfolioId}`),
  getBySymbol: (portfolioId: number) => api.get(`/analytics/portfolio/${portfolioId}/by-symbol`),
};

export default api;
