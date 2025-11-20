export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role_id: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: Date;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at: Date;
}

export interface UserWithRole extends Omit<User, 'password'> {
  role_name: string;
  role_description: string;
  permissions: Permission[];
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role_id: number;
    permissions: string[];
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role_id?: number;
}

export interface GoogleSheetData {
  headers: string[];
  rows: any[][];
}
