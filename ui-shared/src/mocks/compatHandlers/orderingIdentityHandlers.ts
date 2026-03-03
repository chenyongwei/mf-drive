import { http } from 'msw';
import {
  compatState,
  currentUser,
  nextId,
} from '../compatState';
import { json } from './commonResponseBuilders';

export const orderingIdentityHandlers = [
  http.get('/api/ordering/orders', () =>
    json({
      orders: [
        { id: 'ord-1001', customer: 'ACME', status: 'pending', total: 12800 },
        { id: 'ord-1002', customer: 'Globex', status: 'in_production', total: 9800 },
      ],
    })),

  http.get('/api/ordering/admin/summary', () =>
    json({
      activeOrders: 2,
      delayedOrders: 0,
      completionRate: 0.92,
    })),

  http.get('/api/identity/me', () => {
    const user = currentUser();
    if (!user) return json({ error: 'Not authenticated' }, 401);
    return json({
      id: `u-${user.id}`,
      email: user.email,
      name: user.email.split('@')[0],
      roles: user.adminRole ? [user.adminRole] : ['user'],
    });
  }),

  http.post('/api/identity/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    const email = String(body.email ?? 'operator@example.com').toLowerCase();
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
    compatState.activeUserId = user.id;
    return json({
      token: `identity-token-${user.id}`,
      user: {
        id: `u-${user.id}`,
        email: user.email,
        name: user.email.split('@')[0],
        roles: user.adminRole ? [user.adminRole] : ['user'],
      },
    });
  }),
];
