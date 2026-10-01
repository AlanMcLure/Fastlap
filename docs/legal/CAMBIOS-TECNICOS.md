# Cambios técnicos hechos por motivos legales

Registro de lo que se cambió en el código a raíz de los «huecos técnicos» del [README](README.md), con **cómo estaba antes** para poder revertirlo o explicárselo al abogado. Más reciente primero.

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
