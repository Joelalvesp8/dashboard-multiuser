export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  role_id: number;
  role_name?: string;
  is_active: boolean;
  created_at: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: Permission[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role_id?: number;
}

export interface DashboardData {
  data: any[];
  analysis: {
    totalRecords: number;
    fields: string[];
    numericFields: string[];
    statistics: {
      [key: string]: {
        count: number;
        sum: number;
        avg: number;
        min: number;
        max: number;
      };
    };
  };
  metadata: {
    totalRecords: number;
    fields: string[];
    lastUpdate: string;
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
}
