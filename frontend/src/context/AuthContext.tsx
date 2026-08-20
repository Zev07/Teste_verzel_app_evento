import { createContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean; // <-- Adicionado de volta!
  login: (data: AuthResponse) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('@App:user');
    const storedToken = localStorage.getItem('@App:token');

    if (storedUser && storedUser !== "undefined" && storedToken && storedToken !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.warn("Cache corrompido identificado. Limpando...");
        localStorage.removeItem('@App:user');
        localStorage.removeItem('@App:token');
      }
    }
  }, []);

  const login = (response: AuthResponse) => {
    localStorage.setItem('@App:user', JSON.stringify(response.user));
    localStorage.setItem('@App:token', response.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('@App:user');
    localStorage.removeItem('@App:token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    // Transformamos o user em boolean usando !!user (se tiver user = true, se for null = false)
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};