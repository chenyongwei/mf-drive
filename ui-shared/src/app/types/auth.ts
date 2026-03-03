import type { User, Team as BaseTeam, TeamRole, PermissionKey, WorkspaceContext } from '@dxf-fix/shared';

/**
 * Team with additional properties from API responses
 */
export interface Team extends BaseTeam {
  memberCount?: number;
  role?: TeamRole;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentWorkspace: WorkspaceType;
  currentTeamId: number | null;
  currentTeam: Team | null;
}

/**
 * Workspace type
 */
export type WorkspaceType = 'personal' | 'team';

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register credentials
 */
export interface RegisterCredentials {
  email: string;
  verificationCode: string;
  password: string;
}

/**
 * Password reset credentials
 */
export interface ResetPasswordCredentials {
  email: string;
  resetCode: string;
  newPassword: string;
}

/**
 * Create team request
 */
export interface CreateTeamRequest {
  name: string;
}

/**
 * Invite member request
 */
export interface InviteMemberRequest {
  email: string;
  role: TeamRole;
}

/**
 * Update member role request
 */
export interface UpdateMemberRoleRequest {
  role: TeamRole;
}

/**
 * Update member permissions request
 */
export interface UpdateMemberPermissionsRequest {
  permissions: PermissionKey[];
}

/**
 * Switch workspace request
 */
export interface SwitchWorkspaceRequest {
  workspaceType: WorkspaceType;
  teamId?: number;
}

/**
 * Auth response from API
 */
export interface AuthResponse {
  token: string;
  user: User;
  workspaceContext?: {
    type: WorkspaceType;
    teamId?: number;
  };
}

/**
 * Team member with role
 */
export interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  role: TeamRole;
  user: {
    id: number;
    email: string;
  };
  permissions?: PermissionKey[];
  createdAt: Date;
}

/**
 * Permission with description
 */
export interface PermissionInfo {
  key: PermissionKey;
  description: string;
}

/**
 * Database size info
 */
export interface DatabaseSizeInfo {
  currentSizeMB: number;
  sizeLimitMB: number;
  usagePercent: number;
}

// Re-export shared types for convenience
export type { User, Team, TeamRole, PermissionKey, WorkspaceContext };
