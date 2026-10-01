# Política de cookies y almacenamiento local (borrador)

> Borrador para revisión profesional (art. 22.2 LSSI-CE y guía de la AEPD sobre cookies). Los `[PENDIENTE]` los completa el titular. Las incrustaciones están desactivadas (ver [CAMBIOS-TECNICOS.md](CAMBIOS-TECNICOS.md)); este texto deja de ser cierto si se vuelven a permitir. Versión: [PENDIENTE: fecha].

## 1. Qué usamos

FastLap **solo usa cookies y almacenamiento técnicos, necesarios para el funcionamiento** de la web. No usamos cookies de analítica, publicidad ni seguimiento, por lo que **no se muestra un aviso de consentimiento**: la normativa exime de él a las cookies estrictamente necesarias para prestar el servicio que el usuario solicita.

| Nombre | Tipo | Finalidad | Duración |
|---|---|---|---|
| `authjs.session-token` (en HTTPS: `__Secure-authjs.session-token`) | Cookie propia, técnica | Mantener tu sesión iniciada | [PENDIENTE: la caducidad que fije la configuración de inicio de sesión; por defecto 30 días] |
| `authjs.csrf-token` (en HTTPS: `__Host-authjs.csrf-token`) | Cookie propia, técnica | Protección contra falsificación de peticiones en el inicio de sesión | Sesión |
| `authjs.callback-url` (en HTTPS: `__Secure-authjs.callback-url`) | Cookie propia, técnica | Volver a la página en la que estabas tras iniciar sesión | Sesión |
| `theme` | Almacenamiento local (`localStorage`), técnico | Recordar si prefieres el tema claro u oscuro | Hasta que lo borres |
| Caché del navegador (service worker) | Almacenamiento local, técnico | Guardar archivos estáticos de la aplicación (iconos, scripts) para que cargue más rápido y una página «sin conexión» | Hasta que se actualice la aplicación o lo borres |

Solo se crean las cookies de inicio de sesión cuando inicias sesión (las de CSRF y de retorno, durante el proceso). Si no tienes cuenta, el navegador solo guarda la preferencia de tema si la cambias y los archivos estáticos.

## 2. Inicio de sesión con Google

Al pulsar «Google» te redirigimos a `accounts.google.com`. Allí Google puede usar **sus** cookies, que se rigen por sus políticas. FastLap no las controla.

## 3. Contenido de terceros en las publicaciones

Los usuarios pueden publicar **imágenes alojadas en otros sitios** y enlaces. Al cargar una imagen externa, ese sitio recibe tu dirección IP. **No se admiten contenidos incrustados de terceros** (vídeos, tuits, etc.): se muestran solo como enlace, y no cargan nada hasta que tú lo abres. [PENDIENTE: el abogado debe confirmar esta redacción.]

## 4. Cómo gestionarlas

Puedes borrar o bloquear las cookies desde la configuración de tu navegador (Chrome, Firefox, Safari, Edge). Si bloqueas las cookies técnicas, no podrás iniciar sesión.

## 5. Contacto

[PENDIENTE: correo]. Más información sobre el tratamiento de tus datos en la [Política de privacidad](POLITICA-PRIVACIDAD.md).
