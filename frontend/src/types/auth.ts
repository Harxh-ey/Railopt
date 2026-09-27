export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ENGINEERING_ADMIN' | 'TRACTION_ADMIN' | 'SNT_ADMIN' | 'OPERATIONS_VIEWER';
  department_id: string | null;
  department_name: string | null;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (...roles: string[]) => boolean;
  canWrite: (dept?: string) => boolean;
  isReadOnly: () => boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
