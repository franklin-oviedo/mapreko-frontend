# Despliegue

## Cloudflare Pages

Crea un proyecto **Pages**, no un Worker, conectado a este repositorio y a la rama `main`: **Workers & Pages > Create application > Pages > Connect to Git**. Usa la raiz del repositorio, el comando de compilacion `npm ci --include=dev && npm run build` y el directorio de salida `dist/mapreko/browser` (tambien indicado en `wrangler.toml`). Configura `NODE_VERSION=24.15.0` en las variables de compilacion.

Pages publica el resultado automaticamente: no configures `npx wrangler deploy` como comando de despliegue. Si ves un campo obligatorio **Deploy command**, estas usando Workers Builds; crea un proyecto Pages en su lugar. El error `Missing entry-point to Worker script or to assets directory` indica esa diferencia, no que falte un archivo de Angular.

Para publicar manualmente desde la terminal, usa `npx wrangler pages deploy dist/mapreko/browser --project-name=mapreko-frontend` despues de compilar y autenticarte con Cloudflare. No uses `wrangler deploy` para este repositorio.

Despues de crear el proyecto, configura en **Settings > Variables and Secrets > Production**:

- `API_ORIGIN`: origen HTTPS del servicio Render, por ejemplo `https://mapreko-backend.onrender.com` (sin `/` al final ni rutas).

La funcion `functions/api/_middleware.ts` envia las solicitudes `/api/*` al backend bajo el mismo origen de la interfaz. Asi se conservan el callback OAuth y las cookies HttpOnly; no publiques la interfaz en GitHub Pages sin un proxy equivalente.

El proxy devuelve las redirecciones OAuth al navegador sin seguirlas desde Cloudflare, conservando las cookies de inicio de sesion. Puedes comprobar este comportamiento con `node --test test/api-proxy.test.mjs` usando Node 24.15 o superior.

## Dominio y Google OAuth

El origen de Pages sera algo como `https://mapreko-frontend.pages.dev`. Usa exactamente ese origen, sin barra final, en `FRONTEND_ORIGIN` del backend. Registra como URI de redireccion autorizada de Google:

`https://mapreko-frontend.pages.dev/api/auth/google/callback`

Sustituye el dominio de ejemplo por el dominio real de Pages despues de crear el proyecto. Configura tambien `GOOGLE_REDIRECT_URI` del backend con esa URI exacta.
