import { onRequest } from './functions/api/_middleware.ts';

interface Environment {
  API_ORIGIN: string;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  fetch(request: Request, env: Environment): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return onRequest({ request, env });
    }

    return env.ASSETS.fetch(request);
  },
};
