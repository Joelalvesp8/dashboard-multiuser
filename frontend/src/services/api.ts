import axios from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  Role,
  Permission,
  DashboardData,
  ChartDataPoint,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<{ message: string; user: User }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: RegisterData): Promise<{ message: string; user: User }> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  updatePassword: async (
    id: number,
    data: { currentPassword?: string; newPassword: string }
  ): Promise<{ message: string }> => {
    const response = await api.patch(`/users/${id}/password`, data);
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getData: async (range?: string): Promise<DashboardData> => {
    const response = await api.get('/dashboard/data', { params: { range } });
    return response.data;
  },

  getChartData: async (field: string, range?: string): Promise<ChartDataPoint[]> => {
    const response = await api.get('/dashboard/chart', { params: { field, range } });
    return response.data;
  },

  getStatistics: async (range?: string): Promise<any> => {
    const response = await api.get('/dashboard/statistics', { params: { range } });
    return response.data;
  },

  getTimeSeries: async (
    dateField: string,
    valueField: string,
    range?: string
  ): Promise<any[]> => {
    const response = await api.get('/dashboard/timeseries', {
      params: { dateField, valueField, range },
    });
    return response.data;
  },

  getAggregated: async (
    groupBy: string,
    aggregateField: string,
    aggregateFunction?: 'sum' | 'avg' | 'min' | 'max' | 'count',
    range?: string
  ): Promise<ChartDataPoint[]> => {
    const response = await api.get('/dashboard/aggregated', {
      params: { groupBy, aggregateField, aggregateFunction, range },
    });
    return response.data;
  },

  // Novos endpoints para análise avançada
  getCategories: async (range?: string): Promise<string[]> => {
    const response = await api.get('/dashboard/categories', { params: { range } });
    return response.data;
  },

  searchProducts: async (query: string, limit?: number, range?: string): Promise<any[]> => {
    const response = await api.get('/dashboard/search-products', {
      params: { query, limit, range },
    });
    return response.data;
  },

  getProductAnalysis: async (product: string, range?: string): Promise<any> => {
    const response = await api.get('/dashboard/product-analysis', {
      params: { product, range },
    });
    return response.data;
  },

  getFilteredData: async (categories: string[], range?: string): Promise<any> => {
    const response = await api.get('/dashboard/filtered', {
      params: { categories: categories.join(','), range },
    });
    return response.data;
  },

  getPatients: async (): Promise<any> => {
    const response = await api.get('/dashboard/patients');
    return response.data;
  },

  getCorrelation: async (range?: string): Promise<any> => {
    const response = await api.get('/dashboard/correlation', { params: { range } });
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Roles
  getAllRoles: async (): Promise<Role[]> => {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  getRoleById: async (id: number): Promise<Role> => {
    const response = await api.get(`/admin/roles/${id}`);
    return response.data;
  },

  createRole: async (data: {
    name: string;
    description?: string;
    permissions?: number[];
  }): Promise<{ message: string; role: Role }> => {
    const response = await api.post('/admin/roles', data);
    return response.data;
  },

  updateRole: async (
    id: number,
    data: { name?: string; description?: string; permissions?: number[] }
  ): Promise<{ message: string }> => {
    const response = await api.put(`/admin/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/roles/${id}`);
    return response.data;
  },

  updateRolePermissions: async (
    id: number,
    permissions: number[]
  ): Promise<{ message: string }> => {
    const response = await api.patch(`/admin/roles/${id}/permissions`, { permissions });
    return response.data;
  },

  // Permissions
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/admin/permissions');
    return response.data;
  },
};

export default api;
