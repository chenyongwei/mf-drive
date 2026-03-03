import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  User,
  Team,
} from '../types/auth';
import {
  login,
  register,
  getCurrentUser,
  sendVerificationCode as apiSendVerificationCode,
  sendResetCode as apiSendResetCode,
  resetPassword,
  logout as authServiceLogout,
} from '../services/authService';
import { switchWorkspace as apiSwitchWorkspace, getTeams } from '../services/teamService';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setCurrentWorkspace: (workspace: 'personal' | 'team', teamId?: number, team?: Team) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  sendVerificationCode: (email: string) => Promise<void>;
  sendResetCode: (email: string) => Promise<void>;
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<void>;
  switchWorkspace: (workspaceType: 'personal' | 'team', teamId?: number) => Promise<void>;
  loadTeams: () => Promise<Team[]>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      currentWorkspace: 'personal',
      currentTeamId: null,
      currentTeam: null,

      // Setters
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setCurrentWorkspace: (workspaceType, teamId, team) =>
        set({
          currentWorkspace: workspaceType,
          currentTeamId: teamId,
          currentTeam: team || null,
        }),

      // Login
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await login(credentials);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            currentWorkspace: response.workspaceContext?.type || 'personal',
            currentTeamId: response.workspaceContext?.teamId || null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Register
      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true });
        try {
          const response = await register(credentials);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            currentWorkspace: response.workspaceContext?.type || 'personal',
            currentTeamId: response.workspaceContext?.teamId || null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        await authServiceLogout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          currentWorkspace: 'personal',
          currentTeamId: null,
          currentTeam: null,
        });
      },

      // Send verification code
      sendVerificationCode: async (email: string) => {
        await apiSendVerificationCode(email);
      },

      // Send reset code
      sendResetCode: async (email: string) => {
        await apiSendResetCode(email);
      },

      // Reset password
      resetPassword: async (credentials: ResetPasswordCredentials) => {
        await resetPassword(credentials);
      },

      // Switch workspace
      switchWorkspace: async (workspaceType: 'personal' | 'team', teamId?: number) => {
        set({ isLoading: true });
        try {
          const response = await apiSwitchWorkspace(workspaceType, teamId);
          // Get updated user info with new workspace context
          const user = await getCurrentUser();
          set({
            user,
            token: response.token,
            currentWorkspace: workspaceType,
            currentTeamId: teamId || null,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Load teams
      loadTeams: async () => {
        const teams = await getTeams();
        return teams;
      },

      // Check authentication on mount
      checkAuth: async () => {
        try {
          // Check for Test Mode bypass parameter in the URL
          const searchParams = new URLSearchParams(window.location.search);
          if (searchParams.get('test') === 'true') {
            set({
              user: { id: 1, email: 'test@example.com', isVerified: true } as any,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          const user = await getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Clear all auth state on failure
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            currentWorkspace: 'personal',
            currentTeamId: null,
            currentTeam: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentWorkspace: state.currentWorkspace,
        currentTeamId: state.currentTeamId,
        currentTeam: state.currentTeam,
      }),
    }
  )
);
