import { authApi, setToken, removeToken } from './client';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export const authService = {
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<void> {
    await authApi.post('/auth/register', data);
  },

  async verify(token: string): Promise<void> {
    await authApi.get('/auth/verify', { params: { token } });
  },

  async getMe(): Promise<UserInfo> {
    const response = await authApi.get<UserInfo>('/auth/me');
    return response.data;
  },

  async getCurrentUser(): Promise<UserInfo> {
    const response = await authApi.get<UserInfo>('/users/current');
    return response.data;
  },

  logout(): void {
    removeToken();
  },
};
