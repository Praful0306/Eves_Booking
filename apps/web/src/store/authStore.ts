import { create } from 'zustand';
import { api } from '@/lib/api';
import { resetSocket } from '@/lib/socket';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  init: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('eves_token');
    const userStr = localStorage.getItem('eves_user');
    if (token && userStr) {
      try {
        set({ user: JSON.parse(userStr), token, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('eves_token', token);
    localStorage.setItem('eves_user', JSON.stringify(user));
    set({ user, token });
  },

  register: async (name, email, password, phone) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    const { user, token } = res.data.data;
    localStorage.setItem('eves_token', token);
    localStorage.setItem('eves_user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('eves_token');
    localStorage.removeItem('eves_user');
    resetSocket();
    set({ user: null, token: null });
  },
}));
