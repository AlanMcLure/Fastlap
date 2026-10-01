# Plan: rehacer el F1 Dashboard

Estado: **en curso**. Hechas la rebanada 0 (limpieza, salvo las noticias, pendientes de D4) y la 1 (capa de datos, con fixtures sintéticos hasta capturar respuestas reales). Pendientes D1–D4 y el riesgo de licencia (R1).
Alcance: solo `/f1-dashboard/*` y `/api/ergast/*`. La parte social (comunidades, posts, votos, comentarios, auth, Stripe) no se toca.

## 1. Por qué rehacerlo

Lo que hay hoy (≈2.200 líneas) tiene problemas de fondo, no de detalle:

| Problema | Dónde | Consecuencia |
|---|---|---|
| Estadísticas escritas a mano y **números aleatorios** para pilotos desconocidos | `api/ergast/driver/route.ts` | Se muestran datos falsos como si fueran reales |
| Noticias escritas a mano en el código | `lib/newsData.ts` | No hay fuente de contenido real |
| Botones de crear/editar/borrar que llaman a un backend en `http://localhost:8083` (resto de otro proyecto) | `components/f1-dashboard/*Button.tsx`, `authenticated()` en `lib/utils.ts` | No funcionan en este repo; el uso que queda está comentado |
| 18 `useEffect` que piden datos desde el navegador | `app/f1-dashboard/**`, `components/f1-dashboard/**` | Más lento, sin caché compartida, sin SEO, estados de carga/error repetidos |
| Respuestas de la API tipadas con `any` | rutas y componentes | Un cambio de la API rompe en silencio |
| Sin copia propia de los datos | todo | Todos los usuarios comparten el límite de Jolpica (≈500 peticiones/hora, a verificar) |
| Código muerto | `ergast/laps`, `ergast/driver/laps`, `LapTimesChart`, `GraficoPuntos` | Ruido |
| Dos librerías de gráficos (`chart.js` y `recharts`) que solo aparecen en componentes sin uso (`GraficoPuntos`, que además llama a `localhost:8083`, y `LapTimesChart`) | `package.json` | Peso en el bundle y dependencias sin función |

## 2. Decisiones pendientes (hay que cerrarlas antes de construir)

### D1. Qué justifica pagar Premium
Hoy el dashboard enseña datos de F1 que se encuentran gratis en muchos sitios. Opciones, no excluyentes:

- **A. Análisis propio:** comparador de pilotos, evolución de la clasificación jornada a jornada, ritmo por vuelta, estrategias de paradas.
- **B. Pronósticos con la comunidad:** cada usuario predice podio/pole de cada GP y hay ranking de aciertos. Une dashboard y red social, que es lo que nadie más ofrece.
- **C. Hilo automático por GP:** al terminar cada carrera se crea un debate en la comunidad con los datos de la carrera.

Recomendación provisional: **B como pilar y A como complemento**; C es barato y refuerza ambas. *Decisión del autor.*

### D2. ¿Dashboard todo de pago o parte pública?
Un tramo gratuito (calendario, clasificación, resultados) atrae tráfico y registros; lo de pago serían A/B. Hoy `proxy.ts` bloquea todo `/f1-dashboard` a quien no sea `PREMIUM`/`ADMIN`. Recomendación: **parte pública + funciones Premium**, comprobando el rol en el servidor por funcionalidad (`requirePremium()`), no solo con el `matcher`. *Decisión del autor.*

### D3. Fuente de datos
Jolpica-F1 (sucesor de Ergast, compatible) es la única fuente abierta razonable para resultados y vueltas. Se mantiene salvo que haya otra preferencia.

### D4. Noticias
Mientras no exista una fuente real de contenido (RSS con permiso, redacción propia), **eliminar la sección** en vez de mantener artículos de ejemplo. *Decisión del autor.*

## 3. Riesgos a comprobar antes de monetizar

1. **Licencia de los datos.** Los datos de Ergast se publicaron con licencia de uso *no comercial* y Jolpica los hereda; cobrar una suscripción sobre ellos puede no estar permitido. Hay que leer los términos de Jolpica y, si hace falta, pedirles confirmación o cambiar de fuente. **Es el punto que más puede cambiar el plan.**
2. **Marcas de F1.** Nombres y logotipos de F1/equipos son marcas registradas; no usar logos oficiales y añadir aviso de "no afiliado".
3. **Disponibilidad y límites de Jolpica.** Mitigación: copia propia (sección 4.3) y caché.
4. **Datos en tiempo real.** Jolpica no es una fuente live; la promesa del producto debe ser "resultados y análisis", no "directo".

## 4. Arquitectura propuesta

### 4.1 Principios
- **Servidor primero:** páginas como componentes de servidor; cliente solo para gráficos e interacción.
- **Sin datos inventados:** si un dato no existe, no se muestra.
- **Tipado de extremo a extremo:** respuestas validadas con Zod en la frontera.
- **Estados completos:** `loading.tsx` / `error.tsx` por sección y mensajes en español.
- **Una sola librería de gráficos.** Hoy ninguna se usa de verdad; se elige en la rebanada 3, que es la primera con gráficos (propuesta: `recharts`), y se desinstala la otra en la rebanada 0.

### 4.2 Capa de datos (`src/lib/f1/`)
- `client.ts`: cliente de Jolpica (URL base, reintentos con backoff, respeto del límite, `revalidate` por tipo de dato).
- `schemas.ts`: esquemas Zod de `Race`, `Result`, `Driver`, `Constructor`, `Standing`, `Lap`.
- `queries.ts`: funciones `getCalendar(season)`, `getStandings(season, round?)`, `getRaceResults(season, round)`, `getDriver(id)`, … que devuelven tipos del dominio, no el JSON crudo.
- Las rutas `/api/ergast/*` actuales desaparecen: las páginas llaman directamente a `queries.ts` desde el servidor.

### 4.3 Copia propia en base de datos
Para que el límite de Jolpica deje de depender del tráfico:
- Tablas Prisma: `Driver`, `Constructor`, `Race`, `RaceResult`, `StandingSnapshot` (por temporada y ronda), `SyncRun` (registro de sincronizaciones).
- **Temporadas cerradas:** se sincronizan una vez y no cambian.
- **Temporada en curso:** `POST /api/cron/f1-sync`, protegido con un secreto, ejecutado por un planificador externo (GitHub Actions programado o cron del hosting) tras cada sesión; idempotente.
- Las páginas leen de la base de datos; Jolpica solo lo toca la sincronización.

### 4.4 Control de acceso
- `requirePremium()` en `src/lib/auth.ts` (redirige a `/premium` o `/sign-in` según el caso), usado por las páginas/acciones de pago.
- `proxy.ts` pasa a proteger solo lo estrictamente privado (según D2).
- Recordar que el rol del token se refresca con `update()`; las funciones de pago deben comprobar el rol en la **base de datos** cuando el coste de un error sea alto.

## 5. Secciones y orden de trabajo (rebanadas verticales)

Cada rebanada se entrega completa (datos + UI + estados + pruebas) y se puede revisar sola.

| # | Rebanada | Contenido | Depende de |
|---|---|---|---|
| 0 | **Limpieza** | Borrar código muerto, datos inventados, botones de CRUD del backend ajeno y noticias de ejemplo (según D4) | — |
| 1 | **Capa de datos** | `src/lib/f1/` con Zod + tests de contrato con respuestas reales guardadas como fixtures | licencia (R1) |
| 2 | **Calendario y próxima carrera** | Calendario, cuenta atrás, detalle de circuito | 1 |
| 3 | **Clasificaciones** | Pilotos y constructores, selector de temporada, evolución por jornada (gráfico) | 1 |
| 4 | **Detalle de carrera** | Resultados, parrilla, vuelta rápida, paradas | 1 |
| 5 | **Pilotos** | Listado y perfil con estadísticas **calculadas** a partir de resultados reales | 1, 4 |
| 6 | **Copia propia + sincronización** | Modelos Prisma, tarea de sincronización, lectura desde la BD | 1–5 |
| 7 | **Funciones Premium** | Según D1 (pronósticos y/o análisis) | 6, D1, D2 |

Las rebanadas 2–5 pueden empezar leyendo directamente de Jolpica (con caché) y pasar a la base de datos en la 6 sin cambiar la UI, porque las páginas solo conocen `queries.ts`.

## 6. Calidad y pruebas

- Introducir **Vitest** (hoy no hay runner) solo para la capa de datos y la lógica de pronósticos/puntuación.
- Tests de contrato: fixtures con respuestas reales de Jolpica; si cambia el formato, el test falla.
- Comprobación manual en navegador al final de cada rebanada (como se ha hecho en las migraciones) y revisión de accesibilidad básica (contraste, foco, `aria-label` en gráficos).
- `yarn lint`, `npx tsc --noEmit` y `yarn build` limpios antes de cada commit.

## 7. Fuera de alcance

Datos en directo/telemetría, aplicación móvil, traducciones a otros idiomas, y cualquier cambio en la parte social salvo el enlace con el dashboard (pronósticos, hilos de GP) si D1 lo decide.

## 8. Siguiente paso

Cerrar D1–D4 y comprobar el riesgo de licencia (R1). Con eso, empezar por la rebanada 0 (limpieza) y la 1 (capa de datos), que son necesarias decida lo que se decida.
