interface Environment {
  API_ORIGIN: string;
}

interface PagesContext {
  request: Request;
  env: Environment;
}

export async function onRequest({ request, env }: PagesContext): Promise<Response> {
  const apiOrigin = new URL(env.API_ORIGIN);
  if (
    apiOrigin.protocol !== 'https:' ||
    apiOrigin.pathname !== '/' ||
    apiOrigin.search ||
    apiOrigin.hash ||
    apiOrigin.username ||
    apiOrigin.password
  ) {
    throw new Error('API_ORIGIN must be an HTTPS origin without a path.');
  }

  const destination = new URL(request.url);
  destination.protocol = apiOrigin.protocol;
  destination.host = apiOrigin.host;
  return fetch(new Request(destination, request), { redirect: 'manual' });
}
