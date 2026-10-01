# Cambios técnicos hechos por motivos legales

Registro de lo que se cambió en el código a raíz de los «huecos técnicos» del [README](README.md), con **cómo estaba antes** para poder revertirlo o explicárselo al abogado. Más reciente primero.

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
- **No hay exportación de datos** (portabilidad): sigue siendo un hueco.
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
