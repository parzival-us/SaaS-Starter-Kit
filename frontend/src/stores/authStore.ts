import { create } from 'zustand';
import { apiPost, apiGet, apiPatch } from '@/lib/api';
import type { User, TokenResponse } from '@/types';

interface AuthState {
  user: User | null;
  tokens: { access_token: string; refresh_token: string } | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Computed
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: { full_name?: string; password?: string }) => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isLoading: false,
  isInitialized: false,

  isAuthenticated: () => !!get().user && !!get().tokens,
  isAdmin: () => get().user?.is_admin ?? false,

  initialize: async () => {
    try {
      const tokensRaw = localStorage.getItem('auth-tokens');
      const userRaw = localStorage.getItem('auth-user');

      if (tokensRaw && userRaw) {
        const tokens = JSON.parse(tokensRaw);
        const user = JSON.parse(userRaw);
        set({ tokens, user });

        // Verify token is still valid by fetching current user
        try {
          const currentUser = await apiGet<User>('/auth/me');
          set({ user: currentUser });
          localStorage.setItem('auth-user', JSON.stringify(currentUser));
        } catch {
          // Token invalid, clear
          localStorage.removeItem('auth-tokens');
          localStorage.removeItem('auth-user');
          set({ user: null, tokens: null });
        }
      }
    } catch {
      localStorage.removeItem('auth-tokens');
      localStorage.removeItem('auth-user');
      set({ user: null, tokens: null });
    } finally {
      set({ isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const tokenResponse = await apiPost<TokenResponse>('/auth/login', {
        email,
        password,
      });

      const tokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
      };

      localStorage.setItem('auth-tokens', JSON.stringify(tokens));
      set({ tokens });

      const user = await apiGet<User>('/auth/me');
      localStorage.setItem('auth-user', JSON.stringify(user));
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true });
    try {
      const tokenResponse = await apiPost<TokenResponse>('/auth/register', {
        email,
        password,
        full_name: fullName,
      });

      const tokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
      };

      localStorage.setItem('auth-tokens', JSON.stringify(tokens));
      set({ tokens });

      const user = await apiGet<User>('/auth/me');
      localStorage.setItem('auth-user', JSON.stringify(user));
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: () => {
    window.location.href = '/api/v1/auth/google';
  },

  logout: () => {
    localStorage.removeItem('auth-tokens');
    localStorage.removeItem('auth-user');
    set({ user: null, tokens: null });
    window.location.href = '/login';
  },

  refreshToken: async () => {
    const { tokens } = get();
    if (!tokens?.refresh_token) return;

    try {
      const tokenResponse = await apiPost<TokenResponse>('/auth/refresh', {
        refresh_token: tokens.refresh_token,
      });

      const newTokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
      };

      localStorage.setItem('auth-tokens', JSON.stringify(newTokens));
      set({ tokens: newTokens });
    } catch {
      get().logout();
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const updated = await apiPatch<User>('/auth/me', data);
      localStorage.setItem('auth-user', JSON.stringify(updated));
      set({ user: updated });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => {
    localStorage.setItem('auth-user', JSON.stringify(user));
    set({ user });
  },
}));
