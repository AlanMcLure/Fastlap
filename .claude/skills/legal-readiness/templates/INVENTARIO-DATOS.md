# Inventario de datos personales de [PROYECTO]

> Borrador técnico verificado contra el código en [FECHA / commit]. No es asesoramiento legal.

## 1. Qué datos se tratan

| # | Datos | De dónde salen | Dónde se guardan (y código) | Para qué | ¿Quién los ve? | Base jurídica (propuesta) | Conservación |
|---|---|---|---|---|---|---|---|
| 1 | **Cuenta**: [correo, nombre, foto, id, fecha de alta, rol…] | [Inicio de sesión con…] | [tabla / archivo] | Crear y mantener la cuenta | [Solo el usuario / público] | Ejecución del contrato (art. 6.1.b) | [PENDIENTE] |
| 2 | **Sesión y cookies** | Servidor | Navegador | Mantener la sesión | El usuario | Exención (técnica) | [PENDIENTE] |
| 3 | **Contenido que publica el usuario** | Usuario | [tablas] | Prestar el servicio | **Público** | Contrato | Mientras exista / [PENDIENTE] |
| 4 | **Actividad**: votos, suscripciones, preferencias | Usuario | [tablas] | Prestar el servicio | [..] | Contrato | [..] |
| 5 | **Notificaciones** | Sistema | [..] | Avisar | El usuario | Contrato | [..] |
| 6 | **Moderación**: denuncias y decisiones | Usuarios, administradores | [..] | Mantener las normas | Administradores | Interés legítimo / obligación legal | [PENDIENTE] |
| 7 | **Archivos subidos** | Usuario | [proveedor] | Alojar | [Público por URL] | Contrato | [¿se borran al borrar la cuenta?] |
| 8 | **Límites de uso y logs**: IP, identificadores, peticiones | Sistema | [..] | Seguridad | Nadie | Interés legítimo | [PENDIENTE] |
| 9 | **Copias de seguridad, cachés** | Sistema | [..] | Continuidad | Nadie | Interés legítimo | [PENDIENTE] |

(Añade o quita filas: lo que no exista, fuera; lo que exista y falte aquí, es un error.)

## 2. Terceros que reciben datos

| Tercero | Qué recibe | Por qué | Notas (encargado, región, transferencias) |
|---|---|---|---|
| [Proveedor de identidad] | | Autenticación | Responsable independiente |
| [Base de datos / alojamiento] | | | Encargado; [PENDIENTE: región y contrato] |
| [Otros: correo, pagos, analítica, mapas, fuentes, CDN] | | | |
| **Sitios enlazados o incrustados** por los usuarios | Su IP al cargar | Contenido de usuarios | Si hay iframes, cookies de terceros |

**Transferencias fuera del EEE:** [PENDIENTE: mecanismo por proveedor].

## 3. Derechos de las personas

| Derecho | Estado |
|---|---|
| Acceso, rectificación | [qué puede hacer el usuario solo / por correo] |
| Supresión | [botón / a mano] |
| Portabilidad | [exportación / a mano] |
| Oposición / limitación | [por correo] |
| Retirar contenido propio | [..] |

## 4. Medidas de seguridad (solo las reales)
[HTTPS y cabeceras, sesión firmada, roles, límites de uso, validación de entradas, protección SSRF, secretos fuera del repositorio…]

## 5. Lo que NO hace la aplicación (también hay que comprobarlo)
[Sin analítica, sin publicidad, sin correos de marketing, sin perfilado, sin pagos… cada afirmación con su prueba en el código.]
