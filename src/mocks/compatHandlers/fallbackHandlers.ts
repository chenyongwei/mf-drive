import { http } from 'msw';
import { json, parseUrl } from './commonResponseBuilders';

export const fallbackHandlers = [
  http.all(/\/api\/.*/, ({ request }) => {
    const url = parseUrl(request);
    return json({
      success: true,
      message: 'compat fallback response',
      path: url.pathname,
      method: request.method,
    });
  }),
];
