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

export const adminUserHandlers = [
  http.get('/api/admin/users', ({ request }) => {
    const url = parseUrl(request);
    const page = toNumber(url.searchParams.get('page'), 1);
    const limit = toNumber(url.searchParams.get('limit'), 20);
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const status = (url.searchParams.get('status') ?? 'all').trim();

    let users = [...compatState.users];
    if (search) users = users.filter((user) => user.email.includes(search));
    if (status === 'active') users = users.filter((user) => user.isActive);
    if (status === 'inactive') users = users.filter((user) => !user.isActive);

    const pagination = getPagination(users.length, page, limit);
    const start = (pagination.page - 1) * pagination.limit;
    const slice = users.slice(start, start + pagination.limit);

    return json({
      success: true,
      users: slice.map((user) => ({
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        teamCount: compatState.teams.filter((team) => team.memberIds.includes(user.id)).length,
        adminRole: user.adminRole,
      })),
      pagination,
    });
  }),

  http.get('/api/admin/users/:userId', ({ params }) => {
    const userId = Number(params.userId);
    const user = compatState.users.find((item) => item.id === userId);
    if (!user) return json({ success: false, error: 'user not found' }, 404);

    const teams = compatState.teams
      .filter((team) => team.memberIds.includes(user.id))
      .map((team) => ({
        id: team.id,
        name: team.name,
        teamCode: team.teamCode,
        role: team.ownerId === user.id ? 'owner' : 'member',
        joinedAt: team.createdAt,
      }));

    return json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        teamCount: teams.length,
        adminRole: user.adminRole,
        teams,
        database: {
          userId: user.id,
          dbName: `user_${user.id}`,
          sizeLimitMB: 512,
          currentSizeMB: 76,
        },
      },
    });
  }),

  http.put('/api/admin/users/:userId/status', async ({ params, request }) => {
    const userId = Number(params.userId);
    const user = compatState.users.find((item) => item.id === userId);
    if (!user) return json({ success: false, error: 'user not found' }, 404);

    const body = (await request.json()) as { isActive?: boolean };
    user.isActive = Boolean(body.isActive);
    recordActivity(user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'user', user.id);
    return json({ success: true, message: 'updated' });
  }),

  http.put('/api/admin/users/:userId/role', async ({ params, request }) => {
    const userId = Number(params.userId);
    const user = compatState.users.find((item) => item.id === userId);
    if (!user) return json({ success: false, error: 'user not found' }, 404);

    const body = (await request.json()) as { role?: 'super_admin' | 'admin' | null };
    user.adminRole = body.role ?? null;
    recordActivity('UPDATE_USER_ROLE', 'user', user.id);
    return json({ success: true, message: 'updated' });
  }),

  http.delete('/api/admin/users/:userId', ({ params }) => {
    const userId = Number(params.userId);
    compatState.users = compatState.users.filter((item) => item.id !== userId);
    compatState.teams.forEach((team) => {
      team.memberIds = team.memberIds.filter((id) => id !== userId || id === team.ownerId);
    });
    recordActivity('DELETE_USER', 'user', userId);
    return json({ success: true, message: 'deleted' });
  }),

  http.get('/api/admin/users/:userId/activity', ({ params }) => {
    const userId = Number(params.userId);
    const user = compatState.users.find((item) => item.id === userId);
    const activities = compatState.activities.filter((item) => item.user_email === user?.email);
    return json({
      success: true,
      activities,
      pagination: getPagination(activities.length, 1, activities.length || 1),
    });
  }),
];
