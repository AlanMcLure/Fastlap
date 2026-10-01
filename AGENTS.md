# AGENTS.md

Guidance for any coding agent or contributor working in this repository.

## Project overview

FastLap is a Reddit-style social network for Formula 1 fans (Spanish-language UI). It combines forum-style communities ("subreddits") with an F1 data dashboard gated behind a paid Premium tier. Built with Next.js 16 (App Router), React 18, TypeScript (`strict: true`), Tailwind 3 + Shadcn UI ("new-york" style, slate base color), Prisma 4/Postgres (Neon), NextAuth v4, Upstash Redis, UploadThing, and Stripe.

## Common commands

```bash
yarn dev               # start Next.js dev server
yarn lint              # eslint . (flat config)
yarn build             # production build (also required before `start`)
yarn start             # run production build
npx tsc --noEmit       # type check (strict)
npx prisma generate    # regenerate Prisma client (runs automatically on `yarn install` via postinstall)
npx prisma migrate dev # apply schema migrations locally (the production DB was synced with `prisma db push`)
docker-compose up      # run the containerized app (standalone Next.js output, port 3000)
```

Yarn is the package manager (`yarn.lock`). No test runner is configured.

Linting uses ESLint 9 flat config ([eslint.config.mjs](eslint.config.mjs), `eslint-config-next` core-web-vitals + typescript) via `yarn lint` (`eslint .`). Errors fail the command; the new React Compiler rules (`react-hooks/set-state-in-effect`, `react-hooks/refs`) and `no-explicit-any` are set to warnings until the existing components are refactored. The Docker image builds on `node:22-alpine` (Next 16 needs Node 20.9+).

## Required environment variables

`.env` must define: `DATABASE_URL` (Postgres), `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`, `REDIS_URL`, `REDIS_SECRET` (see `.env.example`). Stripe flows additionally need `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (used in [src/app/api/webhook/route.ts](src/app/api/webhook/route.ts); not yet listed in `.env.example`). Never commit real secrets.

## Architecture

### Auth and roles

- NextAuth with Google provider, JWT session strategy, Prisma adapter ([src/lib/auth.ts](src/lib/auth.ts)). On first sign-in, users without a username get one auto-generated via `nanoid(10)`. Use `getAuthSession()` from this file in server components and route handlers.
- `UserRole` enum: `USER | ADMIN | PREMIUM` ([prisma/schema.prisma](prisma/schema.prisma)). Role is mirrored onto the session token via the `session` and `jwt` callbacks. The `jwt` callback only hits the DB at sign-in (when `user` is present), not on every request — so a role change (e.g. after a Stripe upgrade) shows up in the token only after the user signs in again.
- [src/middleware.ts](src/middleware.ts) gates `/r/*/submit`, `/r/create`, `/settings`, and `/f1-dashboard/*` behind auth. `/f1-dashboard/*` additionally requires `ADMIN` or `PREMIUM`; non-eligible users are redirected to `/not-authorized`. (Next 16 renames the `middleware` file convention to `proxy`; the current file still works but is deprecated.)
- Stripe `checkout.session.completed` webhook ([src/app/api/webhook/route.ts](src/app/api/webhook/route.ts)) is the only path that promotes a `USER` to `PREMIUM` — there is no manual upgrade endpoint.

### Data model

The Prisma schema uses real database foreign keys (the former `relationMode = "prisma"` was removed) plus indexes on FK columns. Core models:

- `Subreddit` → `Post` → `Comment` (self-referencing via `replyToId` for nested replies)
- `Vote` and `CommentVote` are composite-keyed join tables (`[userId, postId]`, `[userId, commentId]`) with a `VoteType` enum (`UP | DOWN`)
- `Subscription` joins users to subreddits they follow

`Post.content` is `Json?` and stores EditorJS block data — never plain text. It is validated with a real EditorJS schema in [src/lib/validators/post.ts](src/lib/validators/post.ts). Use [src/components/EditorOutput.tsx](src/components/EditorOutput.tsx) to render it; rich post creation goes through [src/components/Editor.tsx](src/components/Editor.tsx).

### Redis: hot-post cache and rate limiting

- [src/app/api/subreddit/post/vote/route.ts](src/app/api/subreddit/post/vote/route.ts) caches a post into Upstash Redis as a `post:${postId}` hash once its net vote count reaches `CACHE_AFTER_UPVOTES` (currently `1`). The count is recomputed from fresh DB data after each mutation (`recountAndCachePost`). The `CachedPost` shape lives in [src/types/redis.d.ts](src/types/redis.d.ts); any read path that consumes cached posts must be compatible with it.
- [src/lib/ratelimit.ts](src/lib/ratelimit.ts) defines `@upstash/ratelimit` sliding-window limiters: votes (10/10s), posts (5/min), comments (10/min). Apply them in any new mutation endpoint of the same kind.

### App Router layout

- Route groups: `(auth)` holds `/sign-in` and `/sign-up`. The `@authModal` parallel route slot ([src/app/@authModal/](src/app/@authModal/)) uses intercepting routes (`(.)sign-in`, `(.)sign-up`) to render auth as a modal over the current page; the root layout renders both `{children}` and `{authModal}` ([src/app/layout.tsx](src/app/layout.tsx)).
- `/r/[slug]` is a subreddit page; `/r/[slug]/submit` is the post-creation page; `/r/create` creates a subreddit.
- `/u/[slug]` is a user profile.
- `/f1-dashboard/` contains `pilotos`, `carreras`, `noticias` sections (plus `piloto`, `carrera`, `noticia` detail routes) with its own sidebar ([src/app/f1-dashboard/layout.tsx](src/app/f1-dashboard/layout.tsx)).
- Other pages: `/premium`, `/faqs`, `/settings`, `/not-authorized`.
- **Next 16 async APIs:** `params` in pages and route handlers is a `Promise<{...}>` and must be awaited; `headers()` is async. Follow the existing pages as the pattern.

### API surface

Under [src/app/api/](src/app/api/):

- `auth/[...nextauth]` — NextAuth handler
- `posts/` (GET, paginated by `limit`/`page`; filters by `subredditName`, `username`, or the caller's followed communities)
- `subreddit/{post/{create,delete,vote,comment},subscribe,unsubscribe}` and `subreddit/[slug]`
- `users/[slug]`, `username/` (rename), `profile-image/`, `search/`
- `link/` (URL preview for EditorJS LinkTool; `isSafeUrl()` blocks private IPs and non-http(s) protocols to prevent SSRF — keep that check on any server-side fetch of user-supplied URLs), `uploadthing/` (image uploads — see [core.ts](src/app/api/uploadthing/core.ts))
- `checkout/` + `prices/` + `webhook/` — Stripe Premium subscription flow (Stripe API version pinned to `2024-04-10`)
- `ergast/{calendar,driver,laps,race-results,standings}` — server-side proxies to the public [ergast.com](https://ergast.com) F1 API; all are season-aware and paginate in-memory before returning. Their `fetch` calls pass `{ cache: 'force-cache' }` explicitly because Next 15+ no longer caches `fetch` by default.

Request bodies are validated with Zod schemas in [src/lib/validators/](src/lib/validators/) (`post.ts`, `comment.ts`, `subreddit.ts`, `username.ts`, `vote.ts`, `piloto.ts`).

### Client state and data fetching

- Global providers in [src/components/Providers.tsx](src/components/Providers.tsx): `SessionProvider` (NextAuth) wrapped in a `QueryClientProvider` (TanStack Query v4, `staleTime` 60s, `cacheTime` 300s). Client components that mutate server state should use `useMutation` with optimistic updates — see [Editor.tsx](src/components/Editor.tsx) and the post-vote components in [src/components/post-vote/](src/components/post-vote/) for the established pattern.
- Pagination constant: `PAGINATION_RESULTS = 6` in [src/config.ts](src/config.ts).
- Date formatting: [src/lib/utils.ts](src/lib/utils.ts) exports `formatTimeToNow` with a custom Spanish locale (`hace 5m`, `justo ahora`, etc.) — use this instead of raw `date-fns` calls so wording stays consistent.
- `cn(...)` (clsx + tailwind-merge) is also in `utils.ts`.

### Prisma client singleton

[src/lib/db.ts](src/lib/db.ts) is marked `"server-only"` and stashes the client on `global.cachedPrisma` outside production to survive hot reloads. Always import as `import { db } from '@/lib/db'`. Never instantiate `PrismaClient` directly elsewhere.

## Conventions

- Path alias: `@/*` → `src/*` ([tsconfig.json](tsconfig.json)). TypeScript runs with `strict: true`; new and edited code must type-check without `any` shortcuts.
- User-facing text is in Spanish (toasts, errors, button labels). Keep this consistent in new UI.
- Shadcn primitives live in [src/components/ui/](src/components/ui/); feature components live alongside the page-level components in [src/components/](src/components/) (with `comments/`, `post-vote/`, `f1-dashboard/`, `homepage/`, `renderers/` subfolders).
- ESLint rule `no-console` is `warn`: only keep `console.error` in legitimate `catch` blocks.
- Next image config whitelists `uploadthing.com`, `lh3.googleusercontent.com`, `utfs.io` ([next.config.js](next.config.js)) — add new external hosts there before using them.
- The build target is `output: 'standalone'` for the Docker image; don't switch without updating the Dockerfile.
- [MEJORAS.md](MEJORAS.md) tracks the improvement backlog (done items are marked ✅); check it before proposing refactors and update it when you complete an item.
