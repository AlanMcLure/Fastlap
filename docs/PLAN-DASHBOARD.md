# Plan: F1 Dashboard y siguientes pasos de FastLap

Estado: **en curso**. Hechas la rebanada 0 (limpieza, salvo las noticias), la 1 (capa de datos, con fixtures sintéticos hasta capturar respuestas reales) y V0 (arreglos visuales). Premium/Stripe está **oculto tras un flag** hasta que el proyecto se publique. La parte social (comunidades, posts, votos, comentarios, auth) no se rehace.

Documentos relacionados: [AUDITORIA-VISUAL.md](AUDITORIA-VISUAL.md) (estado visual actual y propuesta de rediseño).

## 1. Por qué rehacer el dashboard

| Problema | Dónde | Estado |
|---|---|---|
| Estadísticas escritas a mano y números aleatorios en el perfil de piloto | `api/ergast/driver` | ✅ eliminado (rebanada 0) |
| Botones de crear/editar/borrar contra un backend en `localhost:8083` (resto de otro proyecto) | `components/f1-dashboard/*Button.tsx` | ✅ eliminado |
| Endpoints y componentes sin uso, dos librerías de gráficos sin uso | varios | ✅ eliminado (`chart.js`); `recharts` se queda para la rebanada 3 |
| Noticias escritas a mano en el código | `lib/newsData.ts` | ⏳ pendiente de D4 |
| 18 `useEffect` que piden datos desde el navegador | `app/f1-dashboard/**` | ⏳ rebanadas 2–5 |
| Respuestas de la API con `any` | rutas y componentes | ✅ capa `src/lib/f1/` con Zod; falta migrar las páginas |
| Sin copia propia de los datos | todo | ✅ rebanada 6 |
| Errores en inglés y redirección a un 404 si falla la API; la barra lateral tapa el contenido | `pilotos`, layout del dashboard | ✅ V0 |

## 2. Hallazgos de la investigación (mercado y licencia)

Fuentes secundarias (fichas de tiendas, artículos, GitHub); no hay datos de descargas ni retención. Para validar de verdad hace falta hablar con aficionados.

- **Licencia de los datos (el hallazgo más importante).** Jolpica-F1 publica sus datos con **CC BY-NC-SA 4.0**: uso no comercial, con atribución y compartiendo lo derivado bajo la misma licencia. El uso comercial requiere pedir permiso a `admin@jolpi.ca` ([TERMS.md](https://github.com/jolpica/jolpica-f1/blob/main/TERMS.md)). Los datos originales de Ergast tampoco permitían cobrar por una app ni por datos de la API. El proyecto es voluntario y no garantiza disponibilidad.
- **App oficial de F1:** F1 Fantasy, F1 Predict, personalización por piloto/equipo y ligas con amigos ([F1](https://www.formula1.com/en/latest/article/formula-1-launches-new-website-and-personalised-mobile-app.1knZbPSCZ2tS2z6ADRn2Gs)).
- **Juegos de pronósticos:** muchísimos y casi idénticos ([BERACE](https://apps.apple.com/app/id6447265815), [MyGrid](https://apps.apple.com/cd/app/mygrid/id6739147623), [Superbru](https://www.superbru.com/f1), [Podium Prophets](https://alternativeto.net/software/podium-prophets/about)): ligas privadas con código de invitación, puntuación automática, reglas configurables, clasificación + sprint + carrera. Son apps aparte, sin comunidad.
- **Datos en vivo:** ya existen proyectos gratuitos y abiertos ([f1-dash](https://github.com/r4ai/f1-dash), [f1-telemetry](https://github.com/matteocelani/f1-telemetry)) que leen el feed de *F1 Live Timing* (SignalR), que no es una API oficial documentada.
- **Comunidad:** r/formula1 vive de los hilos de carrera en directo y debates; el voto de Piloto del Día se hace en apps oficiales; hay quejas de falta de datos en segunda pantalla ([TechRadar](https://techradar.com/pro/i-want-racemate-to-be-the-second-screen-infobip-is-helping-tgr-haas-to-fund-formula-1-car-development-through-an-entirely-new-kind-of-fan-engagement)).
- **Precios de referencia:** F1 TV Pro ≈ [$85/año en EE. UU.](https://www.thepricer.org/how-much-does-f1-tv-cost/) y ≈ 65 €/año en España según un artículo; hay quejas por el precio.
- **Hueco posible (hipótesis, no dato):** unir comunidad + pronósticos en español: ligas de pronósticos dentro de cada comunidad y un hilo automático por Gran Premio con resultados y votación de Piloto del Día.

## 3. Decisiones

| | Decisión | Estado |
|---|---|---|
| D1 | Qué justifica pagar Premium | **Aplazada.** Con CC BY-NC-SA no se puede cobrar por los datos. Premium solo podría vender cosas propias (ligas privadas con reglas personalizadas, sin publicidad, estadísticas propias) y, aun así, lo derivado de los datos necesita permiso. Primero licencia (R1). |
| D2 | ¿Dashboard de pago o público? | **Público para usuarios con sesión mientras Premium esté apagado** (flag `NEXT_PUBLIC_PREMIUM_ENABLED`, apagado por defecto). Abrirlo también a visitantes sin sesión queda por decidir (ayuda al SEO y a captar registros). |
| D3 | Fuente de datos | Jolpica-F1 para históricos. Datos en vivo: ver §6. |
| D4 | Noticias | **Pendiente.** Propuesta: eliminar hasta tener una fuente real de contenido. |
| D5 | Rumbo visual | **Decidido: dirección B** (Nothing con tablas de telemetría, oscuro por defecto con selector). Ver [AUDITORIA-VISUAL.md](AUDITORIA-VISUAL.md). |

## 4. Riesgos

1. **R1 · Licencia.** Mientras el proyecto sea gratuito y no comercial, con atribución visible a Jolpica/Ergast, el uso encaja. Antes de cobrar (Premium) o de monetizar con publicidad hay que pedir licencia comercial a Jolpica o cambiar de fuente. La copia propia en base de datos (§5) y cualquier API pública que expongamos son obras derivadas: deben publicarse con la misma licencia. No es asesoramiento legal.
2. **R2 · Marcas de F1.** Nombres y logotipos de F1 y equipos están registrados: no usar logos oficiales y añadir aviso de "proyecto no afiliado".
3. **R3 · Disponibilidad y límites de Jolpica** (≈4 peticiones/s, 500/h por IP; sin garantía de servicio). Mitigación: copia propia y caché.
4. **R4 · Feed en vivo no oficial.** Sin documentación ni garantías; puede cambiar o bloquearse; no he verificado sus condiciones de uso.

## 5. Datos históricos y API propia

**Sí, tiene sentido** para todo lo que ya terminó (un Gran Premio pasa a la historia y no cambia):

- **Copia en nuestra base de datos** (Prisma): `Driver`, `Constructor`, `Race`, `RaceResult`, `StandingSnapshot`, `SyncRun`. Temporadas cerradas: una sola sincronización. Temporada en curso: tarea programada tras cada sesión (`POST /api/cron/f1-sync` con secreto, idempotente).
- **Qué gana FastLap:** independencia del límite y las caídas de Jolpica, páginas más rápidas, consultas propias (estadísticas por piloto, comparativas) y base para pronósticos y debates.
- **API propia de solo lectura** (`/api/v1/...`) sobre esa copia: útil para nuestras páginas y apps futuras. Si se hace pública hay que ofrecerla bajo CC BY-NC-SA con atribución (R1).
- **Lo que no resuelve:** la licencia. Una copia local de datos CC BY-NC-SA sigue siendo CC BY-NC-SA. Para que los datos sean realmente nuestros hace falta licencia comercial o otra fuente con derechos claros.
- Las páginas solo conocen `src/lib/f1/queries.ts`, de modo que pasar de Jolpica a la base de datos no cambia la UI.

## 6. Datos en vivo (fase posterior, opcional)

**¿Se puede replicar y mejorar algo como f1-dash?** Técnicamente sí; conviene decidirlo con los ojos abiertos:

- **Cómo funcionan:** leen el feed de F1 Live Timing (SignalR). Necesitan un proceso **siempre encendido** (no sirve una función serverless): un servicio aparte que se conecta al feed, guarda el estado en Redis y lo reparte a los navegadores por SSE/WebSocket. El despliegue en Docker lo permite.
- **Coste:** es la parte más cara de mantener (el formato del feed cambia sin aviso), y compite con herramientas gratuitas ya maduras.
- **Dónde podríamos diferenciarnos (sin competir en telemetría):** interfaz en español y móvil primero; torre de tiempos + mensajes de dirección de carrera sencillos; **enlazado con la comunidad** (hilo de carrera, votación de Piloto del Día, pronósticos que se puntúan en directo).
- **Condiciones:** solo no comercial, comprobando antes los términos del feed (R4), y **después** de las rebanadas 2–7. Entonces se hace un prototipo de una sesión (p. ej. una clasificación) para medir el esfuerzo real antes de comprometerse.

## 7. Premium y Stripe

- Apagado con `NEXT_PUBLIC_PREMIUM_ENABLED=false` (por defecto, en tiempo de compilación): no se muestran la tarjeta Premium, `/premium` ni `/premium/success`; `/api/checkout` y `/api/prices` responden 404; cualquier usuario con sesión entra al dashboard. El webhook sigue activo.
- Se vuelve a encender cuando el proyecto esté publicado **y** la licencia (R1) esté resuelta.

## 8. Arquitectura

### 8.1 Principios
Servidor primero; sin datos inventados; tipado de extremo a extremo (Zod en la frontera); estados de carga/error/vacío completos y en español; una sola librería de gráficos (`recharts`, elegida en la rebanada 3); sin logos oficiales.

### 8.2 Capa de datos (`src/lib/f1/`) — hecha
`client.ts` (reintentos, límite, paginación), `schemas.ts` (Zod), `queries.ts` (calendario, próxima carrera, clasificaciones, resultados, paradas, pilotos), tests con Vitest. Las rutas `/api/ergast/*` desaparecen cuando las páginas migren.

### 8.3 Control de acceso
`canAccessDashboard(role)` en `src/lib/features.ts`; cuando Premium vuelva, `requirePremium()` por funcionalidad en el servidor, no solo en `proxy.ts`.

## 9. Orden de trabajo

| # | Rebanada | Contenido | Estado |
|---|---|---|---|
| 0 | Limpieza | Código muerto, datos inventados, CRUD ajeno | ✅ (noticias pendientes de D4) |
| 1 | Capa de datos | `src/lib/f1/` + tests + captura de fixtures reales | ✅ |
| V0 | Arreglos visuales rápidos | Textos y fechas en español, plural, barra lateral del dashboard, errores en español | ✅ |
| 2 | Calendario y próxima carrera | Calendario, cuenta atrás, circuito | ✅ |
| 3 | Clasificaciones | Pilotos y constructores, selector de temporada, evolución (gráfico) | ✅ |
| 4 | Detalle de carrera | Resultados, parrilla, vuelta rápida, paradas | ✅ |
| 5 | Pilotos | Listado y perfil con estadísticas calculadas de resultados reales | ✅ |
| 6 | Copia propia + API propia | Tabla `F1Snapshot`, lectura a través de la BD, sincronización, API de lectura | ✅ (ver nota) |
| V1 | Sistema de diseño | Tokens, tipografía, modo oscuro, componentes (dirección B) | ✅ |
| 7 | Hub de fin de semana de carrera | Hilo automático por GP con resultados y votación de Piloto del Día | ✅ |
| 8 | Ligas de pronósticos en las comunidades | Pronóstico de podio y vuelta rápida (carrera y sprint), puntuación automática, reglas configurables | ✅ (ver nota) |
| V2 | Rediseño de pantallas clave | Feed, tarjeta de post, comunidad, comentarios, logotipo (el hub de carrera va en la rebanada 7) | ✅ |
| 9 | Datos en vivo (opcional) | Prototipo medido antes de comprometerse (§6) | ⏳ |

Antes de encender Premium: resolver R1.

## 10. Calidad

- Vitest para la capa de datos y la puntuación de pronósticos; fixtures reales capturados con `node scripts/capture-f1-fixtures.mjs`.
- Comprobación manual en navegador al terminar cada rebanada, en escritorio y en 390 px de ancho.
- `yarn lint`, `npx tsc --noEmit`, `yarn test` y `yarn build` limpios antes de cada commit.

## 11. Próximos pasos

1. Decidir D4 (noticias) y D5 (rumbo visual).
2. Escribir a Jolpica sobre uso comercial (lo envía el autor del proyecto).
3. Capturar fixtures reales desde una máquina con internet.
4. Empezar por la rebanada 2 (V0 ya está hecho).

## Rebanada 6: copia propia (decisiones)

- **Una tabla de instantáneas en vez de modelos normalizados** (`F1Snapshot`: clave + JSON). Motivo: las páginas ya consumen exactamente estas formas; normalizar resultados, paradas y clasificaciones duplicaría el esquema de Jolpica sin ganar consultas que hoy necesitemos. Si más adelante hacen falta consultas cruzadas (récords, comparar pilotos), se normaliza entonces, partiendo de estas copias.
- **Solo se guarda lo definitivo**: temporadas cerradas y carreras con más de 3 días. La temporada en curso sigue yendo a Jolpica con caché de Next.
- **Tolerante a fallos**: si la BD falla se usa Jolpica; si Jolpica falla y hay copia, se sirve la copia (verificado con el mock apagado).
- **Sincronización** manual o con cron (`/api/f1/sync`, `CRON_SECRET`), máximo 3 temporadas por llamada por el límite de 500 peticiones/hora. Además la copia se rellena sola con el uso.
- **API de lectura** pública, solo temporadas cerradas, con atribución CC BY-NC-SA.
- **Licencia:** copiar y servir los datos sigue sujeto a CC BY-NC-SA 4.0 (uso no comercial). Antes de monetizar hay que acordar licencia con Jolpica. Los datos reales aún no se han probado (sandbox sin acceso).
- No cubre todavía los datos por piloto (`getDriverResults`, `getDriverSeasons`): son carreras de toda su carrera y cambian durante la temporada en curso.

## Rebanada 7: hub de fin de semana (decisiones)

- **Página pública `/gp/<temporada>/<ronda>`** (no depende del dashboard, que será Premium): hilo, diez primeros y Piloto del Día. El dashboard y el módulo "Próximo GP" enlazan a ella.
- **El hilo es un post normal** creado de forma perezosa por un usuario de sistema en la comunidad `formula1` (se crea si no existe), desde la primera sesión del fin de semana. Así comentarios, votos, feed y borrado funcionan sin código nuevo. Si un admin borra el hilo, se recrea en la siguiente visita.
- **Piloto del Día:** abre cuando termina la carrera y hay resultados, cierra a las 48 h; un voto por usuario y carrera, modificable mientras esté abierta; el servidor comprueba que el piloto corrió esa carrera y aplica el límite de votos. Solo se muestran los 5 más votados.
- **Pendiente / límites:** el hilo no se crea para carreras históricas hasta que alguien visita su página (se crea con la fecha de visita); no hay moderación específica ni votos por sesión (sprint); el texto del hilo es fijo. Los comentarios en directo dependen de la rebanada 9.

## Rebanada 8: ligas de pronósticos (decisiones)

- **Una liga por comunidad y temporada**, abierta por el creador (o un admin) con sus reglas: puntos por puesto exacto (5), por piloto en el podio en otro puesto (2), por vuelta rápida (3) y si entran los sprints. Pueden pronosticar todos los usuarios con sesión (no hace falta ser miembro).
- **Qué se pronostica:** podio de la carrera (y del sprint) y, en carrera, la vuelta rápida. **No se pronostica la pole** porque la capa de datos aún no lee la clasificación (la parrilla incluye sanciones); se puede añadir un `getQualifying` más adelante.
- **Cierre:** al empezar la clasificación (clasificación del sprint para el sprint); sin ese dato, al empezar la sesión. Se puede cambiar el pronóstico hasta entonces.
- **Los puntos no se guardan:** se calculan al leer con los resultados oficiales, así que una corrección de resultados reescribe la tabla y no hay tarea de puntuación que mantener. Coste: cada visita a la liga lee los resultados de la temporada (con caché de Next y, para temporadas cerradas, la copia propia). Si hubiese mucha carga se guardaría una caché por carrera.
- **Empates:** desempata el número de puestos exactos; si siguen iguales comparten posición (1, 1, 3).
- **Pendiente:** ligas con invitación o privadas, histórico entre temporadas, notificaciones de cierre, pronóstico de la pole y de abandonos. La vuelta rápida depende de que Jolpica la incluya en los resultados de la temporada (si falta, ese acierto no puntúa); no verificado con datos reales.
