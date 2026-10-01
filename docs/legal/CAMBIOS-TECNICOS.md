# Cambios técnicos hechos por motivos legales

Registro de lo que se cambió en el código a raíz de los «huecos técnicos» del [README](README.md), con **cómo estaba antes** para poder revertirlo o explicárselo al abogado. Más reciente primero.

## 4. Edad mínima y aceptación de las condiciones (hueco 4)

**Antes**
- Iniciar sesión con Google creaba la cuenta sin preguntar nada. Las condiciones y la política decían «debes tener al menos 14 años», pero no había ninguna declaración ni constancia de aceptación.
- `User` no guardaba nada sobre esto; `pages` de Auth.js solo definía `signIn`, y los errores de Auth.js iban a su página genérica `/api/auth/error`.

**Ahora**
- **Casilla obligatoria** en el formulario de acceso (`src/components/UserAuthForm.tsx`, usado en `/sign-in` y `/sign-up`, también en el modal): «Tengo al menos 14 años y acepto las Condiciones de uso y la Política de privacidad». El botón de Google está desactivado hasta marcarla.
- Al pulsar, el formulario pone una cookie propia, técnica y de 10 minutos (`fastlap-consent=<versión>`). En `signIn` (`src/lib/auth.ts`) una **cuenta nueva solo se crea si esa cookie es válida** (`canSignIn` en `src/lib/consent.ts`); quien ya tiene cuenta entra sin más. Si falta, se rechaza y se vuelve a `/sign-in?error=AccessDenied` con un mensaje («Para crear tu cuenta debes confirmar…»).
- Al crearse el usuario (`events.createUser`) se guardan **`User.termsAcceptedAt`** (fecha y hora) y **`User.termsVersion`** (hoy `1`, constante `TERMS_VERSION`). Se incluyen en la exportación de datos.
- Hay que **aplicar el esquema** (`prisma db push`): dos columnas nuevas, opcionales, sin migración de datos.
- `error: '/sign-in'` en las páginas de Auth.js: los errores de acceso se muestran en nuestra página.
- Tests: `src/lib/consent.test.ts` (reglas). Se probó con un navegador real contra un proveedor OAuth falso local (no con Google): casilla desactivada/activada, alta con casilla (se guarda fecha y versión), intento directo sin casilla (rechazado, sin crear usuario, mensaje visible) y usuario existente sin casilla (entra).

**Límites conocidos (para el abogado)**
- **Es una declaración, no una verificación.** Google no nos da la fecha de nacimiento (solo identificador, correo, nombre y foto), así que no se puede comprobar la edad. Una verificación real (documento, tarjeta, estimación facial) pediría más datos y un tercero, y la AEPD recomienda proporcionalidad: para un foro sin contenido para adultos suele bastar la declaración. El abogado debe confirmarlo.
- La cookie la pone el navegador, así que alguien con conocimientos puede saltarse la casilla. No es una barrera de seguridad, solo deja constancia de lo que se declaró.
- Las **cuentas anteriores** a este cambio tienen `termsAcceptedAt` en `NULL`; no se les pide nada. No hay flujo de «reaceptar» si cambian las condiciones (subir `TERMS_VERSION` solo afecta a cuentas nuevas).
- El texto de la casilla **no enlaza** las condiciones ni la política: aún no hay páginas públicas (siguen siendo borradores). Al publicarlas hay que añadir los enlaces en `CONSENT_TEXT`/`UserAuthForm`.
- Si alguien declara una edad falsa, la política ya dice que se eliminará la cuenta si se detecta; no hay herramienta para ello salvo el borrado manual por un administrador.

**Para revertir:** quitar la casilla y el cookie de `UserAuthForm.tsx`, el callback `signIn` y el evento `createUser` de `auth.ts` y (opcional) las dos columnas del esquema.

## 3. Exportación de datos (hueco 2, segunda parte)

**Antes**
- No había exportación ni descarga de ningún tipo: los derechos de acceso y portabilidad solo se podían atender a mano, consultando la base de datos.

**Ahora**
- **Ajustes → «Descargar mis datos»** (`src/components/ExportDataForm.tsx`) baja un archivo `fastlap-datos-<usuario>-<fecha>.json`.
- **`GET /api/account/export`** (`src/app/api/account/export/route.ts`): exige sesión, limita a 3 descargas por hora (`accountExportRatelimit`), responde con `Cache-Control: no-store` y solo devuelve los datos de quien lo pide.
- **`collectUserData`** (`src/lib/accountExport.ts`) reúne: perfil (id, nombre, correo, usuario, foto, rol, fechas), métodos de acceso (proveedor e identificador, sin tokens), comunidades que sigue y que creó, sus publicaciones y comentarios completos, sus votos, votos de Piloto del Día, pronósticos, notificaciones, denuncias que hizo y las decisiones de moderación sobre su contenido (acción, extracto y fecha).
- **No incluye:** cookies o tokens de sesión (son secretos, no datos de la persona), los votos y comentarios de otras personas sobre sus publicaciones, ni datos de terceros. Los textos de las publicaciones propias salen tal cual (el JSON de EditorJS).
- Formato JSON legible por máquina y por personas (portabilidad, art. 20 RGPD); lleva `exportVersion` por si el formato cambia.
- **Tests:** `src/lib/accountExport.test.ts` (nombre de archivo, y contra Postgres real: reúne lo propio y no filtra datos ajenos ni credenciales). La config de Vitest ejecuta los archivos en serie (`fileParallelism: false`) porque las pruebas con base de datos comparten una y la vacían.

**Límites conocidos (para el abogado)**
- Es una descarga inmediata, sin verificación extra: quien tenga la sesión abierta puede bajarse los datos (igual que puede ver su perfil y cambiar su nombre). No pide reautenticación.
- Para quien ya borró la cuenta no hay nada que exportar: exporta antes de eliminar.
- Los logs del servidor y del proveedor de alojamiento (IP, peticiones) no están en el archivo.
- No hay exportación de imágenes: el JSON contiene las URL de las que subió.

**Para revertir:** quitar `ExportDataForm` de `settings/page.tsx` y la carpeta `src/app/api/account/export`; `accountExport.ts` es código aislado. Sin cambios de esquema.

## 2. Borrado de cuenta (hueco 2, primera parte)

**Antes**
- No había forma de borrar la cuenta: ni botón, ni endpoint, ni script. Los derechos de supresión solo se podían atender a mano con SQL.
- Borrar un `User` a mano fallaba o destruía contenido, según la relación del esquema: `Post.author`, `Vote.user`, `CommentVote.user` y `Subscription.user` no tienen borrado en cascada (la base rechaza el borrado), mientras que `Comment.author` sí es `onDelete: Cascade` (borraría todos sus comentarios, y con ellos las respuestas de otras personas colgadas de ellos).
- `/api/username` aceptaba cualquier nombre libre, incluido «eliminado» o «fastlap».

**Ahora**
- **Ajustes → «Eliminar mi cuenta»** (`src/components/DeleteAccountForm.tsx`): hay que escribir el propio nombre de usuario para confirmar. Después se cierra la sesión.
- **`DELETE /api/account`** (`src/app/api/account/route.ts`): exige sesión, limita a 3 intentos por hora (`accountDeleteRatelimit`), comprueba rol y nombre de usuario en la base (no en el token) y llama a `deleteAccount`.
- **`deleteAccount`** (`src/lib/accountDeletion.ts`), en una sola transacción:
  - **Se conserva, anonimizado:** publicaciones y comentarios pasan a un usuario compartido «Usuario eliminado» (`u/eliminado`, `eliminado@fastlap.invalid`), para que los hilos y las respuestas de otras personas sigan teniendo sentido. El texto que escribió la persona sigue ahí: si quiere quitarlo, debe borrarlo *antes* (posts y comentarios propios, desde la propia web).
  - **Se borra:** el usuario (perfil, correo, nombre, foto, rol), sus cuentas de acceso y sesiones, votos de publicaciones y comentarios, suscripciones, pronósticos, votos de Piloto del Día, notificaciones y las denuncias que hizo.
  - **Se desvincula:** las comunidades que creó quedan sin creador (`creatorId = null`); en `ModerationLog`, el autor sale (`null`) y, si era el moderador, se sustituye por el usuario eliminado.
  - **Notificaciones de otros** que citaban su nombre («u/ana ha respondido…») pasan a «Un usuario ha respondido…».
  - **Caché Redis** de sus publicaciones populares: se invalida.
- **Reglas** (`src/lib/accountRules.ts`): una cuenta ADMIN no puede borrarse (hay que quitarle el rol antes, para no dejar la web sin administrador); los nombres `eliminado`, `fastlap`, `sistema`, `admin`, `administrador` y `moderador` están reservados en `/api/username`.
- **Tests:** `accountRules.test.ts` (reglas) y `accountDeletion.test.ts` (integración contra Postgres real; se salta sin `TEST_DATABASE_URL`). Se probó contra un Postgres local con el esquema de `prisma db push`.

**Límites conocidos (para el abogado)**
- Las imágenes que la persona subió a UploadThing (foto de perfil o dentro de sus posts) **no se borran** de UploadThing (la integración está en v4 y no se ha automatizado). La foto de perfil de Google es solo una URL de Google.
- Quien tenga la sesión abierta en **otro dispositivo** conserva su cookie (JWT) hasta que caduque; no puede escribir nada (la base lo rechaza) pero no se cierra sola. Mitigación pendiente: comprobar que el usuario existe al leer la sesión.
- **Exporta antes de borrar:** tras la baja ya no hay nada que descargar (ver el apartado 3).
- Los votos que dio se borran, así que las puntuaciones de publicaciones ajenas bajan.
- El texto de sus publicaciones y comentarios puede contener datos personales que ella misma escribió; se conserva (interés en la continuidad de las conversaciones), salvo que lo borre antes o lo pida por correo.

**Para revertir:** quitar `DeleteAccountForm` de `settings/page.tsx` y el endpoint `src/app/api/account`; el resto (`accountDeletion.ts`, reglas, límite) es código aislado. No hay cambios de esquema ni migraciones.

## 1. Embeds (hueco 1) y tokens de Google (hueco 3)

### 1.1 Contenido incrustado de terceros

**Antes**
- `src/components/Editor.tsx` importaba y activaba la herramienta Embed de EditorJS:
  ```ts
  const Embed = (await import('@editorjs/embed')).default
  // ...
  tools: { /* ... */ table: Table, embed: Embed }
  ```
  Un usuario podía pegar un enlace (YouTube, X, Vimeo…) y el post guardaba un bloque `{ type: 'embed', data: { service, source, embed, width, height, caption } }`.
- `src/components/EditorOutput.tsx` solo sobrescribía los renderizadores `image` y `code`; `embed` lo pintaba el de la librería `editorjs-react-renderer`, es decir, un `<iframe>` del tercero (con sus cookies y recibiendo la IP del lector).
- `src/lib/validators/post.ts` aceptaba cualquier tipo de bloque (`type: z.string()`), también `embed`.

**Ahora**
- El editor ya no ofrece Embed (no se importa ni se registra).
- `src/lib/validators/post.ts` rechaza en servidor cualquier bloque `embed` («No se admiten contenidos incrustados de otros sitios»), aunque alguien llame a la API a mano. Test: `src/lib/validators/post.test.ts`.
- `src/components/renderers/CustomEmbedRenderer.tsx`: los posts antiguos que ya tengan un bloque `embed` muestran **solo un enlace** a `data.source` (solo http/https), con `rel="noopener noreferrer nofollow ugc"`. No se carga nada de terceros. Si `source` no es una URL válida no se pinta nada.
- Se mantiene la herramienta de enlace con vista previa (`linkTool`, `/api/link`), que no incrusta nada.
- La dependencia `@editorjs/embed` sigue en `package.json` (sin usar) para no tocar `yarn.lock`; se puede quitar con `yarn remove @editorjs/embed`.
- Siguen existiendo imágenes subidas (UploadThing) y el bloque de imagen por URL, que también hacen que el navegador pida recursos a otros dominios (la IP llega a ese host, pero sin iframe ni cookies propias del contenido).

**Para revertir:** restaurar las tres cosas de «Antes» (import y `embed: Embed` en el editor, quitar el `embed` de `renderers`, quitar el `refine` del validador).

**Efecto en los textos legales:** la política de cookies pasa a la redacción (a) «solo imágenes y enlaces».

### 1.2 Tokens de Google

**Antes**
- `src/lib/auth.ts` usaba `adapter: PrismaAdapter(db)` sin más. Al iniciar sesión por primera vez, el adaptador guardaba en `Account` los campos `access_token`, `refresh_token` e `id_token` (además de `expires_at`, `token_type`, `scope`). La app no los usaba (sesión JWT, no llama a ninguna API de Google).

**Ahora**
- `src/lib/accountTokens.ts` (`stripProviderTokens`) quita esos tres campos y `src/lib/auth.ts` lo aplica en `linkAccount` del adaptador. Test: `src/lib/accountTokens.test.ts`.
- El esquema de Prisma **no cambia**: las columnas siguen existiendo, ahora quedan en `NULL` para las cuentas nuevas. Siguen guardándose `provider`, `providerAccountId`, `type`, `expires_at`, `token_type` y `scope` (no son credenciales).
- Las cuentas **ya existentes** conservan los tokens hasta que se limpien. Script (hazlo tú contra la base real, primero en simulación):
  ```bash
  DATABASE_URL=... node scripts/scrub-google-tokens.mjs          # cuenta, no cambia nada
  DATABASE_URL=... node scripts/scrub-google-tokens.mjs --apply  # los pone a NULL
  ```
  Nadie queda desconectado: la sesión es un JWT propio y no depende de esos campos. Hoy, además, no hay despliegue ni base de producción con usuarios.

**Para revertir:** volver a `adapter: PrismaAdapter(db)` en `auth.ts`. Los tokens ya borrados no se pueden recuperar (solo se volverían a guardar en el siguiente inicio de sesión).

**Efecto en los textos legales:** el inventario deja de listar los tokens como dato guardado.
