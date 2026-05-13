# Mejoras propuestas — FastLap

Inventario de mejoras detectadas tras revisar el código. Agrupadas por impacto y con referencias a archivos concretos.

---

## 🐛 Bugs reales

### ✅ 1. Import basura en `auth.ts`
- **Archivo**: [src/lib/auth.ts:4](src/lib/auth.ts#L4)
- **Problema**: `import { as } from '@upstash/redis/zmscore-a4ec4c2a'` — import accidental de autocomplete que no se usa en ningún sitio.
- **Acción**: ~~borrar la línea~~. **Hecho.**

### ✅ 2. Off-by-one en el caché de votos
- **Archivo**: [src/app/api/subreddit/post/vote/route.ts](src/app/api/subreddit/post/vote/route.ts)
- **Problema**: `post.votes` se carga *antes* de hacer la mutación (create/update/delete). El `reduce` posterior recuenta sobre datos viejos, así que el `votesAmt` que se cachea en Redis siempre va por detrás de la realidad.
- **Acción**: ~~recontar a partir de datos frescos tras la mutación~~. **Hecho** — `recountAndCachePost` hace `db.vote.findMany` fresh.

### ✅ 3. `Stripe` instanciado sin `apiVersion`
- **Archivo**: [src/app/api/webhook/route.ts:6](src/app/api/webhook/route.ts#L6)
- **Problema**: `new Stripe(process.env.STRIPE_SECRET_KEY)` sin `apiVersion` usa la default de la cuenta — puede romper silenciosamente cuando Stripe actualiza la API por defecto.
- **Acción**: ~~fijar `apiVersion` explícitamente~~. **Hecho** — `apiVersion: '2024-04-10'` + `typescript: true` en las 3 instancias (checkout, webhook, premium), coincidiendo con la que ya tenía `prices/route.ts`.

### ✅ 4. Página `/not-authorized` referenciada pero inexistente
- **Archivo**: [src/middleware.ts:17](src/middleware.ts#L17)
- **Problema**: el middleware redirige a `/not-authorized` cuando un `USER` intenta acceder a `/f1-dashboard/*`, pero la página no existe en `src/app/`. El usuario acaba en un 404.
- **Acción**: ~~crear `src/app/not-authorized/page.tsx`~~. **Hecho** — página 403 con CTA a `/premium`.

### ✅ 5. `console.log` y `console.error` en producción
- **Archivos**: [src/app/api/webhook/route.ts](src/app/api/webhook/route.ts), [src/lib/utils.ts](src/lib/utils.ts)
- **Problema**: ESLint ya está configurado con `"no-console": "warn"` pero hay varios casos. En producción ensucian logs y, en `utils.ts`, exponen detalles de errores.
- **Acción**: ~~eliminar o reemplazar por logging estructurado~~. **Hecho parcialmente**:
  - `utils.ts`: eliminados los **10 `console.error`** (5 en `authenticated` + 5 en `adminAuthenticated`) que volcaban detalles de axios. El error se relanza igualmente, así que el caller los maneja sin perder información. El try/catch entero se simplificó a 1 línea: ya no hacía nada útil más que loggear ruido.
  - **Bonus**: descubierto que `adminAuthenticated` era **código muerto** (definido en `utils.ts` pero nadie lo usaba). Eliminado.
  - **Bonus 2**: import muerto de `authenticated` en [pilotos/page.tsx](src/app/f1-dashboard/pilotos/page.tsx) eliminado (se importaba pero no se usaba).
  - **Mantenidos**: los `console.error` que están en `catch` legítimos (`PostFeed`, `Editor`, `CheckoutButton`, varias pages del dashboard, `prices/route.ts`) y el `console.log` informativo del webhook para eventos no manejados — son útiles para debugging en runtime.

---

## ⚡ Rendimiento

### 6. DB hit en cada request autenticada
- **Archivo**: [src/lib/auth.ts:37](src/lib/auth.ts#L37)
- **Problema**: el callback `jwt` ejecuta `db.user.findFirst` *en cada llamada*, no solo en el login. Cada navegación autenticada genera una query a Postgres.
- **Acción**: rehidratar desde el token; solo tocar BD en el primer sign-in (`user` presente) o tras un trigger explícito.

### 7. `QueryClient` sin defaults
- **Archivo**: [src/components/Providers.tsx:11](src/components/Providers.tsx#L11)
- **Problema**: sin `staleTime` ni `gcTime` configurados, se refetchea por defecto en cada mount → más tráfico del necesario.
- **Acción**: definir defaults razonables (ej. `staleTime: 60_000`).

### 8. Página principal con caching desactivado
- **Archivo**: [src/app/page.tsx:9-10](src/app/page.tsx#L9-L10)
- **Problema**: `export const dynamic = 'force-dynamic'` + `fetchCache = 'force-no-store'` desactivan todo el caching de Next. Revisar si realmente es necesario.
- **Acción**: revisar y, donde se pueda, dejar que Next decida.

---

## 📦 Dependencias muy desfasadas

| Dep | Tienes | Actual (may 2026) | Notas |
|---|---|---|---|
| Next.js | 14.0.4 | 15.x | Migración no trivial pero soportada |
| Prisma + @prisma/client | 4.14 | 6.x | Cambios en API, vale la pena |
| NextAuth | v4 | Auth.js v5 | Simplifica mucho `authOptions` |
| @tanstack/react-query | v4 | v5 | API tweaks (mutationFn, etc.) |
| TypeScript | 5.0.4 | 5.x más reciente | Sencillo |
| date-fns | 3.3.1 | 4.x | Cambios menores |

**Acción**: planificar migraciones por separado, empezando por las más pequeñas (TypeScript, React Query) y dejando Next/Prisma/Auth.js para sesiones dedicadas.

---

## 🔧 Configuración

### ✅ 9. Dos configs de Tailwind
- **Archivos**: `tailwind.config.js` **y** `tailwind.config.ts` en la raíz.
- **Problema**: una sobra. `components.json` apunta a `tailwind.config.ts`, así que `.js` es el que se puede borrar.
- **Acción**: ~~eliminar `tailwind.config.js`~~. **Hecho** — consolidado todo en el `.ts` y borrado el `.js`. El `.ts` original estaba **incompleto**: faltaba el plugin `@tailwindcss/typography` (necesario para las clases `prose` del editor), los `backgroundImage` con gradientes, `fontFamily.sans` con Inter y los `content` paths correctos. Si Tailwind estaba leyendo el `.ts` antes, las clases `prose` no funcionaban; si estaba leyendo el `.js`, hubieran reventado el día que alguien borrase el `.js` "redundante". Ahora queda solo el `.ts` con todo migrado.

### ✅ 10. `tsconfig.json` débil
- **Archivo**: [tsconfig.json](tsconfig.json)
- **Problema**: `target: "es5"` (innecesario en 2026), `strict: false`, `noImplicitAny: false`. Hay safety neta perdida.
- **Acción**: ~~subir a `target: "es2022"` o más, activar `strict: true` y arreglar lo que rompa~~. **Hecho** — `target: "es2022"`, `strict: true`, eliminado `noImplicitAny: false`. Destapó 43 errores de tipos en 14 archivos, todos arreglados (ver detalle abajo).

### ✅ 11. `images.domains` deprecado
- **Archivo**: [next.config.js:4](next.config.js#L4)
- **Problema**: Next 14+ prefiere `remotePatterns` por seguridad (pathname matching).
- **Acción**: ~~migrar a `remotePatterns`~~. **Hecho** — 3 patterns con `protocol: 'https'`.

### ✅ 12. `package.json` mal nombrado
- **Archivo**: [package.json:2](package.json#L2)
- **Problema**: `"name": "reddit-clone"`, debería ser `"fastlap"`.
- **Acción**: ~~renombrar~~. **Hecho.**

### 13. ⚠️ `.env` comiteado al repo
- **Archivo**: `.env` (890 bytes en el repo).
- **Problema crítico**: si contiene secretos reales, están expuestos en el historial de git.
- **Acción**: rotar todos los secretos, añadir `.env` a `.gitignore`, y limpiar el historial (`git filter-repo` o equivalente).

---

## 🧹 Calidad de código

### ✅ 14. Duplicación masiva en el endpoint de voto
- **Archivo**: [src/app/api/subreddit/post/vote/route.ts](src/app/api/subreddit/post/vote/route.ts)
- **Problema**: la lógica de recuento + caché de Redis se repite 3 veces (delete, update, create).
- **Acción**: ~~extraer función `recountAndCache(post)`~~. **Hecho** — 156 → 95 líneas, helper `recountAndCachePost`, tipo `PostForCache` derivado con `Pick<>`, limpiado `(error)` huérfano del catch y `votes: true` redundante del include inicial.

> **Edge case detectado al refactorizar**: si los votos bajan por debajo de `CACHE_AFTER_UPVOTES` tras un toggle/downvote, el caché en Redis queda *stale* (nunca se invalida). Comportamiento heredado del código original. Mejora pendiente: invalidar `post:${postId}` cuando `votesAmt < CACHE_AFTER_UPVOTES`.

### 15. Comentarios explicativos innecesarios en handlers
- **Archivo**: [src/app/api/posts/route.ts:93-105](src/app/api/posts/route.ts#L93-L105)
- **Problema**: 13 líneas de comentario en español describiendo paso a paso lo que ya hace el código de arriba. Ruido.
- **Acción**: borrar.

### ✅ 16. `@ts-expect-error` / `@ts-ignore` repartidos
- **Archivos**: 4 en async Server Components ([layout.tsx](src/app/layout.tsx), [page.tsx](src/app/page.tsx), [r/[slug]/post/[postId]/page.tsx](src/app/r/[slug]/post/[postId]/page.tsx) ×2) y 1 en [Editor.tsx](src/components/Editor.tsx).
- **Problema**: silenciar el compilador en vez de tipar bien.
- **Acción**: ~~tipar correctamente~~. **Hecho** — los 4 de Server Components desaparecen al subir `@types/react` 18.2.7 → 18.3.28 y TypeScript 5.0.4 → 5.9.3 (TS 5.0 + types 18.2 no soportaban `async () => JSX.Element`). El `@ts-ignore` del Editor se arregló cambiando `useRef<HTMLTextAreaElement>(null)` a `useRef<HTMLTextAreaElement | null>(null)` para obtener un `MutableRefObject`.

---

## 🆕 Bugs adicionales descubiertos al activar `strict`

### ✅ Bug zombie en `CommentsSection`
- **Archivo**: [src/components/CommentsSection.tsx](src/components/CommentsSection.tsx)
- **Problema**: la interfaz declaraba `comments: ExtendedComment[]` como prop requerido, pero el componente nunca lo leía — hacía su propio `db.comment.findMany` internamente. El caller solo pasaba `postId` y TS no se quejaba porque el `@ts-expect-error` lo silenciaba.
- **Acción**: eliminada la prop fantasma + los tipos `ExtendedComment`/`ReplyComment` que solo se usaban en ella.

### ✅ Bug latente en `PilotoCard`
- **Archivo**: [src/components/f1-dashboard/PilotoCard.tsx:20](src/components/f1-dashboard/PilotoCard.tsx#L20)
- **Problema**: `pilot.givenName + ' ' + pilot.familyName ?? 'Nombre desconocido'` — por precedencia, la concatenación con `+` siempre devuelve string (`"null null"` si ambos son null), así que el `??` **nunca aplica**. TS 5.0 no detectaba esto; TS 5.9 sí (TS2869).
- **Acción**: reescrito como `pilot.givenName && pilot.familyName ? \`${pilot.givenName} ${pilot.familyName}\` : 'Nombre desconocido'`.

### ✅ Catches con `error.message` sin guard
- **Archivos**: 5 endpoints `/api/ergast/*`, [webhook/route.ts](src/app/api/webhook/route.ts), [carrera/[season]/[carreraId]/page.tsx](src/app/f1-dashboard/carrera/[season]/[carreraId]/page.tsx).
- **Problema**: en `strict` los `catch (err)` reciben `unknown`, no `any`. Acceder a `.message` rompía.
- **Acción**: añadido `err instanceof Error ? err.message : 'Unknown error'` en todos.

### ✅ Tipos de estado inferidos como `null` o `never[]`
- **Archivos**: [DriverStandings.tsx](src/components/f1-dashboard/DriverStandings.tsx), [LapTimesChart.tsx](src/components/f1-dashboard/LapTimesChart.tsx), [RaceCalendar.tsx](src/components/f1-dashboard/RaceCalendar.tsx).
- **Problema**: `useState([])` → `never[]`, `useState(null)` → `null`. Cualquier set posterior con datos reales fallaba en `strict`.
- **Acción**: tipos explícitos en cada `useState<T>(...)`. Para los datos crudos de la API Ergast se usó `any` (API externa enorme y poco estable — no merece la pena tipar a fondo aquí).

### ✅ Stripe + env vars `string | undefined`
- **Archivos**: [checkout/route.ts](src/app/api/checkout/route.ts), [webhook/route.ts](src/app/api/webhook/route.ts), [premium/page.tsx](src/app/premium/page.tsx).
- **Problema**: `new Stripe(process.env.STRIPE_SECRET_KEY)` — el tipo `string | undefined` no encaja con `string`. Stripe `unit_amount` es `number | null`.
- **Acción**: añadidos `!` en env vars (el código ya asumía que existen) y `?? 0` en `unit_amount`.

### ✅ Tipo de prop faltante en `RaceResults`
- **Archivo**: [src/components/f1-dashboard/RaceResults.tsx](src/components/f1-dashboard/RaceResults.tsx)
- **Problema**: `({ raceData })` sin tipar.
- **Acción**: añadida `interface RaceResultsProps { raceData: any[] | null }`.

### 17. Validación pobre del contenido del post
- **Archivo**: [src/lib/validators/post.ts:13](src/lib/validators/post.ts#L13)
- **Problema**: `content: z.any()` — se pierde toda validación del JSON de EditorJS.
- **Acción**: definir un schema mínimo del shape de EditorJS (`{ blocks: Array<...> }`).

---

## 🏗️ Arquitectónico (ambicioso)

### 18. Migrar mutaciones a Server Actions
- **Problema**: la mayoría de `/api/*` son mutaciones llamadas desde el cliente con `axios`. En App Router las Server Actions son más limpias y eliminan la deserialización manual + validación duplicada.
- **Acción**: pasar gradualmente create/delete/vote a Server Actions.

### 19. `relationMode = "prisma"` quita integridad referencial
- **Archivo**: [prisma/schema.prisma:11](prisma/schema.prisma#L11)
- **Problema**: sin FKs en la BD, datos inconsistentes son posibles si algo escribe fuera de Prisma o una transacción falla a medias.
- **Acción**: si tu Postgres soporta FKs (lo soporta), pasar a `foreignKeys`.

### 20. Sin rate limiting
- **Problema**: votar/comentar/crear posts no tiene rate limit. Un script puede ametrallar.
- **Acción**: añadir `@upstash/ratelimit` sobre los endpoints públicos.

### 21. Posible SSRF en `/api/link`
- **Archivo**: [src/app/api/link/route.ts](src/app/api/link/route.ts)
- **Problema**: el LinkTool de EditorJS permite que un usuario meta cualquier URL para previsualizar. Sin validación, un atacante puede usarla para escanear la red interna.
- **Acción**: validar host (no IPs privadas), protocolo (solo `http/https`), y poner timeout corto.

---

## Orden de ataque sugerido

1. **Bugs** (5–10 min): #1, #2, #4 — los más rápidos y de mayor riesgo.
2. **Refactor del endpoint de voto** (#14, ~15 min): elimina la duplicación que hizo el bug #2 difícil de detectar.
3. **Limpieza de config** (#9, #11, #12, ~5 min).
4. **Tipado** (#10, #16): endurecer `tsconfig` destapa bugs latentes.
5. **Rotación de secretos** (#13): si el `.env` tiene credenciales reales, urgente.
6. **Stripe/console.log** (#3, #5): higiene.
7. **Migraciones grandes** (Next 15, Auth.js v5, Prisma 6): sesiones dedicadas.
8. **Mejoras arquitectónicas** (#18–21): último, cuando lo demás esté limpio.
