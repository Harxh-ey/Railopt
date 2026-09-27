import { LoginResponse, User } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Login failed [${res.status}]: ${errorText || res.statusText}`);
    }
    return res.json();
  },

  logout: async (token: string): Promise<void> => {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).catch(console.error); // Ignore errors on logout
  },

  getMe: async (token: string): Promise<User> => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Unauthorized');
    }
    return res.json();
  }
};
