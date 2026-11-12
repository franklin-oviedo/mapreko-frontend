# Despliegue

## Cloudflare Workers (configuracion predeterminada)

El repositorio admite **Workers Builds** con `npx wrangler deploy`. `wrangler.toml` define el punto de entrada `worker.ts`, los archivos estaticos de Angular y el fallback de SPA para rutas como `/login` y `/app`.

En **Workers & Pages**, conecta este repositorio a un Worker y configura:

- Rama de produccion: `main`.
- Directorio raiz: raiz del repositorio.
- Build command: `npm ci --include=dev && npm run build`.
- Deploy command: `npx wrangler deploy`.
- Variable de compilacion: `NODE_VERSION=24.15.0`.

Si el proyecto ya existe, conserva su nombre y usa el mismo en el campo `name` de `wrangler.toml`, o indica `--name=<nombre-del-worker>` en el comando de despliegue.

En **Settings > Variables and Secrets**, configura la variable de ejecucion:

- `API_ORIGIN`: origen HTTPS del servicio Render, por ejemplo `https://mapreko-backend.onrender.com` (sin `/` al final ni rutas).

No basta con definir `API_ORIGIN` como variable del proceso de compilacion: debe estar disponible en el Worker en ejecucion. `keep_vars = true` conserva las variables configuradas en el panel al desplegar con Wrangler. Guarda la configuracion y vuelve a desplegar. La URL real se muestra en **Domains & Routes**, normalmente `https://mapreko-frontend.<subdominio-cuenta>.workers.dev`.

El Worker envia `/api` y `/api/*` a Render antes de servir los archivos de Angular. Reutiliza el proxy de `functions/api/_middleware.ts`, que conserva el callback OAuth y las cookies HttpOnly bajo el mismo origen. No publiques la interfaz en GitHub Pages sin un proxy equivalente.

El proxy devuelve las redirecciones OAuth al navegador sin seguirlas desde Cloudflare, conservando las cookies de inicio de sesion. Puedes comprobar este comportamiento con `node --test test/api-proxy.test.mjs` usando Node 24.15 o superior.

## Cloudflare Pages (alternativa manual)

Si ya tienes un proyecto Pages, se conserva su funcion proxy. Despues de compilar y autenticarte con Cloudflare, publica con la configuracion separada:

`npx wrangler pages deploy dist/mapreko/browser --config=wrangler.pages.toml --project-name=mapreko-frontend`

Configura `API_ORIGIN` en las variables de ejecucion del proyecto Pages. No uses el `wrangler.toml` predeterminado para este despliegue: ahora corresponde a Workers.

## Dominio y Google OAuth

Usa exactamente el origen publico del frontend (Workers, Pages o dominio propio), sin barra final, en `FRONTEND_ORIGIN` del backend. Configura `GOOGLE_REDIRECT_URI` como `<origen-del-frontend>/api/auth/google/callback` y registra esa misma URI como redireccion autorizada en Google Cloud.

Si cambias de Pages a Workers, actualiza ambos valores en Render y la configuracion de Google. No uses la URL de Render como callback: el navegador debe recibir las cookies desde el origen del frontend.
