# Guía de despliegue de FastLap

Estado: el repositorio está **preparado** para desplegar (imagen Docker probada, comprobación de salud, validación del entorno, CI). **No se ha desplegado** en ningún sitio: eso requiere tus cuentas y decisiones. Esta guía dice qué hay que decidir, qué crear y en qué orden, y qué falta por verificar.

## 1. Qué necesita la aplicación

| Pieza | Para qué | Opciones |
|---|---|---|
| **Proceso Node de larga vida** (Docker) | La web, la tarea de sincronización y el directo (`/live`, desactivado por defecto) | VPS con Docker, Fly.io, Railway, Render… Cualquier sitio que ejecute una imagen Docker y dé HTTPS |
| **PostgreSQL 16** | Todos los datos | Gestionado (Neon, Supabase, RDS…) o el contenedor `db` de `docker-compose` (solo pruebas) |
| **Redis con API REST de Upstash** | Límites de uso, caché de publicaciones populares, bloqueo de notificaciones | Upstash (plan gratuito suficiente al principio). Un Redis normal **no sirve**: el cliente habla HTTP |
| **Google OAuth** | Inicio de sesión (único método) | Consola de Google Cloud |
| **UploadThing** | Imágenes de perfil y publicaciones | Cuenta de UploadThing |
| **Stripe** | Solo si activas Premium (hoy oculto) | Cuenta de Stripe |
| **Dominio + HTTPS** | Obligatorio: cookies de sesión seguras, service worker e instalación como app | El proveedor suele dar certificado automático |

Vercel es posible para la parte web (hay `vercel.json`), pero no ejecuta procesos largos: el directo (`/live`) y cualquier tarea que pase de su límite de tiempo no funcionarían. Para lo que hay hoy encaja mejor un contenedor.

## 2. Variables de entorno

Compruébalas con `node scripts/check-env.mjs` (o `yarn check-env`; dentro de la imagen: `docker run --rm --env-file .env <imagen> node scripts/check-env.mjs`). Sale con error si falta algo obligatorio.

| Variable | Obligatoria | Notas |
|---|---|---|
| `DATABASE_URL` | sí | `postgresql://usuario:clave@host:5432/base` (con `?sslmode=require` en la mayoría de servicios gestionados) |
| `NEXTAUTH_SECRET` | sí | `openssl rand -base64 32` |
| `AUTH_URL` | sí en Docker | URL pública `https://tu-dominio` |
| `AUTH_TRUST_HOST` | sí en Docker | `true` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | sí | URI de redirección autorizada: `https://tu-dominio/api/auth/callback/google` |
| `REDIS_URL` / `REDIS_SECRET` | sí | URL REST y token de Upstash |
| `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` | sí | UploadThing sigue en la v4 (la v7 usa un único `UPLOADTHING_TOKEN`) |
| `NEXT_PUBLIC_SITE_URL` | **recomendada, en tiempo de compilación** | `https://tu-dominio`. Sin ella, las URL canónicas, el sitemap y las tarjetas para compartir dirán `localhost` |
| `NEXT_PUBLIC_PREMIUM_ENABLED` | no (compilación) | `false` por defecto. A `true` muestra Premium y exige Stripe **y licencia comercial de los datos** |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | solo con Premium | Webhook: `https://tu-dominio/api/webhook`, evento `checkout.session.completed` |
| `CRON_SECRET` | recomendada | Activa `/api/f1/sync` (copia propia de temporadas cerradas) |
| `ERGAST_BASE_URL` | no | Por defecto Jolpica |
| `LIVE_SIMULATION` | no | `true` publica la página de directo simulado; déjala apagada |

**Las `NEXT_PUBLIC_*` se incorporan al compilar**: cámbialas y vuelve a construir la imagen (con `docker compose` se pasan solas desde `.env`).

## 3. Primer despliegue, paso a paso

1. **Crea las cuentas** (base de datos, Upstash, Google, UploadThing) y rellena `.env` a partir de `.env.example`.
2. `node scripts/check-env.mjs` hasta que diga `OK`.
3. **Construye** la imagen: `docker compose build` (o `docker build --build-arg NEXT_PUBLIC_SITE_URL=https://tu-dominio -t fastlap .`).
4. **Crea el esquema** en la base de datos: `docker compose --profile tools run --rm migrate`. Usa `prisma db push` (así se creó la base de producción): lee lo que muestra, rechaza cambios destructivos salvo que añadas `--accept-data-loss`, y no deja un historial de migraciones.
5. **Arranca**: `docker compose up -d`. Comprueba `https://tu-dominio/api/health` → `{"status":"ok"}`.
6. **Primer administrador**: entra con Google una vez y, en la base de datos: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'tu@correo';` (cierra y vuelve a abrir sesión). Da acceso a `/admin/denuncias`.
7. **Copia inicial de datos de F1** (opcional pero recomendable; cada llamada admite hasta 3 temporadas y Jolpica limita a 500 peticiones/hora):
   `curl -H "Authorization: Bearer $CRON_SECRET" "https://tu-dominio/api/f1/sync?from=2023&to=2025"`
8. **Tarea programada** para mantenerla al día, una vez al día, la última temporada cerrada. Con cron del servidor:
   `0 4 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" "https://tu-dominio/api/f1/sync" >/dev/null`
   (o un programador del hosting, o un flujo de GitHub Actions con `schedule`).
9. **Lista de comprobación antes de abrir** (sección 6).

## 4. Operación

- **Salud:** `GET /api/health` → 200 `ok` o `degraded` (Redis caído: sigue funcionando sin límites de uso ni caché) y 503 `down` (sin base de datos). La imagen incluye `HEALTHCHECK`, que asume el puerto 3000.
- **Registros:** salen por la salida estándar (`docker logs`). No hay seguimiento de errores externo (ver sección 7).
- **Copias de seguridad:** diaria con `pg_dump -Fc "$DATABASE_URL" > fastlap-$(date +%F).dump`, guardada fuera del servidor. Restaurar: `pg_restore -d "$DATABASE_URL" --clean fastlap-AAAA-MM-DD.dump`. Los servicios gestionados suelen traer copias automáticas: actívalas y **prueba una restauración** antes de depender de ellas.
- **Actualizar:** `git pull`, `docker compose build`, `docker compose --profile tools run --rm migrate` (si cambió el esquema), `docker compose up -d`. **Volver atrás:** vuelve a la etiqueta anterior de la imagen; los cambios de esquema no se deshacen solos (por eso conviene la copia previa).
- **Un solo proceso:** el directo (si lo activas) y el bloqueo de notificaciones funcionan por proceso. Con varias réplicas, el directo tendría una fuente por réplica (ver `docs/PLAN-DASHBOARD.md`, rebanada 9).
- **CI:** `.github/workflows/ci.yml` ejecuta tipos, lint, tests, build y construye las dos imágenes en cada pull request.

## 5. Lo que se ha verificado aquí

En el entorno de desarrollo (sin acceso a Google, UploadThing, Stripe ni a la API real de F1):
- La **imagen de producción se construye y arranca** como usuario no root, con la base de datos y Redis reales en local: `/api/health` da `ok`; con Redis parado, `degraded` (HTTP 200); con la base parada, `down` (HTTP 503).
- Las **URL canónicas y el sitemap usan el `NEXT_PUBLIC_SITE_URL`** pasado al compilar, y las cabeceras de seguridad y `/sw.js` (sin caché) salen como se espera.
- La **imagen de migración crea todas las tablas** en una base de datos vacía.
- `check-env` falla con un entorno vacío y pasa con uno completo.

**Diferencias con tu entorno real, sin verificar:** para construir aquí hubo que quitar la instalación de paquetes de Alpine (`apk add openssl`, bloqueada por la política de red) y confiar en el certificado del proxy; ninguna de las dos cosas afecta a tu construcción normal, pero ese paso concreto no se ejecutó. Tampoco se ha probado `docker compose up` completo con el `.env` real.

## 6. Lista de comprobación antes de abrir al público

- [ ] HTTPS activo y `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` con el dominio final; redirección `http` → `https`.
- [ ] Inicio de sesión con Google completo (cuenta nueva y existente); la sesión sobrevive a recargar.
- [ ] Crear comunidad, publicar con imagen (UploadThing), comentar, votar, borrar lo propio.
- [ ] Notificaciones (comentar desde otra cuenta), denuncia y resolución desde `/admin/denuncias`.
- [ ] Liga de pronósticos, hilo y votación del Piloto del Día con datos reales de F1; búsqueda y `/pronosticos`.
- [ ] `/sitemap.xml` y `/robots.txt` con el dominio correcto; la página no sale con `localhost` en el código fuente.
- [ ] Instalar como app en un móvil real; página sin conexión.
- [ ] Copia de seguridad hecha **y restaurada** en una base de prueba.
- [ ] Administrador creado; `CRON_SECRET` y tarea programada funcionando; copia de datos de F1 hecha.
- [ ] Textos legales (sección 7) publicados.
- [ ] Prueba con un lector de pantalla y con algunos aficionados reales.

## 7. Pendiente y riesgos (no es asesoramiento legal)

- **Licencia de los datos:** Jolpica-F1 es CC BY-NC-SA 4.0 (**uso no comercial**, atribución). Si vas a cobrar o poner publicidad, escribe antes a `admin@jolpi.ca`. La copia propia y la API pública son obras derivadas con la misma licencia.
- **Textos legales:** hace falta política de privacidad (se guardan correo, nombre y foto de Google, y lo que publiquen) y condiciones de uso; las cookies actuales son técnicas (sesión y tema), sin analítica. Revisión profesional recomendada (RGPD si hay usuarios en la UE).
- **Marcas:** la app avisa de que no está afiliada a la Fórmula 1; no uses logos oficiales.
- **Content-Security-Policy:** no hay. Se añadieron las demás cabeceras de seguridad, pero una CSP exige permitir el script del tema, los datos estructurados y los incrustados del editor, y probarla con cuidado.
- **Seguimiento de errores y métricas:** no hay (Sentry, etc.). Recomendable antes de tener usuarios reales; necesita una cuenta.
- **Migraciones versionadas:** se usa `db push`. Con datos reales conviene pasar a `prisma migrate` (con una migración inicial de base y `migrate resolve` para la base ya existente).
- **Moderación:** solo administradores; sin moderadores por comunidad, suspensión de usuarios ni normas escritas de la comunidad.
- **Correo:** las notificaciones son solo dentro de la app.
- **UploadThing v4:** migrar a la v7 es un trabajo aparte.
