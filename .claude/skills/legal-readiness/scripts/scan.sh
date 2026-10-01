#!/bin/sh
# Escáner de señales para preparar un proyecto para publicarlo (RGPD / LSSI-CE).
# Solo lee. Uso: sh scan.sh [ruta-del-proyecto]
# Es un mapa para empezar: no sustituye leer el código ni demuestra que algo NO exista.

ROOT="${1:-.}"
cd "$ROOT" 2>/dev/null || { echo "No existe: $ROOT" >&2; exit 1; }

EXCL="--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=out --exclude-dir=vendor --exclude-dir=venv --exclude-dir=.venv --exclude-dir=__pycache__ --exclude-dir=coverage --exclude-dir=.astro --exclude-dir=target"
SRC="--include=*.ts --include=*.tsx --include=*.js --include=*.jsx --include=*.mjs --include=*.cjs --include=*.astro --include=*.vue --include=*.svelte --include=*.html --include=*.py --include=*.rb --include=*.php --include=*.go --include=*.rs --include=*.java --include=*.kt --include=*.dart --include=*.swift --include=*.cs"

section() { printf '\n## %s\n\n' "$1"; }
show() { # lee de stdin, limita
  head -n "${1:-25}"
}
none() { echo "_(sin señales)_"; }

echo "# Señales para el inventario legal de: $(basename "$(pwd)")"
echo
echo "_Generado por scan.sh. Solo son indicios: confirma cada uno leyendo el código._"

section "Tipo de proyecto (manifiestos)"
found=0
for f in package.json requirements.txt pyproject.toml Gemfile composer.json go.mod Cargo.toml pubspec.yaml pom.xml build.gradle astro.config.mjs next.config.js next.config.mjs; do
  [ -f "$f" ] && { echo "- $f"; found=1; }
done
[ "$found" = 0 ] && none

section "Dependencias con implicaciones de datos"
MANIFESTS=$(ls package.json requirements.txt pyproject.toml Gemfile composer.json go.mod Cargo.toml pubspec.yaml pom.xml 2>/dev/null)
PATTERN='next-auth|auth0|clerk|firebase|supabase|passport|devise|django-allauth|lucia|better-auth|prisma|mongoose|sequelize|typeorm|drizzle|sqlalchemy|psycopg|pg"|mysql|sqlite|redis|upstash|stripe|paypal|mollie|sentry|bugsnag|rollbar|datadog|posthog|mixpanel|amplitude|segment|google-analytics|gtag|gtm|plausible|umami|matomo|hotjar|clarity|intercom|crisp|zendesk|nodemailer|resend|sendgrid|mailgun|postmark|mailchimp|twilio|uploadthing|cloudinary|aws-sdk|@aws|s3|multer|recaptcha|hcaptcha|turnstile|openai|anthropic|maps|mapbox|leaflet|youtube|vimeo|disqus|fingerprint|facebook|fbq|tiktok|adsense|adsbygoogle'
if [ -n "$MANIFESTS" ]; then
  # shellcheck disable=SC2086
  grep -inE "$PATTERN" $MANIFESTS 2>/dev/null | show 40 || true
  [ -z "$(grep -inE "$PATTERN" $MANIFESTS 2>/dev/null)" ] && none
else
  none
fi

section "Modelos de datos y campos personales"
SCHEMAS=$(find . -type f \( -name 'schema.prisma' -o -name 'models.py' -o -name '*.sql' -o -name 'schema.rb' -o -name '*.entity.ts' -o -name '*.model.ts' -o -name '*.model.js' \) -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/venv/*' 2>/dev/null | head -20)
if [ -n "$SCHEMAS" ]; then
  echo "$SCHEMAS" | sed 's/^/- /'
  echo
  echo "Campos que suelen ser datos personales:"
  echo
  echo "$SCHEMAS" | while read -r f; do
    grep -inE 'email|e-mail|phone|telefono|tel[eé]fono|address|direcci[oó]n|birth|nacimiento|dni|nif|passport|ip_?addr|ipAddress|latitude|longitude|location|password|hash|token|secret|avatar|image|photo|foto|username|nombre|full_?name|first_?name|last_?name|surname|gender|ethnic|health|salud|religio' "$f" 2>/dev/null | sed "s#^#  $f:#" | head -25
  done
else
  none
fi

section "Almacenamiento en el navegador y cookies"
# shellcheck disable=SC2086
grep -rInE 'localStorage|sessionStorage|document\.cookie|indexedDB|Set-Cookie|cookies\(\)|cookie-parser|js-cookie|serviceWorker|navigator\.serviceWorker' $EXCL $SRC . 2>/dev/null | show 30
[ -z "$(grep -rIlE 'localStorage|sessionStorage|document\.cookie|indexedDB|Set-Cookie|cookies\(\)|cookie-parser|js-cookie|serviceWorker' $EXCL $SRC . 2>/dev/null)" ] && none

section "Recursos y servicios externos (hosts en el código)"
# shellcheck disable=SC2086
grep -rIhoE 'https?://[A-Za-z0-9._-]+\.[A-Za-z]{2,}' $EXCL $SRC --include=*.json --include=*.css --include=*.md . 2>/dev/null \
  | sed -E 's#https?://##' \
  | grep -viE '^(localhost|127\.|www\.w3\.org|w3\.org|schema\.org|example\.|github\.com|npmjs|registry\.|reactjs\.org|nextjs\.org|tailwindcss\.com|astro\.build|developer\.mozilla|opensource\.org|apache\.org|creativecommons|json-schema\.org|purl\.org|xmlns)' \
  | sort | uniq -c | sort -rn | show 40
[ -z "$(grep -rIhoE 'https?://[A-Za-z0-9._-]+\.[A-Za-z]{2,}' $EXCL $SRC . 2>/dev/null | head -1)" ] && none

section "Incrustaciones, scripts y fuentes de terceros"
# shellcheck disable=SC2086
grep -rInE '<iframe|<script[^>]*src=|fonts\.googleapis|fonts\.gstatic|embed|youtube|vimeo|twitter\.com/widgets|platform\.twitter|connect\.facebook|googletagmanager|google-analytics|adsbygoogle|recaptcha' $EXCL $SRC . 2>/dev/null | show 30
[ -z "$(grep -rIlE '<iframe|<script[^>]*src=|fonts\.googleapis|embed|youtube|vimeo|googletagmanager|google-analytics|recaptcha' $EXCL $SRC . 2>/dev/null)" ] && none

section "Formularios y entradas de datos de usuario"
# shellcheck disable=SC2086
grep -rInE 'type=.?(email|tel|password|date)|name=.?(email|phone|nombre|name)|<form|mailto:|contact|newsletter|suscrib|subscribe' $EXCL $SRC . 2>/dev/null | show 25
[ -z "$(grep -rIlE 'type=.?(email|tel|password|date)|<form|mailto:|newsletter|subscribe' $EXCL $SRC . 2>/dev/null)" ] && none

section "Contenido de usuarios y subidas"
# shellcheck disable=SC2086
grep -rInEi 'upload|multipart|formData|comment|comentario|post\.create|createPost|report|denunci|moderat' $EXCL $SRC . 2>/dev/null | show 20
[ -z "$(grep -rIlEi 'upload|multipart|comment|comentario|moderat' $EXCL $SRC . 2>/dev/null)" ] && none

section "Autenticación y sesiones"
# shellcheck disable=SC2086
grep -rInE 'next-auth|NextAuth|signIn\(|passport|jwt|jsonwebtoken|session|oauth|OAuth|GoogleProvider|login|logout' $EXCL $SRC . 2>/dev/null | show 20
[ -z "$(grep -rIlE 'next-auth|NextAuth|passport|jsonwebtoken|oauth|OAuth|login' $EXCL $SRC . 2>/dev/null)" ] && none

section "Pagos"
# shellcheck disable=SC2086
grep -rInEi 'stripe|paypal|checkout|subscription|premium|invoice|price' $EXCL $SRC . 2>/dev/null | show 12
[ -z "$(grep -rIlEi 'stripe|paypal|checkout|premium' $EXCL $SRC . 2>/dev/null)" ] && none

section "Variables de entorno (nombres, nunca valores)"
for f in .env.example .env.sample .env.template env.example; do
  [ -f "$f" ] && { echo "$f:"; sed -E 's/=.*/=…/' "$f" | grep -vE '^\s*(#|$)' | head -40; }
done
[ ! -f .env.example ] && [ ! -f .env.sample ] && [ ! -f .env.template ] && none
[ -f .env ] && printf '\n⚠️ Existe un archivo .env: no lo leas ni lo subas. ¿Está en .gitignore? %s\n' "$(grep -qE '^\.env' .gitignore 2>/dev/null && echo sí || echo NO)"

section "Documentos legales que ya existen"
find . \( -path ./node_modules -o -path ./.git -o -path ./.next \) -prune -o -type f \( -iname '*privacy*' -o -iname '*privacidad*' -o -iname '*cookie*' -o -iname '*terms*' -o -iname '*condiciones*' -o -iname '*aviso*legal*' -o -iname '*legal*' -o -iname 'LICENSE*' \) -print 2>/dev/null | head -20 | sed 's/^/- /'
[ -z "$(find . \( -path ./node_modules -o -path ./.git -o -path ./.next \) -prune -o -type f \( -iname '*privacy*' -o -iname '*privacidad*' -o -iname '*cookie*' -o -iname '*terms*' -o -iname '*condiciones*' -o -iname '*legal*' \) -print 2>/dev/null | head -1)" ] && none

section "Datos del titular visibles"
# shellcheck disable=SC2086
grep -rInE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' $EXCL $SRC --include=*.md --include=*.json . 2>/dev/null | grep -v 'noreply\|example\|\.invalid\|@types\|@[a-z-]*/' | show 15
echo
echo "_Fin. Siguiente paso: leer los archivos señalados y completar el inventario._"
