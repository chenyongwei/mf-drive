/**
 * Admin API Service
 *
 * Service for admin-related API calls
 */

import api from './api';

// Types
export interface AdminUser {
  id: number;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  teamCount: number;
  adminRole: 'super_admin' | 'admin' | null;
}

export interface AdminUserDetail extends AdminUser {
  teams: Array<{
    id: number;
    name: string;
    teamCode: string;
    role: string;
    joinedAt: string;
  }>;
  database: {
    userId: number;
    dbName: string;
    sizeLimitMB: number;
    currentSizeMB: number;
  } | null;
}

export interface AdminTeam {
  id: number;
  teamCode: string;
  name: string;
  ownerId: number;
  ownerEmail: string;
  memberCount: number;
  storageUsed: number;
  storageLimit: number;
  storageUsagePercent: number;
  createdAt: string;
}

export interface AdminTeamDetail {
  id: number;
  teamCode: string;
  name: string;
  ownerId: number;
  ownerEmail: string;
  storageUsed: number;
  storageLimit: number;
  storageUsagePercent: number;
  createdAt: string;
  members: Array<{
    memberId: number;
    userId: number;
    role: string;
    joinedAt: string;
    email: string;
    isActive: boolean;
    isVerified: boolean;
    permissions: string[];
  }>;
  database: {
    teamId: number;
    dbName: string;
    sizeLimitMB: number;
    currentSizeMB: number;
  } | null;
}

export interface SystemOverview {
  users: {
    total_users: number;
    active_users: number;
    new_users_week: number;
    new_users_month: number;
  };
  teams: {
    total_teams: number;
    new_teams_week: number;
    new_teams_month: number;
  };
  storage: {
    totalStorageMB: number;
    totalStorageLimitMB: number;
    usagePercent: number;
  };
  admins: {
    total_admins: number;
    super_admins: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

// User Management APIs
export const adminApi = {
  // Get all users
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'all';
  }): Promise<{ success: boolean; users: AdminUser[]; pagination: PaginationInfo }> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get user details
  getUser: async (userId: number): Promise<{ success: boolean; user: AdminUserDetail }> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId: number, isActive: boolean): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  // Update user admin role
  updateUserRole: async (userId: number, role: 'super_admin' | 'admin' | null): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Get user activity
  getUserActivity: async (userId: number, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; activities: any[]; pagination: PaginationInfo }> => {
    const response = await api.get(`/admin/users/${userId}/activity`, { params });
    return response.data;
  },
};

// Team Management APIs
export const adminTeamsApi = {
  // Get all teams
  getTeams: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ success: boolean; teams: AdminTeam[]; pagination: PaginationInfo }> => {
    const response = await api.get('/admin/teams', { params });
    return response.data;
  },

  // Get team details
  getTeam: async (teamId: number): Promise<{ success: boolean; team: AdminTeamDetail }> => {
    const response = await api.get(`/admin/teams/${teamId}`);
    return response.data;
  },

  // Delete team
  deleteTeam: async (teamId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/teams/${teamId}`);
    return response.data;
  },

  // Get team members
  getTeamMembers: async (teamId: number): Promise<{ success: boolean; members: any[] }> => {
    const response = await api.get(`/admin/teams/${teamId}/members`);
    return response.data;
  },

  // Update team storage limit
  updateTeamStorage: async (teamId: number, sizeLimitMB: number): Promise<{ success: boolean; message: string; sizeLimitMB: number }> => {
    const response = await api.put(`/admin/teams/${teamId}/storage`, { sizeLimitMB });
    return response.data;
  },
};

// Statistics APIs
export const adminStatsApi = {
  // Get system overview
  getOverview: async (): Promise<{ success: boolean; overview: SystemOverview }> => {
    const response = await api.get('/admin/stats/overview');
    return response.data;
  },

  // Get user statistics
  getUserStats: async (days: number = 30): Promise<{ success: boolean; growth: any[]; cumulative: any[] }> => {
    const response = await api.get('/admin/stats/users', { params: { days } });
    return response.data;
  },

  // Get storage statistics
  getStorageStats: async (): Promise<{ success: boolean; topUsers: any[]; topTeams: any[]; distribution: any }> => {
    const response = await api.get('/admin/stats/storage');
    return response.data;
  },

  // Get team statistics
  getTeamStats: async (days: number = 30): Promise<{ success: boolean; creation: any[]; sizeDistribution: any[]; storageWarning: any[] }> => {
    const response = await api.get('/admin/stats/teams', { params: { days } });
    return response.data;
  },

  // Get recent activity
  getActivity: async (limit: number = 50): Promise<{ success: boolean; activities: any[]; summary: any[] }> => {
    const response = await api.get('/admin/stats/activity', { params: { limit } });
    return response.data;
  },
};
