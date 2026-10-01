// Checks the environment variables a FastLap deployment needs, before starting it.
// Usage: node scripts/check-env.mjs            (reads process.env; load a .env file yourself, e.g. `set -a; . ./.env; set +a`)
// Exit code 1 when something required is missing, so it can gate a deploy or run in CI.
const env = process.env
const problems = []
const warnings = []

const has = (name) => typeof env[name] === 'string' && env[name].trim() !== ''
const required = (names, why) => {
  for (const name of names) if (!has(name)) problems.push(`${name} is missing${why ? ` (${why})` : ''}`)
}

required(['DATABASE_URL'], 'PostgreSQL connection string')
if (!has('NEXTAUTH_SECRET') && !has('AUTH_SECRET')) problems.push('NEXTAUTH_SECRET (or AUTH_SECRET) is missing: generate one with `openssl rand -base64 32`')
required(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], 'Google sign-in')
required(['REDIS_URL', 'REDIS_SECRET'], 'Upstash Redis REST URL and token')
required(['UPLOADTHING_SECRET', 'UPLOADTHING_APP_ID'], 'image uploads')

if (has('DATABASE_URL') && !/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) problems.push('DATABASE_URL must start with postgresql://')
if (has('REDIS_URL') && !/^https?:\/\//.test(env.REDIS_URL)) problems.push('REDIS_URL must be the REST URL of Upstash (https://…), not a redis:// URL')
if (has('NEXTAUTH_SECRET') && env.NEXTAUTH_SECRET.length < 24) warnings.push('NEXTAUTH_SECRET is short: use at least 32 random characters')

if (!has('AUTH_URL')) problems.push('AUTH_URL is missing: the public https URL of the site (self-hosted deployments need it)')
else if (!/^https:\/\//.test(env.AUTH_URL) && !/localhost|127\.0\.0\.1/.test(env.AUTH_URL)) warnings.push('AUTH_URL is not https')
if (env.AUTH_TRUST_HOST !== 'true') warnings.push('AUTH_TRUST_HOST should be "true" behind a reverse proxy or in Docker')

if (!has('NEXT_PUBLIC_SITE_URL')) warnings.push('NEXT_PUBLIC_SITE_URL is not set in this environment: it is read at BUILD time, so ignore this if you passed it as a build argument; otherwise canonical URLs, the sitemap and share cards will say http://localhost:3000')
else if (/localhost|127\.0\.0\.1/.test(env.NEXT_PUBLIC_SITE_URL)) warnings.push('NEXT_PUBLIC_SITE_URL points to localhost')

if (!has('CRON_SECRET')) warnings.push('CRON_SECRET is not set: /api/f1/sync is disabled, so finished seasons are not copied into the own database')
if (env.LIVE_SIMULATION === 'true') warnings.push('LIVE_SIMULATION=true: the simulated live page (/live) is public')

if (env.NEXT_PUBLIC_PREMIUM_ENABLED === 'true') {
  required(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'], 'Premium is enabled')
  warnings.push('Premium is enabled: it needs a commercial licence for the F1 data (Jolpica is non-commercial)')
} else {
  warnings.push('NEXT_PUBLIC_PREMIUM_ENABLED is not "true": Premium/Stripe stay hidden (this is a build-time flag)')
}

for (const p of problems) console.error(`ERROR   ${p}`)
for (const w of warnings) console.warn(`WARNING ${w}`)
if (problems.length === 0) console.log(`OK      required variables are present${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}`)
process.exit(problems.length ? 1 : 0)
