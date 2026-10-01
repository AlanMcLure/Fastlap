# Política de privacidad (borrador)

> Borrador para revisión profesional (RGPD, LOPDGDD). Describe el tratamiento que realiza la aplicación hoy; ver [INVENTARIO-DATOS.md](INVENTARIO-DATOS.md) para el detalle y las referencias al código. Los `[PENDIENTE]` los completa el titular. Versión: [PENDIENTE: fecha].

## 1. Responsable del tratamiento

- **Responsable:** [PENDIENTE: titular — nombre o razón social] · NIF/CIF [PENDIENTE]
- **Domicilio:** [PENDIENTE]
- **Contacto para cuestiones de privacidad y para ejercer tus derechos:** [PENDIENTE: confirmar `fastlapsoporte@gmail.com`]
- **Delegado de protección de datos:** no se ha designado [PENDIENTE: el abogado confirmará si es obligatorio; en principio no lo es para un proyecto de este tamaño].

## 2. Qué datos tratamos y para qué

| Datos | Finalidad | Base jurídica |
|---|---|---|
| **Cuenta**: correo electrónico, nombre y foto de perfil que nos facilita Google al iniciar sesión, identificador interno y fecha de alta | Crear y mantener tu cuenta; que puedas iniciar sesión | Ejecución del contrato: prestarte el servicio que solicitas (art. 6.1.b RGPD) |
| **Nombre de usuario** (te asignamos uno aleatorio y puedes cambiarlo en Ajustes) | Identificarte en la comunidad | Ejecución del contrato |
| **Tu actividad**: publicaciones, comentarios, imágenes, votos, comunidades que sigues o creas, pronósticos y votaciones de Piloto del Día | Prestar el servicio: que puedas participar, y calcular puntos y clasificaciones | Ejecución del contrato |
| **Notificaciones** que genera la aplicación para ti | Avisarte de respuestas, cierres de pronósticos y puntos | Ejecución del contrato |
| **Denuncias** que envíes o que se hagan sobre tu contenido y las decisiones de moderación | Mantener una comunidad segura y cumplir las normas | Interés legítimo en moderar el servicio (art. 6.1.f) y obligaciones legales aplicables |
| **Contadores técnicos de uso** (por identificador de usuario) y **registros del servidor** (que pueden incluir tu dirección IP) | Seguridad, prevención de abusos y diagnóstico de errores | Interés legítimo (art. 6.1.f) |
| **Preferencia de tema** claro u oscuro, en tu navegador | Recordar tu elección | Es una preferencia que tú has pedido; no sale de tu dispositivo |

**No** usamos analítica, publicidad ni seguimiento, **no** elaboramos perfiles con efectos sobre ti, **no** te enviamos correos comerciales y **no** tratamos datos de categorías especiales. No tomamos decisiones automatizadas con efectos jurídicos: los puntos de las ligas se calculan automáticamente con resultados deportivos, sin consecuencias fuera del juego.

## 3. Qué es público

Lo que publicas es **público**, visible para cualquiera sin cuenta y puede aparecer en buscadores: tu nombre de usuario, tu foto de perfil, tus publicaciones, comentarios e imágenes, tu perfil (fecha de alta, publicaciones, comunidades creadas, estadísticas de pronósticos e insignias) y tu posición en las clasificaciones. Esos datos también aparecen en las **imágenes que se generan para compartir** enlaces. **Tu correo no se muestra a otros usuarios.** No publiques datos personales tuyos o de terceros en el contenido que escribas.

## 4. Con quién compartimos datos

Para ofrecer el servicio usamos proveedores que tratan datos por nuestra cuenta (encargados del tratamiento):

- **Alojamiento de la aplicación:** [PENDIENTE: proveedor, país].
- **Base de datos:** [PENDIENTE: proveedor, región].
- **Upstash (Redis):** contadores de uso y copia temporal de publicaciones populares.
- **UploadThing:** alojamiento de las imágenes que subes.
- **Google:** el inicio de sesión se hace con tu cuenta de Google. Google trata tus datos conforme a su propia política; nosotros solo recibimos tu identificador, correo, nombre y foto.
- **Stripe:** solo si se activa en el futuro la suscripción Premium (hoy no está disponible).

No vendemos tus datos. Las consultas de datos de Fórmula 1 se hacen desde nuestro servidor a Jolpica-F1 sin enviar datos tuyos.

**Transferencias internacionales.** Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo (por ejemplo, en EE. UU.). En ese caso se apoyan en [PENDIENTE: mecanismo — decisión de adecuación del Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo de la Comisión Europea]. Puedes pedirnos más información.

**Contenido de terceros.** Las publicaciones pueden incluir imágenes de otros sitios, que reciben tu dirección IP al cargarlas, y enlaces. No se admiten contenidos incrustados de terceros. Consulta la [Política de cookies](POLITICA-COOKIES.md).

## 5. Cuánto tiempo conservamos los datos

- **Cuenta y actividad:** mientras tengas cuenta. Si eliminas tu cuenta, se borran tu perfil, votos, suscripciones, pronósticos y notificaciones; tus publicaciones y comentarios se conservan sin tu nombre, como «Usuario eliminado» (puedes borrarlos tú antes). [PENDIENTE: el abogado debe confirmar esta redacción y la base para conservar el texto anonimizado].
- **Notificaciones:** [PENDIENTE: plazo].
- **Denuncias:** hasta su resolución; se eliminan junto con el contenido denunciado. **Registro de decisiones de moderación:** [PENDIENTE: plazo].
- **Contadores técnicos:** de segundos a un día. **Registros del servidor:** [PENDIENTE: plazo del proveedor].
- Podemos conservar datos bloqueados durante los plazos de prescripción de posibles responsabilidades.

## 6. Tus derechos

Puedes ejercer los derechos de **acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad** escribiendo a [PENDIENTE: correo], indicando tu nombre de usuario y el derecho que ejerces. Respondemos en el plazo de un mes (ampliable en casos complejos). Es posible que te pidamos que acredites tu identidad.

- Puedes **cambiar tu nombre de usuario y tu imagen** en Ajustes, **borrar tus publicaciones y comentarios** tú mismo **descargar una copia de tus datos** y **eliminar tu cuenta** desde Ajustes.
- Si consideras que no tratamos tus datos conforme a la normativa, puedes **reclamar ante la Agencia Española de Protección de Datos** (www.aepd.es).

## 7. Menores

Para registrarte debes tener **al menos 14 años**: al crear la cuenta lo declaras marcando una casilla y guardamos la fecha en que lo hiciste y la versión de las condiciones aceptadas. No podemos comprobar tu edad. Si eres menor de 14 años, no uses la web; si detectamos una cuenta de una persona menor de esa edad, la eliminaremos.

## 8. Seguridad

Aplicamos medidas técnicas y organizativas razonables: conexión cifrada (HTTPS), sesión por cookie firmada, control de roles, límites de uso frente a abusos, validación de las entradas y acceso restringido a los datos. Ningún sistema es infalible: si hubiera una brecha de seguridad con riesgo para tus derechos, te lo comunicaremos y lo notificaremos a la autoridad cuando proceda.

## 9. Cambios en esta política

Si cambiamos esta política de forma relevante, lo indicaremos en la web con antelación razonable. La fecha de la versión vigente figura al principio.
