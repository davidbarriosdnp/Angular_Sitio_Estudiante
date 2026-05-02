# Portal estudiantes (Angular 21)

SPA con **PrimeNG**, **SweetAlert2** y **SSR** (Express). Consume la API **Servicios Estudiantes** (`/api/v1/...`).

## Requisitos

- Node.js **20+** (recomendado **22** alineado con CI)
- npm 10+
- API ASP.NET Core en ejecución (por defecto en desarrollo: **`https://localhost:7020`**)

## Variables de entorno (front)

La URL base del API se define en `src/environments/` mediante `apiBaseUrl`:

| Entorno        | Archivo                         | Uso típico |
|----------------|----------------------------------|------------|
| **Local**      | `environment.local.ts`           | API en `https://localhost:7020` (vía `environment.ts` → reexport) |
| **Development**| `environment.development.ts`     | Mismo u otro host de desarrollo compartido |
| **Proxy**      | `environment.proxy.ts`           | `apiBaseUrl` vacío + `proxy.conf.json` → evita CORS |
| **QA**         | `environment.qa.ts`              | Preproducción (edita la URL real) |
| **Production** | `environment.production.ts`      | `apiBaseUrl: ''` → rutas relativas `/api/...` detrás del mismo dominio o reverse proxy |

El token `APP_ENVIRONMENT` y `ApiUrlService` construyen las URLs (`/api/v1/...` o absolutas).

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm start` | `ng serve` — configuración por defecto **`local`** (API directa a `https://localhost:7020`) |
| `npm run start:local` | Igual, explícito |
| `npm run start:dev` | Perfil **development** (`environment.development.ts`) |
| `npm run start:proxy` | Perfil **proxy** + `proxy.conf.json` (reenvío `/api` → `https://localhost:7020`) |
| `npm run start:qa` | Build QA sin optimizar (útil para probar env QA) |
| `npm run start:prod` | Sirve build producción |
| `npm run build` / `build:prod` | Artefactos optimizados (`production`) |
| `npm run build:qa` | Build QA |
| `npm run build:local` | Build perfil local |
| `npm run serve:ssr:Angular_Sitio_Estudiantes` | Tras `ng build`, arranca el servidor Node SSR |

## CORS y certificado HTTPS local

Si usas **`apiBaseUrl: 'https://localhost:7020'`** (local / development), el backend debe permitir el origen del front (p. ej. `http://localhost:4200`) en CORS.

Si el certificado de desarrollo del API no es de confianza, alternativas:

1. **`npm run start:proxy`**: el navegador solo habla con `localhost:4200`; el dev server reenvía `/api` al API (ver `proxy.conf.json`).
2. Confiar el certificado de desarrollo de ASP.NET en el almacén del sistema.

## Docker

Desde esta carpeta (`package.json` en la raíz del proyecto):

```bash
docker build -t sitio-estudiantes:prod --build-arg BUILD_CONFIGURATION=production .
docker run --rm -p 4000:4000 sitio-estudiantes:prod
```

- Imagen multi-stage: build Angular → imagen mínima Node que ejecuta `dist/.../server/server.mjs`.
- Ajusta `BUILD_CONFIGURATION` (`qa`, `production`, etc.) según el entorno.

`docker-compose.yml` incluye un ejemplo de servicio `web`.

## Azure DevOps

Archivo **`azure-pipelines.yml`**: instala Node, ejecuta `npm ci` y `ng build`, publica `dist/` como artefacto `angular-dist`.

- Si el repositorio **no** tiene el Angular en la raíz, define en el pipeline la variable `projectPath` (por ejemplo `Angular_Sitio_Estudiantes`).
- Para despliegue: conecta una etapa **Release** que despliegue el artefacto a **Azure App Service**, **Static Web Apps** o un **contenedor** en **Container Apps** / **AKS**.

## Reverse proxy (producción)

Con `apiBaseUrl` vacío en producción, el navegador llama a `https://tu-dominio/api/v1/...`. El servidor web debe enrutar `/api` al backend. Ejemplo en **`deploy/nginx.conf.example`**.

## Estructura útil

- `src/environments/` — configuración por entorno.
- `proxy.conf.json` — proxy de desarrollo hacia `https://localhost:7020`.
- `Dockerfile`, `docker-compose.yml` — contenedor SSR.
- `deploy/nginx.conf.example` — Nginx como referencia.

## Desarrollo: generación de código

```bash
ng generate component nombre
ng generate --help
```

## Tests unitarios

```bash
ng test
```

(Puede requerir paquetes adicionales de Vitest browser según la configuración del CLI.)

## Referencias

- [Angular CLI](https://angular.dev/tools/cli)
- [PrimeNG](https://primeng.org/)
- [SweetAlert2](https://sweetalert2.github.io/)
