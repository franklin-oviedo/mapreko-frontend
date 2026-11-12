# Despliegue

## Cloudflare Pages

Crea un proyecto Pages conectado a este repositorio y a la rama `main`. Usa la raiz del repositorio, el comando de compilacion `npm ci && npm run build` y el directorio de salida `dist/mapreko/browser` (tambien indicado en `wrangler.toml`).

Despues de crear el proyecto, configura en **Settings > Variables and Secrets > Production**:

- `API_ORIGIN`: origen HTTPS del servicio Render, por ejemplo `https://mapreko-backend.onrender.com` (sin `/` al final ni rutas).

La funcion `functions/api/_middleware.ts` envia las solicitudes `/api/*` al backend bajo el mismo origen de la interfaz. Asi se conservan el callback OAuth y las cookies HttpOnly; no publiques la interfaz en GitHub Pages sin un proxy equivalente.

## Dominio y Google OAuth

El origen de Pages sera algo como `https://mapreko-frontend.pages.dev`. Usa exactamente ese origen, sin barra final, en `FRONTEND_ORIGIN` del backend. Registra como URI de redireccion autorizada de Google:

`https://mapreko-frontend.pages.dev/api/auth/google/callback`

Sustituye el dominio de ejemplo por el dominio real de Pages despues de crear el proyecto. Configura tambien `GOOGLE_REDIRECT_URI` del backend con esa URI exacta.
