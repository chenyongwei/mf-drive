import { useAuthStore } from '../store/authStore';

/**
 * Convenience hook for auth state and actions
 */
export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    currentWorkspace,
    currentTeamId,
    currentTeam,
    login,
    register,
    logout,
    sendVerificationCode,
    sendResetCode,
    resetPassword,
    switchWorkspace,
    loadTeams,
    checkAuth,
  } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    currentWorkspace,
    currentTeamId,
    currentTeam,
    login,
    register,
    logout,
    sendVerificationCode,
    sendResetCode,
    resetPassword,
    switchWorkspace,
    loadTeams,
    checkAuth,
  };
};
