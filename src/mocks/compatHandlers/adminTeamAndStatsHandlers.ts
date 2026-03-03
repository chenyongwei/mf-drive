import { http } from 'msw';
import {
  compatState,
  recordActivity,
} from '../compatState';
import {
  getPagination,
  json,
  parseUrl,
  toNumber,
} from './commonResponseBuilders';

export const adminTeamAndStatsHandlers = [
  http.get('/api/admin/teams', ({ request }) => {
    const url = parseUrl(request);
    const page = toNumber(url.searchParams.get('page'), 1);
    const limit = toNumber(url.searchParams.get('limit'), 20);
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();

    let teams = [...compatState.teams];
    if (search) {
      teams = teams.filter(
        (team) =>
          team.name.toLowerCase().includes(search) ||
          team.teamCode.toLowerCase().includes(search),
      );
    }

    const pagination = getPagination(teams.length, page, limit);
    const start = (pagination.page - 1) * pagination.limit;
    const slice = teams.slice(start, start + pagination.limit);

    return json({
      success: true,
      teams: slice.map((team) => {
        const owner = compatState.users.find((user) => user.id === team.ownerId);
        return {
          id: team.id,
          teamCode: team.teamCode,
          name: team.name,
          ownerId: team.ownerId,
          ownerEmail: owner?.email ?? 'owner@example.com',
          memberCount: team.memberIds.length,
          storageUsed: team.storageUsedMB,
          storageLimit: team.storageLimitMB,
          storageUsagePercent: (team.storageUsedMB / team.storageLimitMB) * 100,
          createdAt: team.createdAt,
        };
      }),
      pagination,
    });
  }),

  http.get('/api/admin/teams/:teamId', ({ params }) => {
    const teamId = Number(params.teamId);
    const team = compatState.teams.find((item) => item.id === teamId);
    if (!team) return json({ success: false, error: 'team not found' }, 404);

    const owner = compatState.users.find((user) => user.id === team.ownerId);

    return json({
      success: true,
      team: {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        ownerId: team.ownerId,
        ownerEmail: owner?.email ?? 'owner@example.com',
        storageUsed: team.storageUsedMB,
        storageLimit: team.storageLimitMB,
        storageUsagePercent: (team.storageUsedMB / team.storageLimitMB) * 100,
        createdAt: team.createdAt,
        members: team.memberIds.map((memberId) => {
          const user = compatState.users.find((candidate) => candidate.id === memberId);
          return {
            memberId,
            userId: memberId,
            role: memberId === team.ownerId ? 'owner' : 'member',
            joinedAt: team.createdAt,
            email: user?.email ?? `user-${memberId}@example.com`,
            isActive: user?.isActive ?? true,
            isVerified: user?.isVerified ?? true,
            permissions: ['drawing:read', 'drawing:write', 'nesting:run'],
          };
        }),
        database: {
          teamId: team.id,
          dbName: `team_${team.id}`,
          sizeLimitMB: team.storageLimitMB,
          currentSizeMB: team.storageUsedMB,
        },
      },
    });
  }),

  http.delete('/api/admin/teams/:teamId', ({ params }) => {
    const teamId = Number(params.teamId);
    compatState.teams = compatState.teams.filter((team) => team.id !== teamId);
    recordActivity('DELETE_TEAM', 'team', teamId);
    return json({ success: true, message: 'deleted' });
  }),

  http.get('/api/admin/teams/:teamId/members', ({ params }) => {
    const teamId = Number(params.teamId);
    const team = compatState.teams.find((item) => item.id === teamId);
    if (!team) return json({ success: false, members: [] }, 404);

    return json({
      success: true,
      members: team.memberIds.map((memberId) => {
        const user = compatState.users.find((candidate) => candidate.id === memberId);
        return {
          memberId,
          userId: memberId,
          role: memberId === team.ownerId ? 'owner' : 'member',
          email: user?.email ?? `user-${memberId}@example.com`,
        };
      }),
    });
  }),

  http.put('/api/admin/teams/:teamId/storage', async ({ params, request }) => {
    const teamId = Number(params.teamId);
    const team = compatState.teams.find((item) => item.id === teamId);
    if (!team) return json({ success: false, error: 'team not found' }, 404);

    const body = (await request.json()) as { sizeLimitMB?: number };
    team.storageLimitMB = Math.max(1, Number(body.sizeLimitMB ?? team.storageLimitMB));
    return json({ success: true, message: 'updated', sizeLimitMB: team.storageLimitMB });
  }),

  http.get('/api/admin/stats/overview', () => {
    const totalUsers = compatState.users.length;
    const activeUsers = compatState.users.filter((item) => item.isActive).length;
    const totalTeams = compatState.teams.length;
    const totalStorage = compatState.teams.reduce((sum, item) => sum + item.storageUsedMB, 0);
    const totalLimit = compatState.teams.reduce((sum, item) => sum + item.storageLimitMB, 0);
    const adminCount = compatState.users.filter((item) => item.adminRole).length;
    const superAdminCount = compatState.users.filter((item) => item.adminRole === 'super_admin').length;

    return json({
      success: true,
      overview: {
        users: {
          total_users: totalUsers,
          active_users: activeUsers,
          new_users_week: 1,
          new_users_month: 2,
        },
        teams: {
          total_teams: totalTeams,
          new_teams_week: 1,
          new_teams_month: 1,
        },
        storage: {
          totalStorageMB: totalStorage,
          totalStorageLimitMB: totalLimit,
          usagePercent: totalLimit > 0 ? (totalStorage / totalLimit) * 100 : 0,
        },
        admins: {
          total_admins: adminCount,
          super_admins: superAdminCount,
        },
      },
    });
  }),

  http.get('/api/admin/stats/users', () => json({ success: true, growth: [], cumulative: [] })),
  http.get('/api/admin/stats/teams', () => json({ success: true, creation: [], sizeDistribution: [], storageWarning: [] })),

  http.get('/api/admin/stats/storage', () => {
    const topUsers = compatState.users.map((user) => ({
      id: user.id,
      email: user.email,
      current_db_size_mb: 80 + user.id * 10,
      size_limit_mb: 512,
      usage_percent: ((80 + user.id * 10) / 512) * 100,
    }));

    const topTeams = compatState.teams.map((team) => ({
      id: team.id,
      name: team.name,
      team_code: team.teamCode,
      current_db_size_mb: team.storageUsedMB,
      size_limit_mb: team.storageLimitMB,
      usage_percent: (team.storageUsedMB / team.storageLimitMB) * 100,
      member_count: team.memberIds.length,
    }));

    return json({
      success: true,
      topUsers,
      topTeams,
      distribution: {
        userDatabases: {
          count: compatState.users.length,
          total_mb: topUsers.reduce((sum, item) => sum + item.current_db_size_mb, 0),
          limit_mb: topUsers.reduce((sum, item) => sum + item.size_limit_mb, 0),
        },
        teamDatabases: {
          count: compatState.teams.length,
          total_mb: topTeams.reduce((sum, item) => sum + item.current_db_size_mb, 0),
          limit_mb: topTeams.reduce((sum, item) => sum + item.size_limit_mb, 0),
        },
      },
    });
  }),

  http.get('/api/admin/stats/activity', ({ request }) => {
    const url = parseUrl(request);
    const limit = toNumber(url.searchParams.get('limit'), 50);
    return json({
      success: true,
      activities: compatState.activities.slice(0, limit),
      summary: [],
    });
  }),
];
