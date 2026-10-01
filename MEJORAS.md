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
- **Archivo**: [src/proxy.ts](src/proxy.ts) (antes `middleware.ts`)
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

### ✅ 6. DB hit en cada request autenticada
- **Archivo**: [src/lib/auth.ts](src/lib/auth.ts)
- **Problema**: el callback `jwt` ejecuta `db.user.findFirst` *en cada llamada*, no solo en el login. Cada navegación autenticada genera una query a Postgres.
- **Acción**: ~~rehidratar desde el token~~. **Hecho** — `if (!user) return token` al inicio del callback; el parámetro `user` solo existe en el evento de sign-in. **Nota**: si el rol cambia vía Stripe webhook, el token refleja el cambio en el próximo sign-in.

### ✅ 7. `QueryClient` sin defaults
- **Archivo**: [src/components/Providers.tsx](src/components/Providers.tsx)
- **Problema**: sin `staleTime` ni `cacheTime` configurados, se refetchea por defecto en cada mount → más tráfico del necesario.
- **Acción**: ~~definir defaults razonables~~. **Hecho** — `staleTime: 60_000`, `cacheTime: 300_000`.

### ✅ 8. Página principal con caching desactivado
- **Archivo**: [src/app/page.tsx](src/app/page.tsx)
- **Problema**: `export const dynamic = 'force-dynamic'` + `fetchCache = 'force-no-store'` desactivan todo el caching de Next.
- **Acción**: ~~eliminar las dos directivas~~. **Hecho** — `getAuthSession()` lee cookies internamente y ya marca la página como dinámica automáticamente.

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

### ✅ 13. `.env` comiteado al repo
- **Archivo**: `.env`.
- **Problema**: posible exposición de secretos en el historial.
- **Acción**: **No era un problema real** — `.env` ya estaba en `.gitignore` y nunca fue añadido al historial de git (`git log -- .env` sin resultados). Verificado.

---

## 🧹 Calidad de código

### ✅ 14. Duplicación masiva en el endpoint de voto
- **Archivo**: [src/app/api/subreddit/post/vote/route.ts](src/app/api/subreddit/post/vote/route.ts)
- **Problema**: la lógica de recuento + caché de Redis se repite 3 veces (delete, update, create).
- **Acción**: ~~extraer función `recountAndCache(post)`~~. **Hecho** — 156 → 95 líneas, helper `recountAndCachePost`, tipo `PostForCache` derivado con `Pick<>`, limpiado `(error)` huérfano del catch y `votes: true` redundante del include inicial.

> **Edge case detectado al refactorizar**: si los votos bajan por debajo de `CACHE_AFTER_UPVOTES` tras un toggle/downvote, el caché en Redis queda *stale* (nunca se invalida). Comportamiento heredado del código original. **Resuelto**: se invalida `post:${postId}` cuando `votesAmt < CACHE_AFTER_UPVOTES` y al borrar el post (antes un post borrado seguía sirviéndose desde Redis).

### ✅ 15. Comentarios explicativos innecesarios en handlers
- **Archivo**: [src/app/api/posts/route.ts](src/app/api/posts/route.ts)
- **Problema**: 13 líneas de comentario en español describiendo paso a paso lo que ya hace el código de arriba. Ruido.
- **Acción**: ~~borrar~~. **Hecho.**

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

### ✅ 17. Validación pobre del contenido del post
- **Archivo**: [src/lib/validators/post.ts](src/lib/validators/post.ts)
- **Problema**: `content: z.any()` — se pierde toda validación del JSON de EditorJS.
- **Acción**: ~~definir un schema mínimo~~. **Hecho** — `EditorContent` con `blocks: Array<{ type: string, data: Record<string, any> }>`, `time?` y `version?`. Zod rechaza bodies malformados antes de tocar la BD.

---

## 🏗️ Arquitectónico (ambicioso)

### 18. Migrar mutaciones a Server Actions
- **Problema**: la mayoría de `/api/*` son mutaciones llamadas desde el cliente con `axios`. En App Router las Server Actions son más limpias y eliminan la deserialización manual + validación duplicada.
- **Análisis**: 9 endpoints candidatos. Los 2 de voto (`post/vote`, `comment/vote`) tienen optimistic updates con TanStack Query — migrarlos requiere `useOptimistic` de React 19, **no disponible en Next.js 14**. Los otros 7 (create, delete, subscribe, etc.) son migrables sin drama. **Pendiente** — mejor abordar tras migrar a Next 15.

### ✅ 19. `relationMode = "prisma"` quita integridad referencial
- **Archivo**: [prisma/schema.prisma](prisma/schema.prisma)
- **Problema**: sin FKs en la BD, datos inconsistentes son posibles si algo escribe fuera de Prisma.
- **Acción**: ~~pasar a `foreignKeys`~~. **Hecho** — eliminado `relationMode = "prisma"`, añadidos `@@index` en las FK de `Account`, `Session`, `Subreddit`, `Post` y `Comment`. Aplicado con `prisma db push` sobre Neon sin pérdida de datos.

### ✅ 20. Sin rate limiting
- **Problema**: votar/comentar/crear posts no tiene rate limit. Un script puede ametrallar.
- **Acción**: ~~añadir `@upstash/ratelimit`~~. **Hecho** — [src/lib/ratelimit.ts](src/lib/ratelimit.ts) con 3 limitadores sobre el Redis existente: votos (10/10s), posts (5/min), comentarios (10/min). Devuelve 429 con mensaje en español.

### ✅ 21. Posible SSRF en `/api/link`
- **Archivo**: [src/app/api/link/route.ts](src/app/api/link/route.ts)
- **Problema**: el LinkTool de EditorJS permite cualquier URL para previsualizar → escaneo de red interna.
- **Acción**: ~~validar host y protocolo~~. **Hecho** — `isSafeUrl()` bloquea IPs privadas (127.x, 10.x, 172.16–31.x, 192.168.x, link-local) y protocolos no http/https. Añadido `timeout: 5000` y `maxRedirects: 3`.

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
