import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
} from '../types';
import {
  apiLogin,
  apiRegister,
  apiGetCurrentUser,
  type LoginResponse,
} from '../services/api';

interface AuthStore extends AuthState {
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

// Map backend /api/auth/me response to frontend User
function mapBackendUserToFrontend(backend: {
  id: number;
  email: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
}): User {
  return {
    id: backend.id.toString(),
    email: backend.email,
    name: backend.full_name ?? backend.email,
    role: (backend.role as User['role']) || 'student',
    avatar: undefined,
    enrolledCourses: [],
    progress: {},
    achievements: [],
    createdAt: new Date(),
    lastLogin: new Date(),
  };
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setHasHydrated: (hasHydrated: boolean) => {
        set({ hasHydrated });
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const loginResp: LoginResponse = await apiLogin(
            credentials.email,
            credentials.password,
          );
          const token = loginResp.access_token;

          const me = await apiGetCurrentUser(token);
          const user = mapBackendUserToFrontend(me);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (err: any) {
          const message =
            typeof err?.message === 'string'
              ? err.message
              : 'Login failed. Please check your credentials.';
          set({
            error: message,
            isLoading: false,
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          await apiRegister({
            email: data.email,
            full_name: data.name,
            password: data.password,
            role: data.role,
          });

          const success = await get().login({
            email: data.email,
            password: data.password,
          });

          if (!success) {
            set({
              isLoading: false,
              error: 'Registration succeeded, but auto-login failed.',
            });
            return false;
          }

          set({ isLoading: false });
          return true;
        } catch (err: any) {
          const message =
            typeof err?.message === 'string'
              ? err.message
              : 'Registration failed. Please try again.';
          set({
            error: message,
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Role-based helpers
export const useIsStudent = () => {
  const user = useAuth((s) => s.user);
  return user?.role === 'student';
};

export const useIsInstructor = () => {
  const user = useAuth((s) => s.user);
  return user?.role === 'instructor';
};

export const useIsAdmin = () => {
  const user = useAuth((s) => s.user);
  return user?.role === 'admin';
};
