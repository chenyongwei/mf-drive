import api from './api/client';
import type {
  Team,
  TeamMember,
  CreateTeamRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  UpdateMemberPermissionsRequest,
  PermissionInfo,
  DatabaseSizeInfo,
} from '../types/auth';

/**
 * Create a new team
 */
export const createTeam = async (request: CreateTeamRequest): Promise<Team> => {
  const response = await api.post<{ team: Team }>('/teams', request);
  return response.data.team;
};

/**
 * Get all teams for current user
 */
export const getTeams = async (): Promise<Team[]> => {
  const response = await api.get<{ teams: Team[] }>('/teams');
  return response.data.teams;
};

/**
 * Get team details
 */
export const getTeam = async (teamId: number): Promise<Team> => {
  const response = await api.get<{ team: Team }>(`/teams/${teamId}`);
  return response.data.team;
};

/**
 * Invite member to team
 */
export const inviteMember = async (teamId: number, request: InviteMemberRequest): Promise<void> => {
  await api.post(`/teams/${teamId}/invite`, request);
};

/**
 * Get team members
 */
export const getTeamMembers = async (teamId: number): Promise<TeamMember[]> => {
  const response = await api.get<{ members: TeamMember[] }>(`/teams/${teamId}/members`);
  return response.data.members;
};

/**
 * Remove team member
 */
export const removeMember = async (teamId: number, memberId: number): Promise<void> => {
  await api.delete(`/teams/${teamId}/members/${memberId}`);
};

/**
 * Update member role
 */
export const updateMemberRole = async (
  teamId: number,
  memberId: number,
  request: UpdateMemberRoleRequest
): Promise<void> => {
  await api.put(`/team-management/${teamId}/members/${memberId}/role`, request);
};

/**
 * Get member permissions
 */
export const getMemberPermissions = async (
  teamId: number,
  memberId: number
): Promise<{ memberId: number; role: string; permissions: string[] }> => {
  const response = await api.get(`/team-management/${teamId}/members/${memberId}/permissions`);
  return response.data;
};

/**
 * Update member permissions
 */
export const updateMemberPermissions = async (
  teamId: number,
  memberId: number,
  request: UpdateMemberPermissionsRequest
): Promise<void> => {
  await api.put(`/team-management/${teamId}/members/${memberId}/permissions`, request);
};

/**
 * Get all available permissions
 */
export const getPermissionsList = async (): Promise<PermissionInfo[]> => {
  const response = await api.get<{ permissions: PermissionInfo[] }>('/team-management/permissions/list');
  return response.data.permissions;
};

/**
 * Get team database usage
 */
export const getTeamUsage = async (teamId: number): Promise<DatabaseSizeInfo> => {
  const response = await api.get<{ usage: DatabaseSizeInfo }>(`/team-management/${teamId}/usage`);
  return response.data.usage;
};

/**
 * Switch workspace
 */
export const switchWorkspace = async (workspaceType: 'personal' | 'team', teamId?: number): Promise<{ token: string }> => {
  const response = await api.post<{ token: string }>('/workspace/switch', {
    workspaceType,
    teamId,
  });
  return response.data;
};

/**
 * Get current workspace info
 */
export const getCurrentWorkspace = async (): Promise<{
  type: 'personal' | 'team';
  team?: Team;
}> => {
  const response = await api.get('/workspace/current');
  return response.data;
};
