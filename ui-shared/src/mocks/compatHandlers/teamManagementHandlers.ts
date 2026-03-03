import { http } from 'msw';
import {
  compatState,
  nextId,
  recordActivity,
  requireUser,
} from '../compatState';
import { json } from './commonResponseBuilders';

export const teamManagementHandlers = [
  http.get('/api/teams', () => {
    const auth = requireUser();
    if (auth.error) return json(auth.body, auth.status);

    const teams = compatState.teams
      .filter((team) => team.memberIds.includes(auth.user.id))
      .map((team) => ({
        id: team.id,
        name: team.name,
        teamCode: team.teamCode,
        role: team.ownerId === auth.user.id ? 'owner' : 'member',
        memberCount: team.memberIds.length,
        createdAt: team.createdAt,
      }));

    return json({ teams });
  }),

  http.post('/api/teams', async ({ request }) => {
    const auth = requireUser();
    if (auth.error) return json(auth.body, auth.status);

    const body = (await request.json()) as { name?: string };
    const id = nextId('team');
    const team = {
      id,
      name: String(body.name ?? `Team ${id}`),
      teamCode: `T${id}`,
      ownerId: auth.user.id,
      memberIds: [auth.user.id],
      createdAt: new Date().toISOString(),
      storageLimitMB: 1024,
      storageUsedMB: 0,
    };
    compatState.teams.push(team);
    recordActivity('CREATE_TEAM', 'team', team.id);

    return json({
      team: {
        id: team.id,
        name: team.name,
        teamCode: team.teamCode,
        role: 'owner',
      },
    });
  }),

  http.get('/api/teams/:teamId', ({ params }) => {
    const auth = requireUser();
    if (auth.error) return json(auth.body, auth.status);

    const teamId = Number(params.teamId);
    const team = compatState.teams.find((item) => item.id === teamId);
    if (!team) return json({ error: 'team not found' }, 404);

    return json({
      team: {
        id: team.id,
        name: team.name,
        teamCode: team.teamCode,
        role: team.ownerId === auth.user.id ? 'owner' : 'member',
      },
    });
  }),

  http.get('/api/teams/:teamId/members', ({ params }) => {
    const teamId = Number(params.teamId);
    const team = compatState.teams.find((item) => item.id === teamId);
    if (!team) return json({ members: [] });

    const members = team.memberIds.map((id) => {
      const user = compatState.users.find((candidate) => candidate.id === id);
      return {
        memberId: id,
        userId: id,
        email: user?.email ?? `user-${id}@example.com`,
        role: id === team.ownerId ? 'owner' : 'member',
        permissions: ['drawing:read', 'drawing:write', 'nesting:run'],
        joinedAt: team.createdAt,
        isActive: user?.isActive ?? true,
        isVerified: user?.isVerified ?? true,
      };
    });

    return json({ members });
  }),

  http.post('/api/teams/:teamId/invite', async ({ params, request }) => {
    const teamId = Number(params.teamId);
    const team = compatState.teams.find((item) => item.id === teamId);
    if (!team) return json({ error: 'team not found' }, 404);

    const body = (await request.json()) as { email?: string };
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!email) return json({ error: 'email required' }, 400);

    let user = compatState.users.find((item) => item.email === email);
    if (!user) {
      user = {
        id: nextId('user'),
        email,
        password: '123456',
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        adminRole: null,
      };
      compatState.users.push(user);
    }

    if (!team.memberIds.includes(user.id)) {
      team.memberIds.push(user.id);
      recordActivity('INVITE_MEMBER', 'team', team.id);
    }

    return json({ success: true });
  }),

  http.delete('/api/teams/:teamId/members/:memberId', ({ params }) => {
    const teamId = Number(params.teamId);
    const memberId = Number(params.memberId);
    const team = compatState.teams.find((item) => item.id === teamId);
    if (!team) return json({ error: 'team not found' }, 404);

    team.memberIds = team.memberIds.filter((id) => id !== memberId || id === team.ownerId);
    recordActivity('REMOVE_MEMBER', 'team', team.id);
    return json({ success: true });
  }),

  http.put('/api/team-management/:teamId/members/:memberId/role', () => json({ success: true })),

  http.get('/api/team-management/:teamId/members/:memberId/permissions', ({ params }) =>
    json({
      memberId: Number(params.memberId),
      role: 'member',
      permissions: ['drawing:read', 'drawing:write', 'nesting:run'],
    })),

  http.put('/api/team-management/:teamId/members/:memberId/permissions', () => json({ success: true })),

  http.get('/api/team-management/permissions/list', () =>
    json({
      permissions: [
        { key: 'drawing:read', label: 'View Drawings' },
        { key: 'drawing:write', label: 'Edit Drawings' },
        { key: 'nesting:run', label: 'Run Nesting' },
        { key: 'admin:read', label: 'View Admin' },
      ],
    })),

  http.get('/api/team-management/:teamId/usage', ({ params }) => {
    const teamId = Number(params.teamId);
    const team = compatState.teams.find((item) => item.id === teamId);
    if (!team) return json({ usage: null }, 404);

    return json({
      usage: {
        currentSizeMB: team.storageUsedMB,
        sizeLimitMB: team.storageLimitMB,
        usagePercent: (team.storageUsedMB / team.storageLimitMB) * 100,
      },
    });
  }),
];
