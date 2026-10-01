# Qué queda pendiente

Índice único de lo que falta. El detalle de cada punto está en el documento al que enlaza; si cambia algo, actualiza aquí y allí.

## 1. Solo puedes hacerlo tú (decisiones, cuentas, datos)

| Qué | Dónde está el detalle |
|---|---|
| Elegir **hosting** y crear las cuentas: Postgres (Neon u otro), Upstash Redis, Google OAuth, UploadThing (Stripe solo si se activa Premium) | `docs/DESPLIEGUE.md` |
| Definir `NEXT_PUBLIC_SITE_URL` y los secretos en el hosting (nunca en el repositorio) | `docs/DESPLIEGUE.md` §3 |
| Aplicar el esquema a la base real (`prisma db push` o el servicio `migrate`): incluye las columnas nuevas `termsAcceptedAt` y `termsVersion` | `docs/DESPLIEGUE.md` |
| Si la base ya tenía cuentas: `node scripts/scrub-google-tokens.mjs` (primero sin `--apply`) | `docs/legal/CAMBIOS-TECNICOS.md` §1.2 |
| **Enviar el correo a Jolpica** (`admin@jolpi.ca`) si habrá publicidad o cobro: los datos son CC BY-NC-SA, uso no comercial | `docs/DESPLIEGUE.md` §7, `docs/IDEAS.md` |
| **Decisiones de producto** abiertas: noticias (B4), colores de equipo (B5), datos en vivo reales (B6) | `docs/IDEAS.md` |
| **Datos del titular** y el resto de `[PENDIENTE]` de los textos legales (`grep -rn PENDIENTE docs/legal`) | `docs/legal/README.md` |

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
- **UploadThing, Stripe** y **Redis/Postgres de producción**.
- `docker compose up` con un `.env` real, y la instalación como app (PWA) en un móvil real por HTTPS.
- La **pantalla** de Ajustes (borrado y exportación) en navegador: solo está comprobada por tipos y tests de datos.

## 5. Límites conocidos (decididos, no son fallos)

`bf-cache` desactivado (páginas `no-store`), sin CSP, `db push` en vez de migraciones, sin feed real de directo (solo simulador), notificaciones solo dentro de la app, y las instancias múltiples no son compatibles con el directo ni con el bloqueo de notificaciones (una sola instancia).
