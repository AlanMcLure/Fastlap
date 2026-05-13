# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FastLap is a Reddit-style social network for Formula 1 fans (Spanish-language UI). It combines forum-style communities ("subreddits") with an F1 data dashboard gated behind a paid Premium tier. Built with Next.js 14 (App Router), TypeScript, Tailwind + Shadcn UI ("new-york" style, slate base color), Prisma/Postgres, NextAuth, Upstash Redis, UploadThing, and Stripe.

## Common commands

```bash
yarn dev          # start Next.js dev server
yarn build        # production build (also required before `start`)
yarn start        # run production build
yarn lint         # next lint (eslint-config-next)
npx prisma generate    # regenerate Prisma client (runs automatically on `yarn install` via postinstall)
npx prisma migrate dev # apply schema migrations locally
docker-compose up      # run the containerized app (standalone Next.js output, port 3000)
```

No test runner is configured.

## Required environment variables

`.env` must define: `DATABASE_URL` (Postgres), `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`, `REDIS_URL`, `REDIS_SECRET`. Stripe flows additionally need `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (referenced in [src/app/api/webhook/route.ts](src/app/api/webhook/route.ts)).

## Architecture

### Auth and roles

- NextAuth with Google provider, JWT session strategy, Prisma adapter ([src/lib/auth.ts](src/lib/auth.ts)). On first sign-in, users without a username get one auto-generated via `nanoid(10)`. Use `getAuthSession()` from this file in server components and route handlers.
- `UserRole` enum: `USER | ADMIN | PREMIUM` ([prisma/schema.prisma](prisma/schema.prisma)). Role is mirrored onto the session token via the `session` and `jwt` callbacks.
- [src/middleware.ts](src/middleware.ts) gates `/r/*/submit`, `/r/create`, `/settings`, and `/f1-dashboard/*` behind auth. `/f1-dashboard/*` additionally requires `ADMIN` or `PREMIUM`; non-eligible users are redirected to `/not-authorized`.
- Stripe `checkout.session.completed` webhook ([src/app/api/webhook/route.ts](src/app/api/webhook/route.ts)) is the only path that promotes a `USER` to `PREMIUM` — there is no manual upgrade endpoint.

### Data model

The Prisma schema uses `relationMode = "prisma"` (no DB-level foreign keys — referential integrity is enforced by Prisma at the app layer). Core models:

- `Subreddit` → `Post` → `Comment` (self-referencing via `replyToId` for nested replies)
- `Vote` and `CommentVote` are composite-keyed join tables (`[userId, postId]`, `[userId, commentId]`) with a `VoteType` enum (`UP | DOWN`)
- `Subscription` joins users to subreddits they follow

`Post.content` is `Json?` and stores EditorJS block data — never plain text. Use [src/components/EditorOutput.tsx](src/components/EditorOutput.tsx) to render it; rich post creation goes through [src/components/Editor.tsx](src/components/Editor.tsx).

### Redis caching for hot posts

[src/app/api/subreddit/post/vote/route.ts](src/app/api/subreddit/post/vote/route.ts) caches a post into Upstash Redis as a `post:${postId}` hash once its net vote count reaches `CACHE_AFTER_UPVOTES` (currently `1`). The `CachedPost` shape lives in [src/types/redis.d.ts](src/types/redis.d.ts). Any read path that consumes cached posts must be compatible with this shape.

### App Router layout

- Route groups: `(auth)` holds `/sign-in` and `/sign-up`. The `@authModal` parallel route slot ([src/app/@authModal/](src/app/@authModal/)) uses Next.js intercepting routes (`(.)sign-in`, `(.)sign-up`) to render auth as a modal over the current page; the root layout renders both `{children}` and `{authModal}` ([src/app/layout.tsx](src/app/layout.tsx)).
- `/r/[slug]` is a subreddit page; `/r/[slug]/submit` is the post-creation page; `/r/create` creates a subreddit.
- `/u/[slug]` is a user profile.
- `/f1-dashboard/` contains `pilotos`, `carreras`, `noticias` sections with its own sidebar ([src/app/f1-dashboard/layout.tsx](src/app/f1-dashboard/layout.tsx)).

### API surface

Under [src/app/api/](src/app/api/):

- `auth/[...nextauth]` — NextAuth handler
- `posts/` (GET, paginated by `limit`/`page`; filters by `subredditName`, `username`, or the caller's followed communities)
- `subreddit/{post/{create,delete,vote,comment},subscribe,unsubscribe}` and `subreddit/[slug]`
- `users/[slug]`, `username/` (rename), `profile-image/`, `search/`
- `link/` (URL preview for EditorJS LinkTool), `uploadthing/` (image uploads via UploadThing — see [core.ts](src/app/api/uploadthing/core.ts))
- `checkout/` + `prices/` + `webhook/` — Stripe Premium subscription flow
- `ergast/{calendar,driver,laps,race-results,standings}` — server-side proxies to the public [ergast.com](https://ergast.com) F1 API; all are season-aware and paginate in-memory before returning

Request bodies are validated with Zod schemas in [src/lib/validators/](src/lib/validators/) (`post.ts`, `comment.ts`, `subreddit.ts`, `username.ts`, `vote.ts`, `piloto.ts`).

### Client state and data fetching

- Global providers in [src/components/Providers.tsx](src/components/Providers.tsx): `SessionProvider` (NextAuth) wrapped in a `QueryClientProvider` (TanStack Query v4). Client components that mutate server state should use `useMutation` with optimistic updates — see [Editor.tsx](src/components/Editor.tsx) and the post-vote components in [src/components/post-vote/](src/components/post-vote/) for the established pattern.
- Pagination constant: `PAGINATION_RESULTS = 6` in [src/config.ts](src/config.ts).
- Date formatting: [src/lib/utils.ts](src/lib/utils.ts) exports `formatTimeToNow` with a custom Spanish locale (`hace 5m`, `justo ahora`, etc.) — use this instead of raw `date-fns` calls so wording stays consistent.
- `cn(...)` (clsx + tailwind-merge) is also in `utils.ts`.

### Prisma client singleton

[src/lib/db.ts](src/lib/db.ts) is marked `"server-only"` and stashes the client on `global.cachedPrisma` outside production to survive hot reloads. Always import as `import { db } from '@/lib/db'`. Never instantiate `PrismaClient` directly elsewhere.

## Conventions

- Path alias: `@/*` → `src/*` ([tsconfig.json](tsconfig.json)). TypeScript runs with `strict: false` and `noImplicitAny: false` — typing is loose; don't over-tighten existing files when making unrelated changes.
- User-facing text is in Spanish (toasts, errors, button labels). Keep this consistent in new UI.
- Shadcn primitives live in [src/components/ui/](src/components/ui/); feature components live alongside the page-level components in [src/components/](src/components/) (with `comments/`, `post-vote/`, `f1-dashboard/`, `homepage/`, `renderers/` subfolders).
- Next image config whitelists `uploadthing.com`, `lh3.googleusercontent.com`, `utfs.io` ([next.config.js](next.config.js)) — add new external hosts there before using them.
- The build target is `output: 'standalone'` for the Docker image; don't switch without updating the Dockerfile.
