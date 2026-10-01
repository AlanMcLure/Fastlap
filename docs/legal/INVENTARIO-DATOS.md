# Inventario de datos personales de FastLap

Estado: verificado contra el código a fecha de esta versión. Es la base de la política de privacidad. Si una función cambia, este documento debe cambiar con ella. Las columnas «base jurídica» y «conservación» son **propuestas** para el abogado, no decisiones tomadas.

## 1. Qué datos se tratan

| # | Datos | De dónde salen | Dónde se guardan | Para qué | ¿Quién los ve? | Base jurídica (propuesta) | Conservación |
|---|---|---|---|---|---|---|---|
| 1 | **Cuenta**: correo, nombre, foto de perfil (de Google), identificador interno, fecha de alta, rol | Inicio de sesión con Google | Base de datos (`User`) | Crear y mantener la cuenta | El usuario ve su correo y nombre en el menú; el resto de usuarios **no** ven el correo | Ejecución del contrato (art. 6.1.b RGPD) | [PENDIENTE: mientras exista la cuenta + plazo] |
| 2 | **Nombre de usuario** (se asigna uno aleatorio al registrarse; el usuario puede cambiarlo) | Generado / usuario | `User.username` | Identificarse en la comunidad | **Público** (publicaciones, comentarios, perfil, búsqueda, clasificaciones, tarjetas para compartir) | Contrato | Igual que la cuenta |
| 3 | **Tokens de Google** (acceso, refresco, identidad) | Google, al iniciar sesión | `Account` | Los guarda el adaptador de inicio de sesión; **la aplicación no los usa** | Nadie (solo el sistema) | — (ver «huecos técnicos» en el README: conviene no guardarlos) | Mientras exista la cuenta |
| 4 | **Sesión**: cookie técnica con un token firmado (JWT) que incluye identificador, nombre, correo, nombre de usuario y rol | Servidor | Navegador del usuario | Mantener la sesión iniciada | El propio usuario | Contrato / exención de consentimiento por ser necesaria | Hasta cerrar sesión o caducar |
| 5 | **Publicaciones, comentarios y respuestas** (texto, imágenes, enlaces) | Usuario | Base de datos (`Post`, `Comment`); copia temporal en Redis de las publicaciones populares | Prestar el servicio | **Público** (cualquiera, sin cuenta) y buscadores | Contrato | Hasta que el autor o un moderador lo borre [PENDIENTE: política tras baja] |
| 6 | **Votos** a publicaciones y comentarios | Usuario | `Vote`, `CommentVote` | Ordenar y contar | Solo se muestra el total; el voto individual no se publica, pero es dato del usuario | Contrato | Mientras exista la cuenta |
| 7 | **Comunidades**: creadas y a las que se sigue | Usuario | `Subreddit`, `Subscription` | Servicio | El perfil público muestra cuántas comunidades ha creado; no se muestra el listado de miembros de una comunidad, solo su número | Contrato | Mientras exista la cuenta |
| 8 | **Pronósticos** (podio y vuelta rápida), ligas abiertas | Usuario | `Prediction`, `PredictionLeague` | Ligas y clasificaciones | **Público** en clasificaciones y perfiles (puntos, aciertos, racha, insignias) | Contrato | Mientras exista la cuenta [PENDIENTE: histórico] |
| 9 | **Votación de Piloto del Día** | Usuario | `DriverOfDayVote` | Servicio | Solo el recuento | Contrato | Mientras exista la cuenta |
| 10 | **Notificaciones** (avisos de comentarios, cierres y puntos) | Sistema | `Notification` | Avisar al usuario | Solo su destinatario | Contrato | [PENDIENTE: p. ej. 12 meses] |
| 11 | **Denuncias**: quién denuncia, qué, motivo y texto libre (≤ 300 caracteres) | Usuario | `Report` | Moderación | Administradores | Interés legítimo en moderar el servicio (6.1.f) y obligaciones de la normativa de servicios digitales | Hasta resolver; se borran con el contenido |
| 12 | **Registro de moderación**: qué se hizo, extracto del contenido, autor, número de denuncias | Administradores | `ModerationLog` | Trazabilidad de decisiones | Administradores | Interés legítimo / obligación legal | [PENDIENTE] |
| 13 | **Imágenes subidas** (perfil y publicaciones) | Usuario | UploadThing (tercero) | Alojar imágenes | Públicas por su URL | Contrato | Hasta que se borren de la publicación; **no se borran de UploadThing automáticamente** |
| 14 | **Límites de uso** (anti-abuso): contadores por identificador de usuario, ventanas de segundos o minutos | Sistema | Redis (Upstash) | Evitar abusos | Nadie | Interés legítimo (seguridad) | Segundos a 1 día |
| 15 | **Preferencia de tema** (claro/oscuro) | Usuario | `localStorage` del navegador | Recordar el tema | Nadie | Exención (preferencia solicitada por el usuario) | Hasta que el usuario lo borre |
| 16 | **Registros del servidor** (accesos, errores) | Alojamiento | [PENDIENTE: proveedor] — pueden incluir la **dirección IP** | Seguridad y diagnóstico | Titular / proveedor | Interés legítimo | [PENDIENTE] |
| 17 | **Vista previa de enlaces**: al pegar un enlace en una publicación, el servidor lo visita para leer su título e imagen | Usuario | No se guarda como dato personal | Servicio | — | Contrato | — |

No se usa **analítica**, **publicidad**, **seguimiento** ni perfilado. No hay correos electrónicos de la aplicación (solo se usa el correo para identificar la cuenta). No se recogen datos de categorías especiales.

## 2. Terceros que reciben datos

| Tercero | Qué recibe | Por qué | Notas para el abogado |
|---|---|---|---|
| **Google** (inicio de sesión) | Se identifica al usuario ante Google | Autenticación | Alcance solicitado: identificador, correo, nombre y foto (valores por defecto de Auth.js). Google es responsable independiente de sus propios datos |
| **Alojamiento de la aplicación** [PENDIENTE] | Todo el tráfico y los registros | Servir la web | Encargado del tratamiento: contrato de encargo (art. 28 RGPD) |
| **Base de datos PostgreSQL** [PENDIENTE: p. ej. Neon u otro] | Todos los datos de la tabla anterior | Almacenar | Encargado; región |
| **Upstash (Redis)** | Contadores por identificador de usuario; copia temporal de publicaciones populares | Anti-abuso y caché | Encargado; región |
| **UploadThing** | Imágenes subidas y su IP al subirlas | Alojar imágenes | Encargado; dónde se alojan |
| **Stripe** (solo si se activa Premium; hoy oculto) | Correo y datos de pago | Cobro | Responsable independiente en parte; ver condiciones de Premium |
| **Jolpica-F1** | Ninguno: la aplicación consulta datos de carreras desde el servidor, sin datos de usuarios | Datos de F1 | Licencia CC BY-NC-SA 4.0; no comercial |
| **Sitios enlazados o incrustados** en publicaciones | Su IP y datos de navegación al cargar contenido de terceros | Contenido de los usuarios | **Ver «huecos técnicos» 1**: las incrustaciones pueden poner cookies de terceros |
| **Imágenes de publicaciones alojadas fuera** (cualquier host https) | La IP del lector (la web pide `no-referrer`) | Mostrar la imagen | Riesgo bajo; mencionar en la política |

**Transferencias fuera del EEE:** probables con Google, UploadThing, Upstash y Stripe (EE. UU.). [PENDIENTE: comprobar para cada proveedor la región elegida y el mecanismo — decisión de adecuación del Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo].

## 3. Derechos de las personas (cómo se atienden hoy)

| Derecho | Estado |
|---|---|
| Acceso, rectificación | El usuario puede cambiar su nombre de usuario y su imagen en Ajustes. El resto, por correo |
| Supresión | **Solo por correo y a mano.** No hay botón de baja; las publicaciones están ligadas al autor sin borrado en cascada (ver README, hueco 2) |
| Portabilidad | **No hay exportación**; solo a mano |
| Oposición / limitación | Por correo |
| Retirar contenido propio | El autor puede borrar sus publicaciones y comentarios |
| Reclamación | Agencia Española de Protección de Datos (aepd.es) |

## 4. Medidas de seguridad existentes (resumen)

HTTPS y cabeceras de seguridad (HSTS, `nosniff`, `Referrer-Policy`, anti-incrustación); sesión por cookie firmada; roles; límites de uso; validación de entradas en servidor; protección contra peticiones a direcciones internas en la vista previa de enlaces; imágenes subidas solo por usuarios con sesión (máx. 4 MB). **Pendiente:** política de seguridad de contenido (CSP), registro de errores externo, copias de seguridad probadas (ver `docs/DESPLIEGUE.md`).
