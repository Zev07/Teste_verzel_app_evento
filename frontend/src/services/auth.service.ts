import { api } from './api';
import { AuthResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string, role: 'CLIENT' | 'ORGANIZER'): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', { name, email, password, role });
    return response.data;
  }
};