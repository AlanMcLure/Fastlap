# Qué queda pendiente

Índice único de lo que falta. El detalle de cada punto está en el documento al que enlaza; si cambia algo, actualiza aquí y allí.

## 0. Ramas: se trabaja en `claude/fastlap-repo-work-fjj0ch`, no en `master`

Desde octubre de 2026 todo el trabajo va en la rama **`claude/fastlap-repo-work-fjj0ch`**. `master` se ha quedado en «Migración a Next.js 16» y **no se toca** hasta completar esta lista; después se integra la rama en `master` de una vez.

Antes de integrar en `master`:

| Qué | Por qué |
|---|---|
| **Comprobar si `master` está desplegado en público (Vercel)** y, si lo está, decidir si se adelanta solo el arreglo de la fuga de correos (commit `bf73b40`) o se pausa ese despliegue | La versión de `master` envía el correo de cada autor a cualquier visitante (portada y `/api/posts`). Está corregido en la rama, no en `master`. Si estuvo abierto al público con cuentas reales, consultarlo con el abogado (RGPD, posible notificación) |
| Variables en el hosting: añadir `AUTH_URL`, `AUTH_TRUST_HOST=true` y `CRON_SECRET`; quitar `REDIS_URL` y `REDIS_SECRET` | Auth.js v5 y la retirada de Redis (`docs/DESPLIEGUE.md` §2) |
| El esquema ya está aplicado a la base de Neon (`prisma db push`) | Hecho el 3/10/2026; repetirlo si cambia el esquema |
| Programar las tareas diarias (`/api/f1/sync` y `/api/f1/replay/build`) | `docs/DESPLIEGUE.md` §3 |
| Probar en producción el inicio de sesión con Google, la subida de imágenes y una repetición | Solo se han probado en local |


## 1. Solo puedes hacerlo tú (decisiones, cuentas, datos)

| Qué | Dónde está el detalle |
|---|---|
| Elegir **hosting** y crear las cuentas: Postgres (Neon u otro), Google OAuth, UploadThing (Stripe solo si se activa Premium) | `docs/DESPLIEGUE.md` |
| Definir `NEXT_PUBLIC_SITE_URL` y los secretos en el hosting (nunca en el repositorio) | `docs/DESPLIEGUE.md` §3 |
| Aplicar el esquema a la base real (`prisma db push` o el servicio `migrate`): incluye las columnas nuevas `termsAcceptedAt` y `termsVersion` | `docs/DESPLIEGUE.md` |
| Si la base ya tenía cuentas: `node scripts/scrub-google-tokens.mjs` (primero sin `--apply`) | `docs/legal/CAMBIOS-TECNICOS.md` §1.2 |
| **Enviar el correo a Jolpica** (`admin@jolpi.ca`) si habrá publicidad o cobro: los datos son CC BY-NC-SA, uso no comercial (lo mismo vale para OpenF1, fuente de las repeticiones) | `docs/DESPLIEGUE.md` §7, `docs/IDEAS.md` |
| **Decisiones de producto** abiertas: noticias (B4), colores de equipo (B5), datos en vivo reales (B6) | `docs/IDEAS.md` |
| **Segundo minijuego**: describir la idea «tipo futbol11» (no pude abrir la web) y elegir entre ese, las luces de salida u otro | `docs/IDEAS.md` A10 |
| **Datos del titular** y el resto de `[PENDIENTE]` de los textos legales (`grep -rn PENDIENTE docs/legal`) | `docs/legal/README.md` |
| Decidir si se **despliega api-f1** (Spring Boot + MySQL, repo `AlanMcLure/api-f1`) y dónde; después, definir `F1_STATS_URL` en el hosting para activar las páginas de análisis, temporada, récords y circuitos | `AGENTS.md` (Stats layer), `docs/IDEAS.md` A12 |

## 2. Necesita un profesional

| Qué | Dónde |
|---|---|
| Revisión de los borradores legales y las 30 preguntas (incluye el hueco 5: obligaciones de la DSA sobre avisos de retirada, motivación y recurso) | `docs/legal/CONSULTA-ABOGADO.md` |
| Publicar las páginas legales cuando estén revisadas y **enlazarlas** en la casilla de registro y en un pie de página | `docs/legal/README.md` |

## 3. Código opcional (si lo pides)

- **Menores, en `docs/legal/CAMBIOS-TECNICOS.md`:** reaceptar las condiciones si cambian (hoy solo afecta a cuentas nuevas); comprobar que el usuario existe al leer la sesión (cierra las sesiones abiertas tras borrar la cuenta); borrar de UploadThing las imágenes de la cuenta eliminada.
- **Producto:** moderadores por comunidad, ocultar contenido automáticamente con N denuncias, suspensión de usuarios, ligas privadas, notificaciones por correo, búsqueda dentro del texto de las publicaciones, imágenes verticales para compartir.
- **Operación:** Content-Security-Policy, seguimiento de errores (Sentry u otro), migraciones versionadas con `prisma migrate`, UploadThing v7.
- **Evitar divergencia:** si se añade un modelo con relación a `User`, hay que tocar `deleteAccount`, `collectUserData` y sus tests (`AGENTS.md`).

## 4. Nunca probado de verdad (solo contra simulaciones)

Todo lo que depende de servicios reales se verificó contra un simulador local:

- **Jolpica-F1 real** (en el entorno de trabajo no había salida a esa API). Cuando haya internet: `node scripts/capture-f1-fixtures.mjs` y ejecutar los tests de contrato.
- **Google OAuth real** (se probó con un proveedor falso: casilla de edad, creación de cuenta, usuarios existentes).
- **UploadThing, Stripe** y **Postgres de producción**.
- `docker compose up` con un `.env` real, y la instalación como app (PWA) en un móvil real por HTTPS.
- **«Adivina el piloto»** con la parrilla real de Jolpica: se probó entera en navegador (partida ganada y perdida, persistencia, accesibilidad), pero con datos simulados (pilotos inventados, sin número de coche).
- La **pantalla** de Ajustes (borrado y exportación) en navegador: solo está comprobada por tipos y tests de datos.

## 5. Límites conocidos (decididos, no son fallos)

`bf-cache` desactivado (páginas `no-store`), sin CSP, `db push` en vez de migraciones, sin feed real de directo (solo simulador), notificaciones solo dentro de la app, y una sola instancia: los límites de uso, el directo y la sincronización de notificaciones viven en memoria (sin Redis desde octubre de 2026; cuándo volver a añadirlo, en `docs/IDEAS.md` § D).
