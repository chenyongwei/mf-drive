import { http } from 'msw';
import {
  compatState,
  nextId,
  recordActivity,
  requireUser,
} from '../compatState';
import { json } from './commonResponseBuilders';

export const authWorkspaceHandlers = [
  http.post('/api/auth/send-verification-code', () => json({ success: true })),
  http.post('/api/auth/send-reset-code', () => json({ success: true })),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '123456');
    if (!email) {
      return json({ error: 'email is required' }, 400);
    }

    let user = compatState.users.find((item) => item.email === email);
    if (!user) {
      user = {
        id: nextId('user'),
        email,
        password,
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        adminRole: null,
      };
      compatState.users.push(user);
      recordActivity('REGISTER_USER', 'user', user.id);
    }

    compatState.activeUserId = user.id;

    return json({
      success: true,
      token: `mock-token-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.adminRole ?? 'user',
      },
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    let user = compatState.users.find((item) => item.email === email);
    if (!user) {
      user = {
        id: nextId('user'),
        email: email || `user${Date.now()}@example.com`,
        password: password || '123456',
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        adminRole: null,
      };
      compatState.users.push(user);
    }

    compatState.activeUserId = user.id;
    recordActivity('LOGIN', 'user', user.id);

    return json({
      success: true,
      token: `mock-token-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.adminRole ?? 'user',
      },
    });
  }),

  http.post('/api/auth/reset-password', () => json({ success: true })),

  http.post('/api/auth/logout', () => {
    compatState.activeUserId = 0;
    return json({ success: true });
  }),

  http.get('/api/auth/me', () => {
    const auth = requireUser();
    if (auth.error) return json(auth.body, auth.status);

    const user = auth.user;
    return json({
      id: user.id,
      email: user.email,
      role: user.adminRole ?? 'user',
      workspace: compatState.activeWorkspace,
    });
  }),

  http.get('/api/workspace/current', () => {
    const auth = requireUser();
    if (auth.error) return json(auth.body, auth.status);

    if (compatState.activeWorkspace.type === 'team') {
      const team = compatState.teams.find((item) => item.id === compatState.activeWorkspace.teamId);
      return json({
        type: 'team',
        team: team
          ? {
              id: team.id,
              name: team.name,
              teamCode: team.teamCode,
              role: team.ownerId === auth.user.id ? 'owner' : 'member',
            }
          : undefined,
      });
    }

    return json({ type: 'personal' });
  }),

  http.post('/api/workspace/switch', async ({ request }) => {
    const auth = requireUser();
    if (auth.error) return json(auth.body, auth.status);

    const body = (await request.json()) as { workspaceType?: 'personal' | 'team'; teamId?: number };
    if (body.workspaceType === 'team' && body.teamId) {
      compatState.activeWorkspace = { type: 'team', teamId: body.teamId };
    } else {
      compatState.activeWorkspace = { type: 'personal' };
    }

    return json({ token: `workspace-token-${Date.now()}` });
  }),
];
