# Mapreko

## Trabajo con frontend y backend

Abre [mapreko.code-workspace](./mapreko.code-workspace) en VS Code para trabajar
con ambos repositorios. El backend debe estar en la carpeta hermana
`..\mapreko-backend`.

Primero configura PostgreSQL y aplica las migraciones siguiendo el
[README del backend](../mapreko-backend/README.md). Luego ejecuta la tarea
**MAPREKO: iniciar ambos** desde **Terminal > Run Task**:

- Angular: `http://localhost:4200`.
- NestJS: `http://localhost:3000`.

Referencia de interfaz:
[prototipo MAPREKO en Figma](https://www.figma.com/design/oDmfB3J29wePUFrYRXWt8v/MAPREKO?node-id=0-1).
La interfaz implementa acceso Google, perfil, sesiones, resumen conectado,
planes de mantenimiento, calendario, guias de conocimiento y centro de ayuda.
Propiedades y Reportes tienen vistas propias conectadas a los datos del resumen.

## Landing publica

`/` presenta MAPREKO Personal y Business con la paleta del espacio de trabajo,
beneficios, pasos de inicio, preguntas frecuentes y contacto por correo, telefono
y WhatsApp. No requiere sesion ni consulta datos privados. Los accesos llevan a
`/login`; `/app` conserva su autenticacion. Las capacidades futuras se distinguen
de las disponibles, sin precios, testimonios ni indicadores ficticios.
El footer enlaza a terminos y privacidad, que conservan su aviso de revision legal.

## Resumen conectado

`/app` muestra el resumen de los espacios activos de la cuenta autenticada.
No se insertan datos de ejemplo ni se sustituyen errores por indicadores en cero.

- Indicadores mensuales, tareas prioritarias y cumplimiento preventivo por propiedad.
- Resumen sigue el frame Figma `2-2`: encabezado de bienvenida, franja preventiva,
  cuatro indicadores, pendientes y tres propiedades destacadas, y acceso a Aprende.
  Su paleta, encabezado y menu lateral se comparten con Propiedades, Plan de
  mantenimiento, Aprende y Reportes. El footer del menu conserva una linea
  divisora, Configuracion, Mis sesiones, Centro de ayuda, cierre de sesion
  y `Kolectiv - MAPREKO © 2026` en todas las pantallas del espacio.
  El menu de cuenta del encabezado tambien conserva sus accesos.
  El avance preventivo inferior al 70% se muestra en ambar; no cambia sus metricas.
  Las tareas de hoy se destacan en ambar segun su zona horaria; las vencidas,
  en tono rojizo. Escape cierra el menu de cuenta y devuelve el foco al boton.
- Busqueda por titulo de tarea/nombre de propiedad y filtro de propiedad; la busqueda
  no cambia los indicadores. Se consultan hasta 50 tareas pendientes, ordenadas por
  vencimiento y prioridad; la interfaz avisa del limite.
- Registro minimo de propiedad (espacio, nombre, tipo y direccion) para poder crear
  la primera tarea. La zona horaria inicial es la del perfil.
- Nueva tarea mediante un modal: titulo, propiedad, fecha limite, prioridad y detalles.
  La fecha vence al finalizar el dia en la zona horaria de la propiedad.
- Solo propietarios/administradores registran propiedades; miembros tambien pueden
  crear tareas. Los espectadores consultan sin escribir.
- Formularios con errores explicitos, bloqueo de doble envio, foco gestionado y
  actualizacion de indicadores solo tras guardar en el backend.

## Mantenimiento, conocimiento y ayuda

- `/app/maintenance`: lista semanal de tareas con detalle lateral, filtros de
  propiedad, estado y responsable, y registro de tareas. Completar una tarea
  guarda sus pasos e historial en una transaccion, segun los permisos actuales.
  Conserva las vistas de planes (alta y pausa/reactivacion) y calendario mensual.
  Las semanas que cruzan un mes consultan ambos periodos.
- `/app/learn` y `/app/learn/:slug`: busqueda, categorias y guias con avisos
  de seguridad.
- `/app/help` y `/admin/help`: ayuda sobre permisos, fechas, sesiones y alcance
  de las funciones disponibles.
- `/terms` y `/privacy`: terminos y aviso de privacidad vinculados desde el
  inicio de sesion y el centro de ayuda. Los documentos son una base informativa;
  Kolectiv debe completar identidad legal, contacto, proveedores y retencion y
  solicitar revision juridica antes de publicarlos como documentos definitivos.
- Los planes conservan frecuencia y proxima fecha y crean la primera tarea,
  pero aun no generan automaticamente sus siguientes ocurrencias.
- El encabezado muestra la foto de Google solo desde `googleusercontent.com`
  por HTTPS, sin enviar `Referer`, y conserva iniciales como alternativa.
- El copy de pie es `Kolectiv - MAPREKO © 2026`.

- `/app/properties`: propiedades visibles, filtros por tipo y busqueda, avance
  preventivo, alta de propiedad y creacion de tareas segun rol. No incluye edicion
  de propiedades ni gestion de activos.
- `/app/reports`: indicadores del mes actual y cumplimiento por propiedad, con
  filtro de propiedad y comparacion disponible frente al mes anterior. No ofrece
  historial anual ni exportaciones sin respaldo de la API.
- Mantenimiento y Aprende siguen la estructura visible del prototipo; Propiedades
  y Reportes reutilizan su paleta, jerarquia, tarjetas y controles. Las cuatro
  vistas comparten estilos de encabezados, filtros, indicadores y estados.

## Identidad y acceso (AUTH-01 a AUTH-07)

- `/login`: acceso User; `/admin/login`: acceso del equipo interno.
- `/app` y `/admin`: entornos separados con rutas protegidas.
- `/app/profile`, `/admin/profile`: campos de perfil editables.
- `/app/sessions`, `/admin/sessions`: sesiones propias y revocacion.
- La interfaz toma la paleta verde, lima y crema del prototipo; no inventa
  registros de propiedades, indicadores ni datos de negocio.

`proxy.conf.json` envia `/api` al backend local en el puerto 3000.
El navegador usa un solo origen (`http://localhost:4200`), tambien para el callback
Google. En produccion configura un reverse proxy equivalente y HTTPS.
No se habilita CORS indiscriminado ni acceso a PostgreSQL desde Angular.

Las credenciales solo viven en cookies HttpOnly del backend; el cliente conserva
el perfil en memoria, nunca tokens en localStorage/sessionStorage. Restaura la
sesion al entrar en rutas protegidas y renueva el acceso cuando recibe 401.
La renovacion se deduplica dentro de la pestana y usa Web Locks entre pestanas
en navegadores compatibles, consultando primero si otra pestana ya renovo.
Los errores de red se notifican y no se simula un cierre de sesion exitoso.

El formulario usa Reactive Forms, los componentes usan OnPush/signals y las
rutas son lazy. Incluye navegacion por teclado, estados accesibles y gestion
del foco al cambiar de pagina. `axe-core` esta disponible para auditorias
de accesibilidad en navegador.

Antes de probar el acceso real, completa las variables OAuth del
[backend](../mapreko-backend/README.md#google-oauth-configuracion-local).
Si faltan, se muestra un estado no disponible en lugar de un login simulado.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.19.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
